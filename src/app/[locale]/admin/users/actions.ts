'use server'

import { iamClient, InviteUserPayload, UpdateUserPayload } from '@/lib/services/iamClient';

export async function fetchUsersAction(tenantId: string) {
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
