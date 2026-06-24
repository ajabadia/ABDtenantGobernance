/**
 * @purpose Gestiona roles de quiz para inquilinos mediante la recopilación, asignación y bulk-assignación de roles.
 * @purpose_en Manages quiz roles for tenants by fetching, assigning, and bulk-assigning roles.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:3,sig:s7skwe
 * @lastUpdated 2026-06-23T20:39:35.443Z
 */

'use server'

import { connectDB, ensureIndustrialAccess, withTenantContext } from '@ajabadia/satellite-sdk';
import { getExplicitContext } from '@/services/tenant/tenant-context-helper';
import QuizUserRole, { type IQuizUserRole } from '@/models/QuizUserRole';

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
      return { data: { ...obj, _id: String(obj._id) } as unknown as Partial<IQuizUserRole> };
    });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) return { error: 'DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito' };
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QUIZ_ROLES] assignQuizRoleAction:', msg);
    return { error: msg };
  }
}

export async function revokeQuizRoleAction(roleId: string, tenantId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    return await withQuizCtx(tenantId, async () => {
      await ensureIndustrialAccess('ADMIN'); await connectDB();
      const result = await QuizUserRole.deleteOne({ _id: roleId, tenantId });
      if (result.deletedCount === 0) return { error: 'ROLE_NOT_FOUND: No se encontró el rol especificado' };
      return { success: true };
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
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
      return { data: { assigned: result.length, skipped: data.userIds.length - result.length } };
    });
  } catch (error: unknown) {
    const err = error as { writeErrors?: unknown[]; insertedCount?: number };
    const inserted = err.insertedCount ?? 0;
    const skipped = data.userIds.length - inserted;
    return { data: { assigned: inserted, skipped }, error: skipped > 0 ? `DUPLICATE_ROLE: ${skipped} usuario(s) ya tenían rol asignado` : undefined };
  }
}

