/**
 * @purpose Gestiona el control de acceso a espacios dentro de un inquilino, determinando si un usuario o grupo tiene permiso para ver o interactuar con espacios específicos según sus configuraciones de propiedad y colaboración.
 * @purpose_en Manages access control for spaces within a tenant, determining if a user or group has permission to view or interact with specific spaces based on their ownership and collaboration settings.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1o7v6jr
 * @lastUpdated 2026-06-23T23:29:03.477Z
 */

import { SpaceSchema, type Space } from '@/lib/schemas/spaces';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import type { ISpace } from '@/models/Space';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';

const spaceRepository = new SpaceRepository();

export class SpaceAccessService {
  static hasAccessToSpace(
    space: ISpace,
    allSpacesMap: Map<string, ISpace>,
    userId: string,
    groupIds: string[]
  ): boolean {
    if (space.type === 'PERSONAL') {
      return space.ownerUserId === userId;
    }

    const hasExplicitAccessAtNode = (s: ISpace): boolean => {
      if (s.ownerUserId === userId) return true;
      return s.collaborators.some(c => 
        (c.subjectType === 'USER' && c.subjectId === userId) ||
        (c.subjectType === 'GROUP' && groupIds.includes(c.subjectId))
      );
    };

    const hasPropagatingAccessAboveNode = (s: ISpace): boolean => {
      if (!s.materializedPath) return false;
      const parts = s.materializedPath.split('/').filter(Boolean);
      let currentPath = '';
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

    if (!space.materializedPath) return false;
    const pathParts = space.materializedPath.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      currentPath += '/' + pathParts[i];
      const node = Array.from(allSpacesMap.values()).find(x => x.materializedPath === currentPath);
      
      if (!node || !node.isActive) {
        return false;
      }

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
    const memberships = await userGroupMembershipRepository.findByUserId(tenantId, userId);
    const groupIds = memberships.map(m => m.groupId.toString());

    const docs = await spaceRepository.find({ tenantId, isActive: true });
    
    const allSpacesMap = new Map<string, ISpace>();
    docs.forEach(doc => {
      allSpacesMap.set(doc._id.toString(), doc);
    });

    const accessibleDocs = docs.filter(doc => 
      this.hasAccessToSpace(doc, allSpacesMap, userId, groupIds)
    );

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
}
