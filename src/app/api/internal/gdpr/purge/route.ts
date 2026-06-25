/**
 * @purpose Gestiona el proceso de eliminación de datos para cumplir con la normativa GDPR al anonimizar los registros de auditoría y eliminar entradas relacionadas en una base de datos de un inquilino.
 * @purpose_en Handles the purge operation for GDPR compliance by anonymizing audit logs and deleting related entries in a tenant's database.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:15x7do0
 * @lastUpdated 2026-06-25T09:22:58.723Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getTenantConnection } from '@ajabadia/satellite-sdk/db';
import { getAuditLogModel } from '@/models/AuditLog';
import { z } from 'zod';

const PurgeSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  email: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!secret || secret !== process.env.ABD_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const body = PurgeSchema.parse(raw);

    await connectDB();

    // 1. Anonymize audit logs (same pattern as ABDLogs)
    const defaultConn = getTenantConnection('gobernanza', 'COLLECTION_PREFIX');
    const AuditLog = getAuditLogModel(defaultConn);
    const auditResult = await AuditLog.updateMany(
      { tenantId: body.tenantId, $or: [{ userId: body.userId }, ...(body.email ? [{ userEmail: body.email }] : [])] },
      { $set: { userId: '[GDPR_ERASED]', userEmail: '[GDPR_ERASED]', ipAddress: '[GDPR_ERASED]' } }
    );

    // 2. Delete DelegatedRole entries (both as delegator and delegatee)
    const DelegatedRole = defaultConn.models.DelegatedRole;
    let delegatedResult = { deletedCount: 0 };
    if (DelegatedRole) {
      const dResult = await DelegatedRole.deleteMany({
        tenantId: body.tenantId,
        $or: [{ delegatorId: body.userId }, { delegateeId: body.userId }]
      });
      delegatedResult = { deletedCount: dResult.deletedCount };
    }

    // 3. Delete UserGroupMembership entries
    const UserGroupMembership = defaultConn.models.UserGroupMembership;
    let membershipResult = { deletedCount: 0 };
    if (UserGroupMembership) {
      const mResult = await UserGroupMembership.deleteMany({ tenantId: body.tenantId, userId: body.userId });
      membershipResult = { deletedCount: mResult.deletedCount };
    }

    return NextResponse.json({
      success: true,
      tenantId: body.tenantId,
      userId: body.userId,
      purged: {
        auditLogs: auditResult.modifiedCount,
        delegatedRoles: delegatedResult.deletedCount,
        groupMemberships: membershipResult.deletedCount,
      }
    });
  } catch (error) {
    console.error('[GDPR_PURGE_ERROR]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
