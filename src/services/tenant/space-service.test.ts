import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
});

import { SpaceService, SpaceAccessService, SpaceMoveService } from './space-service';

// Mock database contexts
vi.mock('@ajabadia/satellite-sdk', () => {
  const mockModel = new Proxy({}, {
    get(target, prop) {
      if (prop === 'modelName') return 'MockModel';
      if (prop === 'schema') return ({ paths: {} });
      if (prop === 'collection') return ({ name: 'mock_collection' });
      if (typeof prop === 'string' && !['schema', 'collection', 'modelName', 'then', 'constructor'].includes(prop)) {
        return vi.fn().mockReturnThis();
      }
      return Reflect.get(target, prop);
    }
  });
  return {
    withTenantContext: vi.fn(async (callback) => await callback()),
    getTenantModel: () => mockModel,
    tenantStorage: { getStore: vi.fn(), run: vi.fn() },
  };
});

// Mock repositories and services
vi.mock('@/lib/repositories/SpaceRepository', () => {
  const mockFindById = vi.fn();
  const mockFind = vi.fn();
  const mockCreate = vi.fn();
  const mockFindByPath = vi.fn();
  const mockFindByIdAndUpdate = vi.fn();
  const mockExec = vi.fn();

  mockFindByIdAndUpdate.mockReturnValue({ exec: mockExec });

  class MockSpaceRepository {
    findById = mockFindById;
    find = mockFind;
    create = mockCreate;
    findByPath = mockFindByPath;
    model = {
      findByIdAndUpdate: mockFindByIdAndUpdate,
    };
  }

  return {
    SpaceRepository: MockSpaceRepository,
    mockFindById,
    mockFind,
    mockCreate,
    mockFindByPath,
    mockFindByIdAndUpdate,
    mockExec,
  };
});

vi.mock('@/lib/repositories/UserGroupMembershipRepository', () => {
  const mockFindByUserId = vi.fn();
  class MockUserGroupMembershipRepository {
    findByUserId = mockFindByUserId;
  }
  return {
    UserGroupMembershipRepository: MockUserGroupMembershipRepository,
    userGroupMembershipRepository: {
      findByUserId: mockFindByUserId,
    },
    mockFindByUserId,
  };
});

vi.mock('./audit-service', () => {
  const mockLogEvent = vi.fn();
  return {
    AuditService: {
      logEvent: mockLogEvent,
    },
    mockLogEvent,
  };
});

// Import mock references
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindById, mockFind, mockCreate, mockFindByPath, mockFindByIdAndUpdate } from '@/lib/repositories/SpaceRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindByUserId } from '@/lib/repositories/UserGroupMembershipRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockLogEvent } from './audit-service';

describe('SpaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSpace', () => {
    it('should create a root space and calculate materialized path', async () => {
      const mockDoc = { _id: 'space-root-id', name: 'Root Space', slug: 'root-space', type: 'TENANT' as const, tenantId: 'tenant-1', ownerUserId: 'user-1', materializedPath: '/root-space', visibility: 'PUBLIC' as const, isActive: true, toObject: function() { return this; } };

      mockCreate.mockResolvedValueOnce(mockDoc);

      const result = await SpaceService.createSpace(
        'tenant-1',
        'user-1',
        {
          name: 'Root Space',
          slug: 'root-space',
          type: 'TENANT',
          visibility: 'PUBLIC',
        },
        'admin-email@test.com'
      );

      expect(mockFindById).not.toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-1',
        materializedPath: '/root-space',
      }));
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'CREATE_SPACE',
        entityType: 'SPACE',
        entityId: 'space-root-id',
        userId: 'user-1',
      }));
      expect(result.materializedPath).toBe('/root-space');
    });

    it('should throw an error if parent space ID is specified but does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(
        SpaceService.createSpace('tenant-1', 'user-1', {
          name: 'Sub Space',
          slug: 'sub-space',
          parentSpaceId: 'nonexistent-parent',
        })
      ).rejects.toThrow('El espacio padre no existe');
    });

    it('should create a nested space and calculate hierarchical materialized path', async () => {
      const mockParent = { _id: 'parent-id', name: 'Parent Space', slug: 'parent', materializedPath: '/parent' };

      mockFindById.mockResolvedValueOnce(mockParent);

      const mockSubDoc = { _id: 'sub-id', name: 'Sub Space', slug: 'sub', type: 'TENANT' as const, tenantId: 'tenant-1', ownerUserId: 'user-1', parentSpaceId: 'parent-id', materializedPath: '/parent/sub', visibility: 'INTERNAL' as const, isActive: true, toObject: function() { return this; } };

      mockCreate.mockResolvedValueOnce(mockSubDoc);

      const result = await SpaceService.createSpace('tenant-1', 'user-1', {
        name: 'Sub Space',
        slug: 'sub',
        parentSpaceId: 'parent-id',
      });

      expect(mockFindById).toHaveBeenCalledWith('parent-id');
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        materializedPath: '/parent/sub',
      }));
      expect(result.materializedPath).toBe('/parent/sub');
    });
  });

  describe('getAccessibleSpaces', () => {
    it('should query all active tenant spaces and filter them correctly in-memory', async () => {
      mockFindByUserId.mockResolvedValueOnce([{ groupId: 'group-a' }, { groupId: 'group-b' }]);

      const mockSpaces = [
        { _id: 'space-1', name: 'Public Space', slug: 'public', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PUBLIC' as const, materializedPath: '/public', collaborators: [], isActive: true, toObject: function() { return this; } },
        { _id: 'space-2', name: 'Personal Space', slug: 'personal', type: 'PERSONAL' as const, tenantId: 'tenant-1', ownerUserId: 'user-1', materializedPath: '/personal', collaborators: [], isActive: true, toObject: function() { return this; } },
        { _id: 'space-3', name: 'Other Personal Space', slug: 'other-personal', type: 'PERSONAL' as const, tenantId: 'tenant-1', ownerUserId: 'user-2', materializedPath: '/other-personal', collaborators: [], isActive: true, toObject: function() { return this; } }
      ];

      mockFind.mockResolvedValueOnce(mockSpaces);

      const result = await SpaceAccessService.getAccessibleSpaces('tenant-1', 'user-1', { isRoot: true, search: 'public' });

      expect(mockFindByUserId).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(mockFind).toHaveBeenCalledWith({ tenantId: 'tenant-1', isActive: true });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('space-1');
    });

    it('should block access to a public child space if its parent space is private and the user has no access to the parent', async () => {
      mockFindByUserId.mockResolvedValueOnce([]);

      const mockSpaces = [
        { _id: 'parent-private', name: 'Parent Private', slug: 'parent-private', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PRIVATE' as const, materializedPath: '/parent-private', collaborators: [], isActive: true, toObject: function() { return this; } },
        { _id: 'child-public', name: 'Child Public', slug: 'child-public', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PUBLIC' as const, parentSpaceId: 'parent-private', materializedPath: '/parent-private/child-public', collaborators: [], isActive: true, toObject: function() { return this; } }
      ];

      mockFind.mockResolvedValueOnce(mockSpaces);

      const result = await SpaceAccessService.getAccessibleSpaces('tenant-1', 'user-1');
      expect(result).toHaveLength(0);
    });

    it('should allow access to a private child space if user is collaborator on parent space and propagates is true', async () => {
      mockFindByUserId.mockResolvedValueOnce([]);

      const mockSpaces = [
        { _id: 'parent-private', name: 'Parent Private', slug: 'parent-private', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PRIVATE' as const, materializedPath: '/parent-private', collaborators: [{ subjectId: 'user-1', subjectType: 'USER' as const, role: 'VIEWER' as const, propagates: true }], isActive: true, toObject: function() { return this; } },
        { _id: 'child-private', name: 'Child Private', slug: 'child-private', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PRIVATE' as const, parentSpaceId: 'parent-private', materializedPath: '/parent-private/child-private', collaborators: [], isActive: true, toObject: function() { return this; } }
      ];

      mockFind.mockResolvedValueOnce(mockSpaces);

      const result = await SpaceAccessService.getAccessibleSpaces('tenant-1', 'user-1');
      expect(result).toHaveLength(2);
      expect(result.map(x => x._id)).toContain('parent-private');
      expect(result.map(x => x._id)).toContain('child-private');
    });

    it('should deny access to a private child space if user is collaborator on parent space but propagates is false', async () => {
      mockFindByUserId.mockResolvedValueOnce([]);

      const mockSpaces = [
        { _id: 'parent-private', name: 'Parent Private', slug: 'parent-private', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PRIVATE' as const, materializedPath: '/parent-private', collaborators: [{ subjectId: 'user-1', subjectType: 'USER' as const, role: 'VIEWER' as const, propagates: false }], isActive: true, toObject: function() { return this; } },
        { _id: 'child-private', name: 'Child Private', slug: 'child-private', type: 'TENANT' as const, tenantId: 'tenant-1', visibility: 'PRIVATE' as const, parentSpaceId: 'parent-private', materializedPath: '/parent-private/child-private', collaborators: [], isActive: true, toObject: function() { return this; } }
      ];

      mockFind.mockResolvedValueOnce(mockSpaces);

      const result = await SpaceAccessService.getAccessibleSpaces('tenant-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('parent-private');
    });
  });

  describe('moveSpace', () => {
    it('should throw an error if space to move does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(
        SpaceMoveService.moveSpace('nonexistent-space', 'parent-id', 'tenant-1')
      ).rejects.toThrow('Espacio no encontrado');
    });

    it('should throw an error if new parent space does not exist', async () => {
      const mockSpace = {
        _id: 'space-1',
        name: 'Space to move',
        slug: 'to-move',
        materializedPath: '/to-move',
      };
      mockFindById.mockResolvedValueOnce(mockSpace); // find space itself
      mockFindById.mockResolvedValueOnce(null); // find new parent

      await expect(
        SpaceMoveService.moveSpace('space-1', 'new-parent-id', 'tenant-1')
      ).rejects.toThrow('El nuevo espacio padre no existe');
    });

    it('should move space and recursively update paths of all child spaces', async () => {
      const mockSpace = {
        _id: 'space-to-move',
        name: 'Space to move',
        slug: 'moving',
        parentSpaceId: 'old-parent',
        materializedPath: '/old-parent/moving',
        toObject: function() { return this; },
      };

      const mockNewParent = {
        _id: 'new-parent',
        name: 'New Parent Space',
        slug: 'new-parent',
        materializedPath: '/new-parent',
        toObject: function() { return this; },
      };

      // 1. mockFindById calls
      mockFindById.mockImplementation((id: string) => {
        if (id === 'space-to-move') return Promise.resolve(mockSpace);
        if (id === 'new-parent') return Promise.resolve(mockNewParent);
        return Promise.resolve(null);
      });

      // 2. mockFind to return child spaces of oldPath
      const mockChildren = [
        {
          _id: 'child-1',
          name: 'Child One',
          slug: 'child-1',
          materializedPath: '/old-parent/moving/child-1',
          toObject: function() { return this; },
        },
        {
          _id: 'child-2',
          name: 'Child Two',
          slug: 'child-2',
          materializedPath: '/old-parent/moving/child-2',
          toObject: function() { return this; },
        }
      ];
      mockFind.mockResolvedValueOnce(mockChildren);

      await SpaceMoveService.moveSpace('space-to-move', 'new-parent', 'tenant-1', 'user-1', 'user@test.com');

      // Verify finding the children
      expect(mockFind).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        materializedPath: { $regex: '^/old-parent/moving/' },
      });

      // Verify update calls
      // One update for the moved space itself
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('space-to-move', {
        $set: {
          parentSpaceId: 'new-parent',
          materializedPath: '/new-parent/moving',
          updatedAt: expect.any(Date),
        }
      });

      // Two updates for the child spaces
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('child-1', {
        $set: {
          materializedPath: '/new-parent/moving/child-1',
          updatedAt: expect.any(Date),
        }
      });
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('child-2', {
        $set: {
          materializedPath: '/new-parent/moving/child-2',
          updatedAt: expect.any(Date),
        }
      });

      // Audit event logged
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'MOVE_SPACE',
        entityId: 'space-to-move',
        changedFields: {
          parentSpaceId: 'new-parent',
          materializedPath: '/new-parent/moving',
        },
        previousState: {
          parentSpaceId: 'old-parent',
          materializedPath: '/old-parent/moving',
        }
      }));
    });
  });

  describe('updateSpaceVisibility', () => {
    it('should throw an error if space to update does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(
        SpaceMoveService.updateSpaceVisibility('nonexistent-space', 'PRIVATE', 'tenant-1', 'user-1', 'user@test.com')
      ).rejects.toThrow('Espacio no encontrado');
    });

    it('should update visibility of space itself', async () => {
      const mockSpace = {
        _id: 'space-id',
        name: 'Space',
        slug: 'space',
        visibility: 'PUBLIC' as const,
        materializedPath: '/space',
        toObject: function() { return this; },
      };

      mockFindById.mockResolvedValueOnce(mockSpace);

      await SpaceMoveService.updateSpaceVisibility('space-id', 'PRIVATE', 'tenant-1', 'user-1', 'user@test.com', false);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('space-id', {
        $set: {
          visibility: 'PRIVATE',
          updatedAt: expect.any(Date),
        }
      });

      expect(mockLogEvent).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        action: 'UPDATE_SPACE',
        entityType: 'SPACE',
        entityId: 'space-id',
        userId: 'user-1',
        userEmail: 'user@test.com',
        changedFields: { visibility: 'PRIVATE' },
        previousState: { visibility: 'PUBLIC' },
      });
    });

    it('should cascade visibility to descendants and log heritage events', async () => {
      const mockSpace = {
        _id: 'parent-space-id',
        name: 'Parent Space',
        slug: 'parent',
        visibility: 'PUBLIC' as const,
        materializedPath: '/parent',
        toObject: function() { return this; },
      };

      mockFindById.mockResolvedValueOnce(mockSpace);

      const mockDescendants = [
        {
          _id: 'child-1-id',
          name: 'Child One',
          slug: 'child-1',
          visibility: 'PUBLIC' as const,
          materializedPath: '/parent/child-1',
          toObject: function() { return this; },
        },
        {
          _id: 'child-2-id',
          name: 'Child Two',
          slug: 'child-2',
          visibility: 'INTERNAL' as const,
          materializedPath: '/parent/child-2',
          toObject: function() { return this; },
        }
      ];

      mockFind.mockResolvedValueOnce(mockDescendants);

      await SpaceMoveService.updateSpaceVisibility('parent-space-id', 'PRIVATE', 'tenant-1', 'user-1', 'user@test.com', true);

      // Verify database queries
      expect(mockFind).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        materializedPath: { $regex: '^/parent/' },
      });

      // Verify updates
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('parent-space-id', expect.any(Object));
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('child-1-id', {
        $set: {
          visibility: 'PRIVATE',
          updatedAt: expect.any(Date),
        }
      });
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('child-2-id', {
        $set: {
          visibility: 'PRIVATE',
          updatedAt: expect.any(Date),
        }
      });

      // Verify audit logs for heritage
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'HERITAGE_VISIBILITY',
        entityId: 'child-1-id',
        changedFields: { visibility: 'PRIVATE', inheritedFrom: 'parent-space-id' },
        previousState: { visibility: 'PUBLIC' },
      }));
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'HERITAGE_VISIBILITY',
        entityId: 'child-2-id',
        changedFields: { visibility: 'PRIVATE', inheritedFrom: 'parent-space-id' },
        previousState: { visibility: 'INTERNAL' },
      }));
    });
  });

  describe('getSpaceByPath', () => {
    it('should return the validated Space object matching the materialized path', async () => {
      const mockSpaceDoc = {
        _id: 'space-id',
        name: 'Target Space',
        slug: 'target',
        tenantId: 'tenant-1',
        type: 'TENANT' as const,
        visibility: 'PUBLIC' as const,
        materializedPath: '/target',
        toObject: function() { return this; },
      };

      mockFindByPath.mockResolvedValueOnce(mockSpaceDoc);

      const result = await SpaceService.getSpaceByPath('/target', 'tenant-1');

      expect(mockFindByPath).toHaveBeenCalledWith('tenant-1', '/target');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Target Space');
      expect(result?._id).toBe('space-id');
    });

    it('should return null if path does not exist', async () => {
      mockFindByPath.mockResolvedValueOnce(null);

      const result = await SpaceService.getSpaceByPath('/nonexistent', 'tenant-1');

      expect(result).toBeNull();
    });
  });
});
