import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
});

// Mock SDK context
vi.mock('@ajabadia/satellite-sdk', () => ({
  connectDB: vi.fn(async () => {}),
  ensureIndustrialAccess: vi.fn(async () => ({ id: 'admin-user-id', email: 'admin@test.com', role: 'ADMIN' })),
  withTenantContext: vi.fn(async (callback) => await callback()),
}));

// Mock QuizUserRole model
vi.mock('@/models/QuizUserRole', () => {
  const mockFind = vi.fn();
  const mockCreate = vi.fn();
  const mockDeleteOne = vi.fn();
  const mockInsertMany = vi.fn();
  const mockSort = vi.fn();
  const mockLean = vi.fn();

  // Chain: find().sort().lean()
  mockFind.mockReturnValue({ sort: mockSort });
  mockSort.mockReturnValue({ lean: mockLean });

  const MockQuizUserRole = Object.assign(
    function () {
      return {};
    },
    {
      find: mockFind,
      create: mockCreate,
      deleteOne: mockDeleteOne,
      insertMany: mockInsertMany,
    }
  );

  return {
    default: MockQuizUserRole,
    mockFind,
    mockCreate,
    mockDeleteOne,
    mockInsertMany,
    mockSort,
    mockLean,
  };
});

// Mock TenantService
vi.mock('@/services/tenant/tenant-service', () => ({
  TenantService: {
    getConfig: vi.fn(async (tenantId: string) => ({
      tenantId,
      dbPrefix: tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: 'COLLECTION_PREFIX',
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Creador', en: 'Creator' },
          RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    })),
  },
}));

// Import mock references
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFind, mockCreate, mockDeleteOne, mockInsertMany, mockSort, mockLean } from '@/models/QuizUserRole';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';

import { fetchTenantRoleCustomizationAction } from './role-queries';
import {
  fetchQuizRolesAction,
  assignQuizRoleAction,
  revokeQuizRoleAction,
  bulkAssignQuizRolesAction,
} from './actions';

const TENANT_ID = 'academia-alfa';

describe('fetchTenantRoleCustomizationAction', () => {
    it('should return roleCustomization from TenantService.getConfig', async () => {
      const result = await fetchTenantRoleCustomizationAction(TENANT_ID);

      expect(result.roleCustomization).toBeDefined();
      expect(result.roleCustomization!.roleLiterals).toBeDefined();
      expect(result.roleCustomization!.roleLiterals.CREATOR.es).toBe('Creador');
      expect(result.roleCustomization!.roleLiterals.CREATOR.en).toBe('Creator');
      expect(result.roleCustomization!.roleLiterals.RECIPIENT.es).toBe('Destinatario');
      expect(result.roleCustomization!.roleLiterals.RECIPIENT.en).toBe('Recipient');
      expect(result.roleCustomization!.roleLiterals.AUDITOR.es).toBe('Auditor');
      expect(result.roleCustomization!.roleLiterals.AUDITOR.en).toBe('Auditor');
      expect(result.error).toBeUndefined();
    });

    it('should return error if TenantService.getConfig throws', async () => {
      // Re-import to get fresh mock reference
      const { TenantService } = await import('@/services/tenant/tenant-service');
      (TenantService.getConfig as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Config not found'));

      const result = await fetchTenantRoleCustomizationAction('nonexistent-tenant');

      expect(result.roleCustomization).toBeUndefined();
      expect(result.error).toBe('Config not found');
    });
  });

  describe('quizRoles actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchQuizRolesAction', () => {
    it('should fetch all roles without filters', async () => {
      const mockRoles = [
        { _id: 'role-1', tenantId: TENANT_ID, userId: 'user-1', scopeType: 'space', scopeId: 'space-1', roleType: 'CREATOR', assignedBy: 'admin-1', createdAt: new Date() },
        { _id: 'role-2', tenantId: TENANT_ID, userId: 'user-2', scopeType: 'course', scopeId: 'course-1', roleType: 'AUDITOR', assignedBy: 'admin-1', createdAt: new Date() },
      ];

      mockLean.mockResolvedValueOnce(mockRoles);

      const result = await fetchQuizRolesAction(TENANT_ID);

      expect(mockFind).toHaveBeenCalledWith({ tenantId: TENANT_ID });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockLean).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data![0].userId).toBe('user-1');
      expect(result.data![1].userId).toBe('user-2');
      expect(result.error).toBeUndefined();
    });

    it('should filter by scopeType when provided', async () => {
      mockLean.mockResolvedValueOnce([]);

      await fetchQuizRolesAction(TENANT_ID, { scopeType: 'space' });

      expect(mockFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, scopeType: 'space' });
    });

    it('should filter by scopeId when provided', async () => {
      mockLean.mockResolvedValueOnce([]);

      await fetchQuizRolesAction(TENANT_ID, { scopeId: 'space-42' });

      expect(mockFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, scopeId: 'space-42' });
    });

    it('should filter by both scopeType and scopeId', async () => {
      mockLean.mockResolvedValueOnce([]);

      await fetchQuizRolesAction(TENANT_ID, { scopeType: 'course', scopeId: 'course-7' });

      expect(mockFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, scopeType: 'course', scopeId: 'course-7' });
    });

    it('should serialize _id to string', async () => {
      const mockRole = { _id: 'role-id-1', tenantId: TENANT_ID, userId: 'user-1', scopeType: 'space', scopeId: 'space-1', roleType: 'AUDITOR', assignedBy: 'admin-1', createdAt: new Date() };
      mockLean.mockResolvedValueOnce([mockRole]);

      const result = await fetchQuizRolesAction(TENANT_ID);

      expect(result.data![0]).toHaveProperty('_id', 'role-id-1');
    });

    it('should return error if find throws', async () => {
      mockLean.mockRejectedValueOnce(new Error('DB connection failed'));

      const result = await fetchQuizRolesAction(TENANT_ID);

      expect(result.error).toBe('DB connection failed');
      expect(result.data).toBeUndefined();
    });
  });

  describe('assignQuizRoleAction', () => {
    const assignData = {
      userId: 'user-42',
      scopeType: 'space' as const,
      scopeId: 'space-1',
      roleType: 'CREATOR' as const,
    };

    it('should create a role successfully', async () => {
      const mockDoc = {
        _id: 'new-role-id',
        tenantId: TENANT_ID,
        userId: assignData.userId,
        scopeType: assignData.scopeType,
        scopeId: assignData.scopeId,
        roleType: assignData.roleType,
        assignedBy: 'admin-user-id',
        toObject: function () { return this; },
      };

      mockCreate.mockResolvedValueOnce(mockDoc);

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(ensureIndustrialAccess).toHaveBeenCalledWith('ADMIN');
      expect(mockCreate).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: assignData.userId,
        scopeType: assignData.scopeType,
        scopeId: assignData.scopeId,
        roleType: assignData.roleType,
        assignedBy: 'admin-user-id',
      });
      expect(result.data).toBeDefined();
      expect(result.data!._id).toBe('new-role-id');
      expect(result.data!.userId).toBe('user-42');
      expect(result.error).toBeUndefined();
    });

    it('should return DUPLICATE_ROLE error on E11000 duplicate key', async () => {
      const dupError = new Error('E11000 duplicate key');
      (dupError as unknown as { code: number }).code = 11000;
      mockCreate.mockRejectedValueOnce(dupError);

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(result.error).toBe('DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito');
      expect(result.data).toBeUndefined();
    });

    it('should return error message if create throws', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Validation failed'));

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(result.error).toBe('Validation failed');
    });
  });

  describe('revokeQuizRoleAction', () => {
    it('should revoke a role successfully', async () => {
      mockDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });

      const result = await revokeQuizRoleAction('role-to-delete', TENANT_ID);

      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'role-to-delete', tenantId: TENANT_ID });
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return ROLE_NOT_FOUND when role does not exist', async () => {
      mockDeleteOne.mockResolvedValueOnce({ deletedCount: 0 });

      const result = await revokeQuizRoleAction('nonexistent-role', TENANT_ID);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('ROLE_NOT_FOUND: No se encontró el rol especificado');
    });

    it('should return error message if deleteOne throws', async () => {
      mockDeleteOne.mockRejectedValueOnce(new Error('DB timeout'));

      const result = await revokeQuizRoleAction('role-id', TENANT_ID);

      expect(result.error).toBe('DB timeout');
    });
  });

  describe('bulkAssignQuizRolesAction', () => {
    const bulkData = {
      userIds: ['user-1', 'user-2', 'user-3'],
      scopeType: 'exam_config' as const,
      scopeId: 'exam-config-1',
      roleType: 'AUDITOR' as const,
    };

    it('should bulk assign roles successfully', async () => {
      mockInsertMany.mockResolvedValueOnce([{ _id: 'r1' }, { _id: 'r2' }, { _id: 'r3' }]);

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(ensureIndustrialAccess).toHaveBeenCalledWith('ADMIN');
      expect(mockInsertMany).toHaveBeenCalledWith(
        [
          { tenantId: TENANT_ID, userId: 'user-1', scopeType: 'exam_config', scopeId: 'exam-config-1', roleType: 'AUDITOR', assignedBy: 'admin-user-id' },
          { tenantId: TENANT_ID, userId: 'user-2', scopeType: 'exam_config', scopeId: 'exam-config-1', roleType: 'AUDITOR', assignedBy: 'admin-user-id' },
          { tenantId: TENANT_ID, userId: 'user-3', scopeType: 'exam_config', scopeId: 'exam-config-1', roleType: 'AUDITOR', assignedBy: 'admin-user-id' },
        ],
        { ordered: false }
      );
      expect(result.data).toEqual({ assigned: 3, skipped: 0 });
      expect(result.error).toBeUndefined();
    });

    it('should handle partial duplicates from insertMany with ordered: false', async () => {
      const bulkError = new Error('Some duplicate keys');
      (bulkError as unknown as { writeErrors: unknown[]; insertedCount: number }).writeErrors = [{}, {}];
      (bulkError as unknown as { insertedCount: number }).insertedCount = 1;
      mockInsertMany.mockRejectedValueOnce(bulkError);

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(result.data).toEqual({ assigned: 1, skipped: 2 });
      expect(result.error).toBe('DUPLICATE_ROLE: 2 usuario(s) ya tenían rol asignado');
    });

    it('should return 0 assigned when insertMany throws without insertedCount', async () => {
      const genericError = new Error('Bulk write failed');
      (genericError as unknown as { writeErrors?: unknown[]; insertedCount?: number }).writeErrors = undefined;
      (genericError as unknown as { insertedCount?: number }).insertedCount = 0;
      mockInsertMany.mockRejectedValueOnce(genericError);

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(result.data).toEqual({ assigned: 0, skipped: 3 });
    });

    it('should return assigned:0 and skipped count when insertMany throws a generic error', async () => {
      mockInsertMany.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(result.data).toEqual({ assigned: 0, skipped: 3 });
      expect(result.error).toBe('DUPLICATE_ROLE: 3 usuario(s) ya tenían rol asignado');
    });
  });
});
