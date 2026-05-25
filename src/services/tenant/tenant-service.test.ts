import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService } from './tenant-service';

// Mock repositories and services
vi.mock('@/lib/repositories/TenantRepository', () => {
  const mockFindByTenantId = vi.fn();
  const mockFind = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  const mockExec = vi.fn();

  mockFindOneAndUpdate.mockReturnValue({ exec: mockExec });

  class MockTenantRepository {
    findByTenantId = mockFindByTenantId;
    find = mockFind;
    create = mockCreate;
    update = mockUpdate;
    model = {
      findOneAndUpdate: mockFindOneAndUpdate,
    };
  }

  return {
    TenantRepository: MockTenantRepository,
    mockFindByTenantId,
    mockFind,
    mockCreate,
    mockUpdate,
    mockFindOneAndUpdate,
    mockExec,
  };
});

vi.mock('@/lib/security', () => {
  return {
    SecurityService: {
      encrypt: vi.fn((text: string) => `encrypted:${text}`),
      decrypt: vi.fn((text: string) => text.startsWith('encrypted:') ? text.replace('encrypted:', '') : text),
    },
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

vi.mock('@/models/Space', () => {
  const mockAggregate = vi.fn();
  return {
    default: {
      aggregate: mockAggregate,
    },
    mockAggregate,
  };
});

// Import mock references
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindByTenantId, mockFind, mockCreate, mockUpdate, mockFindOneAndUpdate, mockExec } from '@/lib/repositories/TenantRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockLogEvent } from './audit-service';
import { SecurityService } from '@/lib/security';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockAggregate } from '@/models/Space';

describe('TenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should query the database on cache miss, populate the cache, and decrypt taxId', async () => {
      const tenantId = 'tenant-test-1';
      const mockTenantDoc = {
        _id: 'mongo-id-1',
        tenantId,
        name: 'Test Tenant 1',
        active: true,
        billing: {
          fiscalName: 'Fiscal Name 1',
          taxId: 'encrypted:B12345678',
        },
        toObject: function() { return this; }
      };

      mockFindByTenantId.mockResolvedValueOnce(mockTenantDoc);

      // First call (cache miss)
      const result1 = await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(1);
      expect(result1.billing?.taxId).toBe('B12345678');
      expect(SecurityService.decrypt).toHaveBeenCalledWith('encrypted:B12345678');

      // Second call (cache hit)
      const result2 = await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toEqual(result1);
    });

    it('should throw an error if the tenant does not exist', async () => {
      const tenantId = 'tenant-nonexistent';
      mockFindByTenantId.mockResolvedValueOnce(null);

      await expect(TenantService.getConfig(tenantId)).rejects.toThrow(
        `Configuración de tenant no encontrada para ID: ${tenantId}`
      );
    });
  });

  describe('updateConfig', () => {
    it('should encrypt taxId, update database, purge cache, and log audit event', async () => {
      const tenantId = 'tenant-test-2';
      const prevDoc = {
        _id: 'mongo-id-2',
        tenantId,
        name: 'Test Tenant 2',
        active: true,
        billing: {
          fiscalName: 'Fiscal Name 2',
          taxId: 'encrypted:B22222222',
        },
        toObject: function() { return this; }
      };

      const updatedDoc = {
        _id: 'mongo-id-2',
        tenantId,
        name: 'Updated Tenant 2',
        active: true,
        billing: {
          fiscalName: 'Updated Fiscal 2',
          taxId: 'encrypted:B99999999',
        },
        toObject: function() { return this; }
      };

      mockFindByTenantId.mockResolvedValue(prevDoc); // Called for previous state & subsequent getConfig cache test
      mockExec.mockResolvedValueOnce(updatedDoc);

      // Prime the cache first by doing a getConfig
      await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(1);

      // Now update config
      const updateData = {
        name: 'Updated Tenant 2',
        billing: {
          fiscalName: 'Updated Fiscal 2',
          taxId: 'B99999999',
        }
      };

      const result = await TenantService.updateConfig(tenantId, updateData, 'user-admin');

      expect(result.name).toBe('Updated Tenant 2');
      expect(result.billing?.taxId).toBe('B99999999');
      expect(SecurityService.encrypt).toHaveBeenCalledWith('B99999999');
      expect(mockFindOneAndUpdate).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        tenantId,
        action: 'UPDATE_TENANT_CONFIG',
        userId: 'user-admin',
      }));

      // Cache should be purged. Let's do getConfig and see if mockFindByTenantId is called again
      // mockFindByTenantId was called once before. Now we set a new resolved value for the new DB state
      mockFindByTenantId.mockResolvedValueOnce(updatedDoc);
      const resultAfterUpdate = await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(3); // DB queried again due to purge (1st getConfig, 2nd updateConfig prev state, 3rd getConfig after purge)
      expect(resultAfterUpdate.name).toBe('Updated Tenant 2');
    });

    it('should determine the correct audit action for app and branding updates', async () => {
      const tenantId = 'tenant-test-audit';
      const prevDoc = {
        _id: 'mongo-id-audit',
        tenantId,
        name: 'Audit Tenant',
        active: true,
        toObject: function() { return this; }
      };

      mockFindByTenantId.mockResolvedValue(prevDoc);
      mockExec.mockResolvedValue(prevDoc);

      // 1. App updates
      await TenantService.updateConfig(tenantId, { allowedApps: ['app-1'] }, 'user-admin');
      expect(mockLogEvent).toHaveBeenLastCalledWith(expect.objectContaining({
        action: 'UPDATE_TENANT_LICENSING',
      }));

      // 2. Branding updates
      await TenantService.updateConfig(tenantId, { branding: { colors: { primary: '#ff0000' }, rounded: true, radius: '0.375rem' } }, 'user-admin');
      expect(mockLogEvent).toHaveBeenLastCalledWith(expect.objectContaining({
        action: 'UPDATE_BRANDING',
      }));
    });
  });

  describe('createTenant', () => {
    it('should throw an error if the tenant ID is already registered', async () => {
      const tenantId = 'tenant-dup';
      mockFindByTenantId.mockResolvedValueOnce({ tenantId, name: 'Duplicate' });

      await expect(TenantService.createTenant({ tenantId, name: 'New Tenant' })).rejects.toThrow(
        `El ID del Tenant 'tenant-dup' ya está registrado.`
      );
    });

    it('should create a tenant, encrypt billing data, and log the audit event', async () => {
      const tenantId = 'tenant-new';
      mockFindByTenantId.mockResolvedValueOnce(null); // No existing tenant

      const mockCreatedDoc = {
        _id: 'new-mongo-id',
        tenantId,
        name: 'New Tenant',
        active: true,
        billing: {
          fiscalName: 'New Fiscal',
          taxId: 'encrypted:B55555555',
        },
        toObject: function() { return this; }
      };

      mockCreate.mockResolvedValueOnce(mockCreatedDoc);

      const newTenantData = {
        tenantId,
        name: 'New Tenant',
        billing: {
          fiscalName: 'New Fiscal',
          taxId: 'B55555555',
        }
      };

      const result = await TenantService.createTenant(newTenantData, 'creator-user');

      expect(SecurityService.encrypt).toHaveBeenCalledWith('B55555555');
      expect(mockCreate).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        tenantId,
        action: 'CREATE_TENANT',
        userId: 'creator-user',
      }));
      expect(result.billing?.taxId).toBe('B55555555'); // Decrypted in return value
    });
  });

  describe('deleteTenant', () => {
    it('should soft delete the tenant, purge cache, and log the audit event', async () => {
      const tenantId = 'tenant-delete';
      const mockUpdatedDoc = {
        _id: 'delete-mongo-id',
        tenantId,
        name: 'Deleting Tenant',
        active: false,
        toObject: function() { return this; }
      };

      mockUpdate.mockResolvedValueOnce(mockUpdatedDoc);

      // Prime cache
      const mockTenantDoc = {
        _id: 'delete-mongo-id',
        tenantId,
        name: 'Deleting Tenant',
        active: true,
        toObject: function() { return this; }
      };
      mockFindByTenantId.mockResolvedValueOnce(mockTenantDoc);
      await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(1);

      // Perform soft delete
      await TenantService.deleteTenant('delete-mongo-id', 'deleter-user');

      expect(mockUpdate).toHaveBeenCalledWith('delete-mongo-id', {
        $set: { active: false }
      });
      expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
        tenantId,
        action: 'DELETE_TENANT',
        userId: 'deleter-user',
      }));

      // Cache should be purged. subsequent getConfig queries DB again
      mockFindByTenantId.mockResolvedValueOnce(mockUpdatedDoc);
      await TenantService.getConfig(tenantId);
      expect(mockFindByTenantId).toHaveBeenCalledTimes(2); // DB queried again
    });

    it('should throw an error if the tenant to delete does not exist', async () => {
      mockUpdate.mockResolvedValueOnce(null);

      await expect(TenantService.deleteTenant('nonexistent-id')).rejects.toThrow(
        'Tenant con ID nonexistent-id no encontrado.'
      );
    });
  });

  describe('getAllTenants', () => {
    it('should return all tenants with their decrypted taxId and spaceCount', async () => {
      const mockTenantList = [
        {
          _id: 'id-1',
          tenantId: 'tenant-1',
          name: 'Tenant 1',
          billing: { taxId: 'encrypted:TAX-1' },
          toObject: function() { return this; }
        },
        {
          _id: 'id-2',
          tenantId: 'tenant-2',
          name: 'Tenant 2',
          billing: { taxId: 'encrypted:TAX-2' },
          toObject: function() { return this; }
        }
      ];

      mockFind.mockResolvedValueOnce(mockTenantList);
      mockAggregate.mockResolvedValueOnce([
        { _id: 'tenant-1', count: 5 },
        { _id: 'tenant-2', count: 10 }
      ]);

      const result = await TenantService.getAllTenants();

      expect(mockFind).toHaveBeenCalled();
      expect(mockAggregate).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].tenantId).toBe('tenant-1');
      expect(result[0].billing?.taxId).toBe('TAX-1');
      expect(result[0].spaceCount).toBe(5);
      expect(result[1].tenantId).toBe('tenant-2');
      expect(result[1].billing?.taxId).toBe('TAX-2');
      expect(result[1].spaceCount).toBe(10);
    });
  });
});
