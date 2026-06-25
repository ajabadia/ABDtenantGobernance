/**
 * @purpose Gestiona roles de quiz al cargando y asignando roles dentro de un inquilino, registrando acciones para auditoría.
 * @purpose_en Manages quiz roles by fetching and assigning roles within a tenant, logging actions for auditing.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:3,sig:1k2aj63
 * @lastUpdated 2026-06-25T09:23:40.595Z
 */

'use server'

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { QuizRoleClient } from '@/services/quiz-role-client';
import { AuditService } from '@/services/tenant/audit-service';
import { QuizRoleRecord } from './types';

export async function fetchQuizRolesAction(tenantId: string, filters?: { scopeType?: string; scopeId?: string }): Promise<{ data?: QuizRoleRecord[]; error?: string }> {
  try {
    await ensureIndustrialAccess('ADMIN');
    const result = await QuizRoleClient.fetchRoles(tenantId, filters);
    if (result.error) {
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'QUIZ_ROLE_FETCH_ERROR',
        entityType: 'CONFIG',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: result.error },
      });
    }
    return result;
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

export async function assignQuizRoleAction(tenantId: string, data: { userId: string; scopeType: 'space' | 'course' | 'exam_config'; scopeId: string; roleType: 'CREATOR' | 'AUDITOR' }): Promise<{ data?: QuizRoleRecord; error?: string }> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const result = await QuizRoleClient.assignRole(tenantId, {
      ...data,
      assignedBy: user.id,
    });
    if (result.data) {
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_ASSIGN_SUCCESS',
        entityType: 'CONFIG',
        entityId: String(result.data._id),
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { targetUserId: data.userId, scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType },
      });
    } else {
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'QUIZ_ROLE_ASSIGN_ERROR',
        entityType: 'CONFIG',
        entityId: data.userId || 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { error: result.error },
      });
    }
    return result;
  } catch (error: unknown) {
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
    const user = await ensureIndustrialAccess('ADMIN');
    const result = await QuizRoleClient.revokeRole(roleId, tenantId);
    if (result.success) {
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_REVOKE_SUCCESS',
        entityType: 'CONFIG',
        entityId: roleId,
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: {},
      });
    } else {
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'QUIZ_ROLE_REVOKE_ERROR',
        entityType: 'CONFIG',
        entityId: roleId || 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { error: result.error },
      });
    }
    return result;
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
    const user = await ensureIndustrialAccess('ADMIN');
    const result = await QuizRoleClient.bulkAssignRoles(tenantId, {
      ...data,
      assignedBy: user.id,
    });
    if (result.data) {
      await AuditService.logEvent({
        tenantId,
        action: 'QUIZ_ROLE_BULK_ASSIGN_SUCCESS',
        entityType: 'CONFIG',
        entityId: 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { scopeType: data.scopeType, scopeId: data.scopeId, roleType: data.roleType, assigned: result.data.assigned, total: data.userIds.length },
      });
    } else {
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'QUIZ_ROLE_BULK_ASSIGN_ERROR',
        entityType: 'CONFIG',
        entityId: 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { error: result.error || 'Unknown error' },
      });
    }
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'QUIZ_ROLE_BULK_ASSIGN_ERROR',
      entityType: 'CONFIG',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[QUIZ_ROLES] bulkAssignQuizRolesAction:', msg);
    return { error: msg };
  }
}

