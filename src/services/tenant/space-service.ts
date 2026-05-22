import { SpaceSchema, type Space } from '@/lib/schemas/spaces';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import type { QueryFilter } from 'mongoose';
import type { ISpace } from '@/models/Space';
import { AuditService } from './audit-service';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';

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
    
    // Registrar auditoría remota asíncrona (SaaS Logs)
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
   * Obtiene los espacios accesibles para un usuario dentro de un tenant basado en su visibilidad
   */
  static async getAccessibleSpaces(
    tenantId: string,
    userId: string,
    filters: {
      parentSpaceId?: string;
      isRoot?: boolean;
      search?: string;
    } = {}
  ): Promise<Space[]> {
    
    // 1. Obtener a qué grupos pertenece el usuario en este tenant
    const memberships = await userGroupMembershipRepository.findByUserId(tenantId, userId);
    const groupIds = memberships.map(m => m.groupId.toString());

    // Filtro de accesibilidad perimetral (matriz de colaboración y privacidad)
    const accessibilityQuery: QueryFilter<ISpace> = {
      tenantId,
      $or: [
        // 1. Espacios personales del usuario
        { type: 'PERSONAL', ownerUserId: userId },
        // 2. Colaboraciones directas (Como Usuario individual o a través de sus Grupos)
        { 
          collaborators: {
            $elemMatch: {
              $or: [
                { subjectId: userId, subjectType: 'USER' },
                { subjectId: { $in: groupIds }, subjectType: 'GROUP' }
              ]
            }
          }
        } as unknown as QueryFilter<ISpace>,
        // 3. Espacios públicos del tenant
        { type: 'TENANT', visibility: 'PUBLIC' },
        // 4. Espacios internos (privados) creados por el propio usuario
        { type: 'TENANT', visibility: 'INTERNAL', ownerUserId: userId }
      ]
    };

    const extraFilters: QueryFilter<ISpace> = {};
    if (filters.isRoot) {
      extraFilters.parentSpaceId = { $exists: false } as unknown as QueryFilter<ISpace>['parentSpaceId'];
    } else if (filters.parentSpaceId) {
      extraFilters.parentSpaceId = filters.parentSpaceId as unknown as QueryFilter<ISpace>['parentSpaceId'];
    }

    if (filters.search) {
      extraFilters.name = { $regex: filters.search, $options: 'i' } as unknown as QueryFilter<ISpace>['name'];
    }

    const docs = await spaceRepository.find({
      $and: [accessibilityQuery, extraFilters]
    });

    return docs.map(doc => {
      const obj = doc.toObject();
      if (obj._id) obj._id = obj._id.toString();
      return SpaceSchema.parse(obj);
    });
  }

  /**
   * Mueve un espacio a un nuevo padre y recalcula recursivamente las rutas de todos sus hijos
   */
  static async moveSpace(
    spaceId: string,
    newParentId: string | null,
    tenantId: string,
    userId = 'SYSTEM',
    userEmail = 'SYSTEM'
  ): Promise<void> {
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

    // 1. Actualizar el espacio actual
    await spaceRepository.model.findByIdAndUpdate(spaceId, {
      $set: {
        parentSpaceId: newParentId || undefined,
        materializedPath: newPath,
        updatedAt: new Date()
      }
    }).exec();

    // Registrar auditoría remota asíncrona (SaaS Logs)
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

    // 2. Actualizar recursivamente en cascada todos los hijos
    if (oldPath) {
      const children = await spaceRepository.find({
        tenantId,
        materializedPath: { $regex: `^${oldPath}/` }
      });

      for (const child of children) {
        const childSubPath = child.materializedPath?.replace(oldPath, '') || '';
        await spaceRepository.model.findByIdAndUpdate(child._id, {
          $set: {
            materializedPath: `${newPath}${childSubPath}`,
            updatedAt: new Date()
          }
        }).exec();
      }

      console.log(`[AUDIT] [MOVE_SPACE] Moved space ${spaceId} and updated ${children.length} nested child spaces recursively.`);
    }
  }

  /**
   * Actualiza la visibilidad de un espacio y opcionalmente la propaga recursivamente en cascada
   * a todos sus sub-espacios descendientes.
   */
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

    // 1. Actualizar el espacio actual
    await spaceRepository.model.findByIdAndUpdate(spaceId, {
      $set: { 
        visibility, 
        updatedAt: new Date() 
      }
    }).exec();

    // Registrar auditoría remota asíncrona (SaaS Logs)
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

    // 2. Propagación en cascada a los descendientes usando el materializedPath
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

        // Registrar auditoría de herencia remota por cada sub-espacio mutado
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
      
      console.log(`[AUDIT] [VISIBILITY_HERITAGE] Propagated visibility ${visibility} from ${spaceId} to ${descendants.length} sub-spaces.`);
    }
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
