import { SpaceSchema, type Space } from '@/lib/schemas/spaces';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import type { QueryFilter } from 'mongoose';
import type { ISpace } from '@/models/Space';

const spaceRepository = new SpaceRepository();

export class SpaceService {
  
  /**
   * Crea un nuevo espacio calculando su ruta jerárquica materializada
   */
  static async createSpace(
    tenantId: string,
    userId: string,
    data: Partial<Space>
  ): Promise<Space> {
    let materializedPath = `/${data.slug}`;
    let parentSpaceId = data.parentSpaceId;

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
    
    // Filtro de accesibilidad perimetral (matriz de colaboración y privacidad)
    const accessibilityQuery: QueryFilter<ISpace> = {
      tenantId,
      $or: [
        // 1. Espacios personales del usuario
        { type: 'PERSONAL', ownerUserId: userId },
        // 2. Colaboraciones directas
        { 'collaborators.userId': userId } as unknown as QueryFilter<ISpace>,
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
    tenantId: string
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
