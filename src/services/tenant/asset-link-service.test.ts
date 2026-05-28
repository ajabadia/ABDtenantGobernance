import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AssetLinkService, verifyAssetSovereignty } from './asset-link-service';

// Mock database contexts
vi.mock('@/lib/database/tenant-model', () => {
  const mongoose = require('mongoose');
  return {
    withTenantContext: vi.fn(async (callback) => await callback()),
    getTenantModel: (modelName: string, schema: any) =>
      mongoose.models[modelName] || mongoose.model(modelName, schema),
    tenantStorage: { getStore: vi.fn(), run: vi.fn() },
  };
});

// Mock repositories and services
vi.mock('@/lib/repositories/AssetSpaceLinkRepository', () => {
  const mockFindByAssetId = vi.fn();
  const mockFindBySpaceId = vi.fn();
  const mockFindOne = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdateMany = vi.fn();
  const mockExec = vi.fn();

  mockUpdateMany.mockReturnValue({ exec: mockExec });

  class MockAssetSpaceLinkRepository {
    findByAssetId = mockFindByAssetId;
    findBySpaceId = mockFindBySpaceId;
    findOne = mockFindOne;
    delete = mockDelete;
    model = {
      updateMany: mockUpdateMany,
    };
  }

  return {
    AssetSpaceLinkRepository: MockAssetSpaceLinkRepository,
    mockFindByAssetId,
    mockFindBySpaceId,
    mockFindOne,
    mockDelete,
    mockUpdateMany,
    mockExec,
  };
});

vi.mock('@/lib/repositories/SpaceRepository', () => {
  const mockFindById = vi.fn();
  class MockSpaceRepository {
    findById = mockFindById;
  }
  return {
    SpaceRepository: MockSpaceRepository,
    mockFindById,
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

// Mock Mongoose model creation
vi.mock('@/models/AssetSpaceLink', () => {
  const mockCreate = vi.fn();
  return {
    default: {
      create: mockCreate,
    },
    mockCreate,
  };
});

// Mock global fetch for sovereignty check
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import mock references
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindByAssetId, mockFindBySpaceId, mockFindOne, mockDelete, mockUpdateMany, mockExec } from '@/lib/repositories/AssetSpaceLinkRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindById } from '@/lib/repositories/SpaceRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockCreate } from '@/models/AssetSpaceLink';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockLogEvent } from './audit-service';

describe('AssetLinkService & Sovereignty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
  });

  describe('verifyAssetSovereignty', () => {
    it('should return false if prefix matches no satellite in test/prod', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = await verifyAssetSovereignty('tenant-1', 'unknown-123');
      expect(result).toBe(false);
    });

    it('should call fetch and return true if responds belongsToTenant true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ belongsToTenant: true }),
      });
      const result = await verifyAssetSovereignty('tenant-1', 'quiz-test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('quiz-test'),
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    it('should fallback to bypass in development environments when fetch fails', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await verifyAssetSovereignty('tenant-1', 'quiz-test');
      expect(result).toBe(true);
    });
  });

  describe('linkAsset', () => {
    it('should throw an error if destination space does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(
        AssetLinkService.linkAsset('tenant-1', 'user-1', 'quiz-1', 'space-invalid')
      ).rejects.toThrow('El espacio destino no existe, está inactivo o pertenece a otro tenant');
    });

    it('should correctly transactionally link asset and audit', async () => {
      mockFindById.mockResolvedValueOnce({
        _id: 'space-1',
        isActive: true,
        tenantId: 'tenant-1',
        materializedPath: '/my-space',
        slug: 'my-space',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ belongsToTenant: true }),
      });

      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as unknown as mongoose.ClientSession);

      const mockDoc = {
        _id: 'link-1',
        tenantId: 'tenant-1',
        assetId: 'quiz-1',
        spaceId: 'space-1',
        spacePath: '/my-space',
        isPrimary: true,
        toObject: function() { return this; },
      };

      mockCreate.mockResolvedValueOnce([mockDoc]);

      const result = await AssetLinkService.linkAsset('tenant-1', 'user-1', 'quiz-1', 'space-1', true, 'user@test.com');

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', assetId: 'quiz-1', isPrimary: true },
        { $set: { isPrimary: false } },
        { session: mockSession }
      );
      expect(mockCreate).toHaveBeenCalledWith([expect.objectContaining({
        tenantId: 'tenant-1',
        assetId: 'quiz-1',
        spaceId: 'space-1',
      })], { session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'LINK_ASSET',
        userId: 'user-1',
        userEmail: 'user@test.com',
      }));
      expect(result.assetId).toBe('quiz-1');
    });
  });
});
