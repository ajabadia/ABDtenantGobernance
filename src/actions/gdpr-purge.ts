/**
 * @purpose Gestiona el proceso de eliminación del GDPR para un usuario a través de múltiples servicios satelitales.
 * @purpose_en Orchestrates the GDPR purge process for a user across multiple satellite services.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:6g2z21
 * @lastUpdated 2026-06-25T09:22:33.947Z
 */

'use server';

import { revalidatePath } from 'next/cache';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, getTenantConnection } from '@ajabadia/satellite-sdk/db';;
import { getAuditLogModel } from '@/models/AuditLog';
import { AuditService } from '@/services/tenant/audit-service';

interface SatelliteResult {
  satellite: string;
  success: boolean;
  details?: string;
  error?: string;
}

interface PurgeResult {
  userId: string;
  tenantId: string;
  satellites: SatelliteResult[];
}

function getSatelliteUrl(name: string): string | undefined {
  const envMap: Record<string, string> = {
    auth: 'AUTH_PROVIDER_URL',
    quiz: 'QUIZ_SERVICE_URL',
    files: 'FILES_SERVICE_URL',
    logs: 'LOGS_SERVICE_URL',
  };
  return process.env[envMap[name]];
}

export async function orchestrateGdprPurge(
  userId: string,
  tenantId: string,
  email?: string
): Promise<PurgeResult> {
  const user = await ensureIndustrialAccess('SUPER_ADMIN');
  const results: SatelliteResult[] = [];

  // 1. ABDtenantGobernance (self - in-process)
  try {
    await connectDB();
    const conn = getTenantConnection('gobernanza', 'COLLECTION_PREFIX');
    const AuditLog = getAuditLogModel(conn);
    const auditResult = await AuditLog.updateMany(
      { tenantId, $or: [{ userId }, ...(email ? [{ userEmail: email }] : [])] },
      { $set: { userId: '[GDPR_ERASED]', userEmail: '[GDPR_ERASED]', ipAddress: '[GDPR_ERASED]' } }
    );

    const models = ['DelegatedRole', 'UserGroupMembership'];
    for (const name of models) {
      const model = conn.models[name];
      if (model) {
        await model.deleteMany({ tenantId, userId });
      }
    }

    results.push({ satellite: 'gobernanza', success: true, details: `Audit logs anonymized: ${auditResult.modifiedCount}` });
  } catch (err) {
    results.push({ satellite: 'gobernanza', success: false, error: String(err) });
  }

  // 2. ABDAuth
  const authUrl = getSatelliteUrl('auth');
  if (authUrl) {
    try {
      const res = await fetch(`${authUrl}/api/internal/gdpr/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET}`,
        },
        body: JSON.stringify({ userId, tenantId, email }),
      });
      const data = await res.json();
      results.push({ satellite: 'auth', success: res.ok, details: JSON.stringify(data.purged || data), error: data.error });
    } catch (err) {
      results.push({ satellite: 'auth', success: false, error: String(err) });
    }
  }

  // 3. ABDQuiz
  const quizUrl = getSatelliteUrl('quiz');
  if (quizUrl) {
    try {
      const res = await fetch(`${quizUrl}/api/internal/gdpr/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET}`,
        },
        body: JSON.stringify({ userId, tenantId, email }),
      });
      const data = await res.json();
      results.push({ satellite: 'quiz', success: res.ok, details: JSON.stringify(data.purged || data), error: data.error });
    } catch (err) {
      results.push({ satellite: 'quiz', success: false, error: String(err) });
    }
  }

  // 4. ABDFiles
  const filesUrl = getSatelliteUrl('files');
  if (filesUrl) {
    try {
      const res = await fetch(`${filesUrl}/api/internal/gdpr/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET}`,
        },
        body: JSON.stringify({ userId, tenantId }),
      });
      const data = await res.json();
      results.push({ satellite: 'files', success: res.ok, details: JSON.stringify(data.purged || data), error: data.error });
    } catch (err) {
      results.push({ satellite: 'files', success: false, error: String(err) });
    }
  }

  // 5. ABDLogs (anonymize)
  const logsUrl = getSatelliteUrl('logs');
  if (logsUrl) {
    try {
      const res = await fetch(`${logsUrl}/api/admin/compliance/forget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGS_SECRET_TOKEN}`,
        },
        body: JSON.stringify({ targetUser: email || userId, tenantId }),
      });
      const data = await res.json();
      results.push({ satellite: 'logs', success: res.ok, details: JSON.stringify(data), error: data.error });
    } catch (err) {
      results.push({ satellite: 'logs', success: false, error: String(err) });
    }
  }

  await AuditService.logEvent({
    tenantId: user.tenantId,
    action: 'GDPR_PURGE_ORCHESTRATED',
    entityType: 'USER',
    entityId: userId,
    userId: user.id,
    userEmail: user.email,
    changedFields: { targetUserId: userId, targetTenantId: tenantId, results },
  });

  revalidatePath('/admin/gdpr');
  return { userId, tenantId, satellites: results };
}
