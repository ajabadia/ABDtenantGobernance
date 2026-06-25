/**
 * @purpose Gestiona solicitudes GET para obtener espacios para un inquilino, filtrando por ID de espacio de manera opcional.
 * @purpose_en Handles GET requests to retrieve spaces for a specific tenant, optionally filtering by space ID.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:noeyza
 * @lastUpdated 2026-06-25T09:23:10.912Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';
import Space from '@/models/Space';

export async function GET(req: NextRequest) {
  return withTenantContext(async () => {
    const authHeader = req.headers.get('x-abd-internal-secret');
    const internalSecret = process.env.ABD_INTERNAL_SECRET;

    if (!internalSecret || authHeader !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized S2S' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const spaceId = searchParams.get('spaceId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing required query param: tenantId' }, { status: 400 });
    }

    await connectDB();

    if (spaceId) {
      const space = await Space.findOne({ _id: spaceId, tenantId })
        .select('name slug type isActive parentSpaceId materializedPath collaborators')
        .lean();

      return NextResponse.json({ space: space || null });
    }

    const spaces = await Space.find({ tenantId })
      .select('name slug type isActive parentSpaceId materializedPath collaborators')
      .lean();

    return NextResponse.json({ spaces });
  });
}
