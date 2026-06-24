/**
 * @purpose Gestiona roles de quiz para inquilinos mediante la recopilación, asignación y bulk-assignación de roles.
 * @purpose_en Manages quiz roles for tenants by fetching, assigning, and bulk-assigning roles.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:4,sig:rlkdz1
 * @lastUpdated 2026-06-24T10:34:36.560Z
 */

'use server'

import { connectDB, ensureIndustrialAccess, withTenantContext } from '@ajabadia/satellite-sdk';
import { getExplicitContext } from '@/services/tenant/tenant-context-helper';
import QuizUserRole, { type IQuizUserRole } from '@/models/QuizUserRole';
import { AuditService } from '@/services/tenant/audit-service';

async function withQuizCtx<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const ctx = await getExplicitContext(tenantId);
  return withTenantContext(fn, ctx);
}

export async function fetchQuizRolesAction(tenantId: string, filters?: { scopeType?: string; scopeId?: string }): Promise<{ data?: Partial<IQuizUserRole>[]; error?: string }> {
  try {
    return await withQuizCtx(tenantId, async () => {
      await ensureIndustrialAccess('ADMIN'); await connectDB();
      const query: Record<string, unknown> = { tenantId };
      if (filters?.scopeType) query.scopeType = filters.scopeType;
      if (filters?.scopeId) query.scopeId = filters.scopeId;
      const roles = await QuizUserRole.find(query).sort({ createdAt: -1 }).lean();
      return { data: roles.map((r) => ({ ...r, _id: String(r._id) })) as unknown as Partial<IQuizUserRole>[] };
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'QUIZ_ROLE_FETCH_ERROR',
      entityType: 'CONFIG',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[QUIZ_ROLES] fetchQuizRolesAction:', msg);
    return { error: msg };
  }
}

export async function assignQuizRoleAction(tenantId: string, data: { userId: string; scopeType: 'space' | 'course' | 'exam_config'; scopeId: string; roleType: 'CREATOR' | 'AUDITOR' }): Promise<{ data?: Partial<IQuizUserRole>; error?: string }> {
  try {
    return await withQuizCtx(tenantId, async () => {
      const user = await ensureIndustrialAccess('ADMIN'); await connectDB();
      const role = await QuizUserRole.create({ tenantId, userId: data.userId, scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType, assignedBy: user.id });
      const obj = role.toObject();
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_ASSIGN_SUCCESS',
        entityType: 'CONFIG',
        entityId: String(obj._id),
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { targetUserId: data.userId, scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType },
      });
      return { data: { ...obj, _id: String(obj._id) } as unknown as Partial<IQuizUserRole> };
    });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) return { error: 'DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito' };
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'QUIZ_ROLE_ASSIGN_ERROR',
      entityType: 'CONFIG',
      entityId: data.userId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[QUIZ_ROLES] assignQuizRoleAction:', msg);
    return { error: msg };
  }
}

export async function revokeQuizRoleAction(roleId: string, tenantId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    return await withQuizCtx(tenantId, async () => {
      const user = await ensureIndustrialAccess('ADMIN'); await connectDB();
      const result = await QuizUserRole.deleteOne({ _id: roleId, tenantId });
      if (result.deletedCount === 0) return { error: 'ROLE_NOT_FOUND: No se encontró el rol especificado' };
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_REVOKE_SUCCESS',
        entityType: 'CONFIG',
        entityId: roleId,
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: {},
      });
      return { success: true };
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'QUIZ_ROLE_REVOKE_ERROR',
      entityType: 'CONFIG',
      entityId: roleId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[QUIZ_ROLES] revokeQuizRoleAction:', msg);
    return { error: msg };
  }
}

export async function bulkAssignQuizRolesAction(tenantId: string, data: { userIds: string[]; scopeType: 'space' | 'course' | 'exam_config'; scopeId: string; roleType: 'CREATOR' | 'AUDITOR' }): Promise<{ data?: { assigned: number; skipped: number }; error?: string }> {
  try {
    return await withQuizCtx(tenantId, async () => {
      const user = await ensureIndustrialAccess('ADMIN'); await connectDB();
      const docs = data.userIds.map((userId) => ({ tenantId, userId, scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType, assignedBy: user.id }));
      const result = await QuizUserRole.insertMany(docs, { ordered: false });
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_BULK_ASSIGN_SUCCESS',
        entityType: 'CONFIG',
        entityId: 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType, assigned: result.length, total: data.userIds.length },
      });
      return { data: { assigned: result.length, skipped: data.userIds.length - result.length } };
    });
  } catch (error: unknown) {
    const err = error as { writeErrors?: unknown[]; insertedCount?: number };
    const inserted = err.insertedCount ?? 0;
    const skipped = data.userIds.length - inserted;
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'QUIZ_ROLE_BULK_ASSIGN_ERROR',
      entityType: 'CONFIG',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: `partial: assigned=${inserted}, skipped=${skipped}` },
    });
    return { data: { assigned: inserted, skipped }, error: skipped > 0 ? `DUPLICATE_ROLE: ${skipped} usuario(s) ya tenían rol asignado` : undefined };
  }
}

