/**
 * @purpose Gestiona actualizaciones y eliminaciones de espacios, incluyendo cambios de jerarquía y propagación de visibilidad.
 * @purpose_en Manages space updates and deletions, including hierarchy changes and visibility propagation.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:atmiyf
 * @lastUpdated 2026-06-24T10:33:35.244Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { SpaceService, SpaceMoveService } from '@/services/tenant/space-service';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';;
import { AuditService } from '@/services/tenant/audit-service';

const spaceRepository = new SpaceRepository();

/**
 * 🗂️ PATCH /api/admin/spaces/[id]
 * Updates a space and handles hierarchy changes (re-parenting).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      const { id } = await params;
      
      const body = await request.json();
      const tenantId = body.tenantId || user.tenantId;
      
      // 1. Move space if parent changed
      if (body.parentSpaceId !== undefined) {
        await SpaceMoveService.moveSpace(id, body.parentSpaceId || null, tenantId, user.id, user.email);
      }

      // 2. Propagate visibility recursively if cascade option is sent
      if (body.visibility !== undefined) {
        await SpaceMoveService.updateSpaceVisibility(id, body.visibility, tenantId, user.id, user.email, body.cascade === true);
      }
      
      // 3. Update other fields
      const updateData = { ...body };
      delete updateData.parentSpaceId;
      delete updateData.visibility; // Handled by our dedicated updateSpaceVisibility method
      delete updateData.cascade;
      delete updateData.tenantId;
      delete updateData.materializedPath; // Managed by backend
      delete updateData._id;

      if (Object.keys(updateData).length > 0) {
        await spaceRepository.model.findByIdAndUpdate(id, {
          $set: updateData
        });
      }

      const updatedSpace = await spaceRepository.findById(id);
      return NextResponse.json(updatedSpace);
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'SPACE_UPDATE_ERROR',
        entityType: 'SPACE',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_PATCH_SPACE_ERROR]', error);
      return NextResponse.json({ error: err.message || 'Invalid update data' }, { status: 400 });
    }
  });
}

/**
 * 🗂️ DELETE /api/admin/spaces/[id]
 * Deletes a space and cascades optionally (currently simple delete).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async () => {
    try {
      await ensureIndustrialAccess('ADMIN');
      await connectDB();
      const { id } = await params;
      
      // Validar si tiene hijos antes de borrar
      const children = await spaceRepository.model.countDocuments({ parentSpaceId: id });
      if (children > 0) {
        return NextResponse.json(
          { error: 'Cannot delete a space that contains child spaces. Please move or delete them first.' },
          { status: 400 }
        );
      }

      await spaceRepository.model.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Space deleted successfully' });
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'SPACE_DELETE_ERROR',
        entityType: 'SPACE',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_DELETE_SPACE_ERROR]', error);
      return NextResponse.json({ error: err.message || 'Error deleting space' }, { status: 400 });
    }
  });
}
