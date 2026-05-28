'use server'

import { connectDB } from '@ajabadia/satellite-sdk';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';
import QuizUserRole, { type IQuizUserRole } from '@/models/QuizUserRole';

async function getExplicitContext(tenantId: string) {
  try {
    const tenantConfig = await TenantService.getConfig(tenantId);
    return {
      tenantId: tenantConfig.tenantId,
      dbPrefix: tenantConfig.dbPrefix || tenantConfig.tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: tenantConfig.isolationStrategy || 'COLLECTION_PREFIX',
    };
  } catch {
    return {
      tenantId,
      dbPrefix: tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: 'COLLECTION_PREFIX',
    };
  }
}

export async function fetchQuizRolesAction(
  tenantId: string,
  filters?: { scopeType?: string; scopeId?: string }
): Promise<{ data?: Partial<IQuizUserRole>[]; error?: string }> {
  try {
    const context = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const query: Record<string, unknown> = { tenantId };
        if (filters?.scopeType) query.scopeType = filters.scopeType;
        if (filters?.scopeId) query.scopeId = filters.scopeId;
        const roles = await QuizUserRole.find(query)
          .sort({ createdAt: -1 })
          .lean();
        const serialized = roles.map((r) => ({
          ...r,
          _id: String(r._id),
        }));
        return {
          data: serialized as unknown as Partial<IQuizUserRole>[],
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[QUIZ_ROLES_ACTION] fetchQuizRolesAction Error:', msg);
        return { error: msg };
      }
    }, context);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function assignQuizRoleAction(
  tenantId: string,
  data: {
    userId: string;
    scopeType: 'space' | 'course' | 'exam_config';
    scopeId: string;
    roleType: 'CREATOR' | 'AUDITOR';
  }
): Promise<{ data?: Partial<IQuizUserRole>; error?: string }> {
  try {
    const context = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();

        const role = await QuizUserRole.create({
          tenantId,
          userId: data.userId,
          scopeType: data.scopeType,
          scopeId: data.scopeId,
          roleType: data.roleType,
          assignedBy: user.id,
        });

        const obj = role.toObject();
        return {
          data: {
            ...obj,
            _id: String(obj._id),
          } as unknown as Partial<IQuizUserRole>,
        };
      } catch (error: unknown) {
        if ((error as { code?: number }).code === 11000) {
          return { error: 'DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito' };
        }
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[QUIZ_ROLES_ACTION] assignQuizRoleAction Error:', msg);
        return { error: msg };
      }
    }, context);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function revokeQuizRoleAction(
  roleId: string,
  tenantId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const context = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const result = await QuizUserRole.deleteOne({ _id: roleId, tenantId });
        if (result.deletedCount === 0) {
          return { error: 'ROLE_NOT_FOUND: No se encontró el rol especificado' };
        }
        return { success: true };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[QUIZ_ROLES_ACTION] revokeQuizRoleAction Error:', msg);
        return { error: msg };
      }
    }, context);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function fetchTenantRoleCustomizationAction(
  tenantId: string
): Promise<{ roleCustomization?: { roleLiterals: { CREATOR: { es: string; en: string }; RECIPIENT: { es: string; en: string }; AUDITOR: { es: string; en: string } } }; error?: string }> {
  try {
    const tenantConfig = await TenantService.getConfig(tenantId);
    return { roleCustomization: tenantConfig.roleCustomization };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function bulkAssignQuizRolesAction(
  tenantId: string,
  data: {
    userIds: string[];
    scopeType: 'space' | 'course' | 'exam_config';
    scopeId: string;
    roleType: 'CREATOR' | 'AUDITOR';
  }
): Promise<{ data?: { assigned: number; skipped: number }; error?: string }> {
  try {
    const context = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();

        const docs = data.userIds.map((userId) => ({
          tenantId,
          userId,
          scopeType: data.scopeType,
          scopeId: data.scopeId,
          roleType: data.roleType,
          assignedBy: user.id,
        }));

        const result = await QuizUserRole.insertMany(docs, { ordered: false });
        return {
          data: {
            assigned: result.length,
            skipped: data.userIds.length - result.length,
          },
        };
      } catch (error: unknown) {
        // insertMany with ordered:false will throw for duplicates but still inserts non-duplicates
        const err = error as { writeErrors?: unknown[]; insertedCount?: number };
        const inserted = err.insertedCount ?? 0;
        const skipped = data.userIds.length - inserted;
        return {
          data: { assigned: inserted, skipped },
          error: skipped > 0 ? `DUPLICATE_ROLE: ${skipped} usuario(s) ya tenían rol asignado` : undefined,
        };
      }
    }, context);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QUIZ_ROLES_ACTION] bulkAssignQuizRolesAction Error:', msg);
    return { error: msg };
  }
}
