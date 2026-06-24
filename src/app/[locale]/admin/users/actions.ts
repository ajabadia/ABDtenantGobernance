/**
 * @purpose Gestiona acciones relacionadas con los usuarios, como obtener usuarios, invitar nuevos usuarios y actualizar usuarios existentes.
 * @purpose_en Manages user-related actions such as fetching users, inviting new users, and updating existing users.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:1,sig:1vtswuy
 * @lastUpdated 2026-06-23T21:42:54.370Z
 */

'use server'

import { iamClient, InviteUserPayload, UpdateUserPayload, IamUser } from '@/lib/services/iamClient';

export async function fetchUsersAction(tenantId: string): Promise<{ data?: IamUser[]; error?: string; }> {
  try {
    const users = await iamClient.listUsers(tenantId);
    return { data: users, error: undefined };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[USERS_ACTION] fetchUsersAction warning, returning empty list:', msg);
    return { data: [], error: msg };
  }
}

export async function inviteUserAction(payload: InviteUserPayload) {
  try {
    // 🚦 Rate limiting: max 30 invites per tenant per hour
    const { rateLimitMongodb } = await import('@ajabadia/satellite-sdk');
    const isAllowed = await rateLimitMongodb.check(payload.tenantId || 'global', 'api', 30, 3600);
    if (!isAllowed) {
      return { error: 'Demasiadas invitaciones. Intente más tarde.' };
    }

    const user = await iamClient.inviteUser(payload);
    return { data: user };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[USERS_ACTION] inviteUserAction Error:', msg);
    return { error: msg };
  }
}

export async function updateUserAction(payload: UpdateUserPayload) {
  try {
    await iamClient.updateUser(payload);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[USERS_ACTION] updateUserAction Error:', msg);
    return { error: msg };
  }
}
