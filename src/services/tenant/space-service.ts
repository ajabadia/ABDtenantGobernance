import { SpaceSchema, type Space } from '@/lib/schemas/spaces';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import type { QueryFilter } from 'mongoose';
import type { ISpace } from '@/models/Space';
import { AuditService } from './audit-service';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';
import { withTenantContext } from '@/lib/database/tenant-model';
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

  private static hasAccessToSpace(
    space: ISpace,
    allSpacesMap: Map<string, ISpace>,
    userId: string,
    groupIds: string[]
  ): boolean {
    if (space.type === 'PERSONAL') {
      return space.ownerUserId === userId;
    }

    // Un usuario tiene acceso explícito a un nodo si es el dueño, colaborador directo o grupo colaborador
    const hasExplicitAccessAtNode = (s: ISpace): boolean => {
      if (s.ownerUserId === userId) return true;
      return s.collaborators.some(c => 
        (c.subjectType === 'USER' && c.subjectId === userId) ||
        (c.subjectType === 'GROUP' && groupIds.includes(c.subjectId))
      );
    };

    // Un usuario tiene acceso heredado por propagación en un nodo si algún ancestro por encima de él
    // tiene un colaborador (usuario o grupo) con propagates: true
    const hasPropagatingAccessAboveNode = (s: ISpace): boolean => {
      if (!s.materializedPath) return false;
      const parts = s.materializedPath.split('/').filter(Boolean);
      let currentPath = '';
      // Recorremos los ancestros superiores
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += '/' + parts[i];
        const ancestor = Array.from(allSpacesMap.values()).find(x => x.materializedPath === currentPath);
        if (ancestor) {
          const matchingPropagatingCollab = ancestor.collaborators.some(c => 
            c.propagates && 
            ((c.subjectType === 'USER' && c.subjectId === userId) ||
             (c.subjectType === 'GROUP' && groupIds.includes(c.subjectId)))
          );
          if (matchingPropagatingCollab) {
            return true;
          }
        }
      }
      return false;
    };

    // Evaluamos el camino completo desde la raíz hasta el espacio
    if (!space.materializedPath) return false;
    const pathParts = space.materializedPath.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      currentPath += '/' + pathParts[i];
      const node = Array.from(allSpacesMap.values()).find(x => x.materializedPath === currentPath);
      
      // Si un nodo intermedio de la ruta no existe o no está activo, denegar
      if (!node || !node.isActive) {
        return false;
      }

      // Si el nodo evaluado es PRIVATE
      if (node.visibility === 'PRIVATE') {
        const hasDirect = hasExplicitAccessAtNode(node);
        const hasInherited = hasPropagatingAccessAboveNode(node);
        if (!hasDirect && !hasInherited) {
          return false;
        }
      }
    }

    return true;
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

    // Obtenemos todos los espacios del tenant
    const docs = await spaceRepository.find({ tenantId, isActive: true });
    
    // Mapeamos los espacios para búsquedas jerárquicas rápidas
    const allSpacesMap = new Map<string, ISpace>();
    docs.forEach(doc => {
      allSpacesMap.set(doc._id.toString(), doc);
    });

    // Filtramos dinámicamente según la visibilidad recursiva
    const accessibleDocs = docs.filter(doc => 
      this.hasAccessToSpace(doc, allSpacesMap, userId, groupIds)
    );

    // Aplicamos filtros adicionales en memoria
    let filteredDocs = accessibleDocs;
    if (filters.isRoot) {
      filteredDocs = filteredDocs.filter(doc => !doc.parentSpaceId);
    } else if (filters.parentSpaceId) {
      filteredDocs = filteredDocs.filter(doc => doc.parentSpaceId === filters.parentSpaceId);
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      filteredDocs = filteredDocs.filter(doc => searchRegex.test(doc.name));
    }

    return filteredDocs.map(doc => {
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

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AUDIT] [MOVE_SPACE] Moved space ${spaceId} and updated ${children.length} nested child spaces recursively.`);
        }
      }
    });
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
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUDIT] [VISIBILITY_HERITAGE] Propagated visibility ${visibility} from ${spaceId} to ${descendants.length} sub-spaces.`);
      }
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
