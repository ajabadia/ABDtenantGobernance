/**
 * @purpose Gestiona acciones relacionadas con los usuarios, como obtener usuarios, invitar nuevos usuarios y actualizar usuarios existentes.
 * @purpose_en Manages user-related actions such as fetching users, inviting new users, and updating existing users.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:3,sig:evlhyk
 * @lastUpdated 2026-06-24T10:34:46.049Z
 */

'use server'

import { iamClient, InviteUserPayload, UpdateUserPayload, IamUser } from '@/lib/services/iamClient';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { AuditService } from '@/services/tenant/audit-service';

export async function fetchUsersAction(tenantId: string): Promise<{ data?: IamUser[]; error?: string; }> {
  try {
    const users = await iamClient.listUsers(tenantId);
    return { data: users, error: undefined };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'USER_FETCH_ERROR',
      entityType: 'USER',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.warn('[USERS_ACTION] fetchUsersAction warning, returning empty list:', msg);
    return { data: [], error: msg };
  }
}

export async function inviteUserAction(payload: InviteUserPayload) {
  try {
    const admin = await ensureIndustrialAccess('ADMIN');

    // 🚦 Rate limiting: max 30 invites per tenant per hour
    const { rateLimitMongodb } = await import('@ajabadia/satellite-sdk');
    const isAllowed = await rateLimitMongodb.check(payload.tenantId || 'global', 'api', 30, 3600);
    if (!isAllowed) {
      return { error: 'Demasiadas invitaciones. Intente más tarde.' };
    }

    const user = await iamClient.inviteUser(payload);
    await AuditService.logEvent({
      tenantId: payload.tenantId || 'unknown',
      action: 'USER_INVITE_SUCCESS',
      entityType: 'USER',
      entityId: payload.email || 'unknown',
      userId: admin.email || 'system',
      userEmail: admin.email || 'system',
      changedFields: { role: payload.role, invitedEmail: payload.email },
    });
    return { data: user };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: payload.tenantId || 'unknown',
      action: 'USER_INVITE_ERROR',
      entityType: 'USER',
      entityId: payload.email || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[USERS_ACTION] inviteUserAction Error:', msg);
    return { error: msg };
  }
}

export async function updateUserAction(payload: UpdateUserPayload) {
  try {
    const admin = await ensureIndustrialAccess('ADMIN');
    await iamClient.updateUser(payload);
    await AuditService.logEvent({
      tenantId: payload.tenantId || 'unknown',
      action: 'USER_UPDATE_SUCCESS',
      entityType: 'USER',
      entityId: payload.userId || 'unknown',
      userId: admin.email || 'system',
      userEmail: admin.email || 'system',
      changedFields: { status: payload.updates?.status, role: payload.updates?.role },
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: payload.tenantId || 'unknown',
      action: 'USER_UPDATE_ERROR',
      entityType: 'USER',
      entityId: payload.userId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    console.error('[USERS_ACTION] updateUserAction Error:', msg);
    return { error: msg };
  }
}
