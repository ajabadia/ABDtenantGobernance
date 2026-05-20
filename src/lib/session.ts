'use server';

import {
  getIndustrialSession as _getIndustrialSession,
  ensureIndustrialAccess as _ensureIndustrialAccess,
} from '@abd/satellite-sdk';
import type { FederatedSession, UserProfile } from '@/lib/session-types';

export async function getIndustrialSession(): Promise<FederatedSession> {
  return await _getIndustrialSession();
}

export async function ensureIndustrialAccess(requiredRole?: string) {
  return await _ensureIndustrialAccess(requiredRole);
}


