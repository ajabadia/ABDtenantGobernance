import { SpaceSchema, type Space } from '@/lib/schemas/spaces';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import type { ISpace } from '@/models/Space';
import { AuditService } from './audit-service';

const spaceRepository = new SpaceRepository();

export class SpaceService {
  
  /**
   * Crea un nuevo espacio calculando su ruta jerárquica materializada
   */
  static async createSpace(
    tenantId: string,
    userId: string,
    data: Partial<Space>,
    userEmail = 'SYSTEM'
  ): Promise<Space> {
    let materializedPath = `/${data.slug}`;
    const parentSpaceId = data.parentSpaceId;

    if (parentSpaceId) {
      const parent = await spaceRepository.findById(parentSpaceId);
      if (!parent) {
        throw new Error('El espacio padre no existe');
      }
      materializedPath = `${parent.materializedPath}/${data.slug}`;
    }

    const newSpaceData = SpaceSchema.parse({
      ...data,
      tenantId,
      ownerUserId: data.type === 'PERSONAL' ? userId : data.ownerUserId || userId,
      parentSpaceId,
      materializedPath,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const doc = await spaceRepository.create(newSpaceData as unknown as ISpace);
    
    AuditService.logEvent({
      tenantId,
      action: 'CREATE_SPACE',
      entityType: 'SPACE',
      entityId: doc._id.toString(),
      userId,
      userEmail,
      changedFields: {
        name: doc.name,
        slug: doc.slug,
        type: doc.type,
        visibility: doc.visibility,
        parentSpaceId: doc.parentSpaceId,
        materializedPath: doc.materializedPath
      }
    });

    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    return SpaceSchema.parse(obj);
  }

  /**
   * Obtiene un espacio por su ruta materializada
   */
  static async getSpaceByPath(path: string, tenantId: string): Promise<Space | null> {
    const doc = await spaceRepository.findByPath(tenantId, path);
    if (!doc) return null;
    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    return SpaceSchema.parse(obj);
  }
}

export { SpaceAccessService } from './space-access-service';
export { SpaceMoveService } from './space-move-service';
