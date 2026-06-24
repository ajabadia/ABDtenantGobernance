/**
 * @purpose Gestiona la evaluación de acciones del usuario contra recursos dentro de un inquilino utilizando el GuardianEngine.
 * @purpose_en Handles the evaluation of user actions against resources within a tenant using the GuardianEngine.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1qz9rtw
 * @lastUpdated 2026-06-23T20:36:42.388Z
 */

import { NextResponse } from 'next/server';
import { GuardianEngine } from '@/services/guardian/guardian-engine';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

export async function POST(req: Request) {
  return withTenantContext(async () => {
    try {
      const authHeader = req.headers.get('x-abd-internal-secret');
      const internalSecret = process.env.ABD_INTERNAL_SECRET;

      if (!internalSecret || authHeader !== internalSecret) {
        return NextResponse.json({ error: 'Unauthorized S2S' }, { status: 401 });
      }

      const body = await req.json();
      const { tenantId, userId, resource, action, context } = body;

      if (!tenantId || !userId || !resource || !action) {
        return NextResponse.json(
          { error: 'Missing required fields: tenantId, userId, resource, action' },
          { status: 400 }
        );
      }

      await connectDB();

      const result = await GuardianEngine.evaluate({
        tenantId,
        userId,
        resource,
        action,
        context,
      });

      return NextResponse.json({
        allowed: result.decision === 'ALLOW',
        reason: result.reason,
        allowedSpaceIds: result.allowedSpaceIds || [],
        allowedGroupIds: result.allowedGroupIds || []
      }, { status: 200 });
    } catch (error) {
      console.error('[GuardianEngine S2S] Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
