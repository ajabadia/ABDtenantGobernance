/**
 * @purpose Gestiona y recupera políticas de permisos para inquilinos.
 * @purpose_en Manages and retrieves permission policies for tenants.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:z902kn
 * @lastUpdated 2026-06-24T10:33:15.593Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { PermissionService } from '@/services/tenant/permission-service';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk';
import { AuditService } from '@/services/tenant/audit-service';

const policyRepository = new PermissionPolicyRepository();

export async function GET(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();

      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;

      const policies = await policyRepository.find({ tenantId });
      
      // Normalize string IDs
      const normalized = policies.map(p => {
        const obj = p.toObject();
        return {
          ...obj,
          _id: obj._id.toString()
        };
      });

      return NextResponse.json({ data: normalized });
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'POLICY_API_LIST_ERROR',
        entityType: 'PERMISSION_POLICY',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_GET_POLICIES_ERROR]', error);
      const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
    }
  });
}

export async function POST(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();

      const body = await request.json();
      const tenantId = body.tenantId || user.tenantId;

      const newPolicy = await PermissionService.createPolicy(tenantId, user.id, body, user.email);

      return NextResponse.json({ data: newPolicy }, { status: 201 });
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'POLICY_API_CREATE_ERROR',
        entityType: 'PERMISSION_POLICY',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_POST_POLICIES_ERROR]', error);
      return NextResponse.json({ error: err.message || 'Invalid policy data' }, { status: 400 });
    }
  });
}
