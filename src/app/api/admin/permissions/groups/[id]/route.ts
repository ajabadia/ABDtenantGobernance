/**
 * @purpose Gestiona solicitudes de API para actualizar y eliminar grupos de permisos.
 * @purpose_en Handles API requests for updating and deleting permission groups.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:pbtdci
 * @lastUpdated 2026-06-23T20:35:34.664Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { PermissionService } from '@/services/tenant/permission-service';
import { connectDB } from '@ajabadia/satellite-sdk';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const tenantId = body.tenantId || user.tenantId;

    const updatedGroup = await PermissionService.updateGroup(id, tenantId, user.id, body, user.email);

    return NextResponse.json({ data: updatedGroup });
  } catch (error: unknown) {
    console.error('[API_PUT_GROUP_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'CIRCULAR_DEPENDENCY_DETECTED' ? 400 : 500;
    return NextResponse.json({ error: err.message || 'Error updating group' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || user.tenantId;

    await PermissionService.deleteGroup(id, tenantId, user.id, user.email);

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: unknown) {
    console.error('[API_DELETE_GROUP_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'DEPENDENT_SUBGROUPS_EXIST' ? 400 : 500;
    return NextResponse.json({ error: err.message || 'Error deleting group' }, { status });
  }
}
