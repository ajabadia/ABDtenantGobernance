/**
 * @purpose Gestiona el movimiento y los cambios de visibilidad de espacios dentro de la estructura de gobernanza de un inquilino, incluyendo actualizar datos del repositorio y auditoría de acciones.
 * @purpose_en Manages the movement and visibility changes of spaces within a tenant's governance structure, including updating repository data and auditing the actions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1klc9kf
 * @lastUpdated 2026-06-23T21:52:51.940Z
 */

import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import { AssetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';
import { AuditService } from './audit-service';
import { withTenantContext } from '@ajabadia/satellite-sdk/db';

const spaceRepository = new SpaceRepository();
const assetSpaceLinkRepository = new AssetSpaceLinkRepository();

export class SpaceMoveService {
  static async moveSpace(
    spaceId: string,
    newParentId: string | null,
    tenantId: string,
    userId = 'SYSTEM',
    userEmail = 'SYSTEM'
  ): Promise<void> {
    return withTenantContext(async () => {
      const space = await spaceRepository.findById(spaceId);
      if (!space) {
        throw new Error('Espacio no encontrado');
      }

      let newPath = `/${space.slug}`;
      if (newParentId) {
        const newParent = await spaceRepository.findById(newParentId);
        if (!newParent) {
          throw new Error('El nuevo espacio padre no existe');
        }
        newPath = `${newParent.materializedPath}/${space.slug}`;
      }

      const oldPath = space.materializedPath;

      await spaceRepository.model.findByIdAndUpdate(spaceId, {
        $set: {
          parentSpaceId: newParentId || undefined,
          materializedPath: newPath,
          updatedAt: new Date()
        }
      }).exec();

      await assetSpaceLinkRepository.updateSpacePaths(tenantId, spaceId, newPath);

      AuditService.logEvent({
        tenantId,
        action: 'MOVE_SPACE',
        entityType: 'SPACE',
        entityId: spaceId,
        userId,
        userEmail,
        changedFields: {
          parentSpaceId: newParentId,
          materializedPath: newPath
        },
        previousState: {
          parentSpaceId: space.parentSpaceId,
          materializedPath: oldPath
        }
      });

      if (oldPath) {
        const children = await spaceRepository.find({
          tenantId,
          materializedPath: { $regex: `^${oldPath}/` }
        });

        for (const child of children) {
          const childSubPath = child.materializedPath?.replace(oldPath, '') || '';
          const newChildPath = `${newPath}${childSubPath}`;
          
          await spaceRepository.model.findByIdAndUpdate(child._id, {
            $set: {
              materializedPath: newChildPath,
              updatedAt: new Date()
            }
          }).exec();

          await assetSpaceLinkRepository.updateSpacePaths(tenantId, child._id.toString(), newChildPath);
        }
      }
    });
  }

  static async updateSpaceVisibility(
    spaceId: string,
    visibility: 'PUBLIC' | 'INTERNAL' | 'PRIVATE',
    tenantId: string,
    userId: string,
    userEmail: string,
    cascade = false
  ): Promise<void> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new Error('Espacio no encontrado');
    }

    const previousState = { visibility: space.visibility };

    await spaceRepository.model.findByIdAndUpdate(spaceId, {
      $set: { 
        visibility, 
        updatedAt: new Date() 
      }
    }).exec();

    AuditService.logEvent({
      tenantId,
      action: 'UPDATE_SPACE',
      entityType: 'SPACE',
      entityId: spaceId,
      userId,
      userEmail,
      changedFields: { visibility },
      previousState
    });

    if (cascade && space.materializedPath) {
      const oldPath = space.materializedPath;
      
      const descendants = await spaceRepository.find({
        tenantId,
        materializedPath: { $regex: `^${oldPath}/` }
      });

      for (const desc of descendants) {
        const prevDescState = { visibility: desc.visibility };
        
        await spaceRepository.model.findByIdAndUpdate(desc._id, {
          $set: { 
            visibility, 
            updatedAt: new Date() 
          }
        }).exec();

        AuditService.logEvent({
          tenantId,
          action: 'HERITAGE_VISIBILITY',
          entityType: 'SPACE',
          entityId: desc._id.toString(),
          userId,
          userEmail,
          changedFields: { visibility, inheritedFrom: spaceId },
          previousState: prevDescState
        });
      }
    }
  }
}
