import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { SpaceService } from '@/services/tenant/space-service';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

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
        await SpaceService.moveSpace(id, body.parentSpaceId || null, tenantId, user.id, user.email);
      }

      // 2. Propagate visibility recursively if cascade option is sent
      if (body.visibility !== undefined) {
        await SpaceService.updateSpaceVisibility(id, body.visibility, tenantId, user.id, user.email, body.cascade === true);
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
      console.error('[API_PATCH_SPACE_ERROR]', error);
      const err = error as Error;
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
      console.error('[API_DELETE_SPACE_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Error deleting space' }, { status: 400 });
    }
  });
}
