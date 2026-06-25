import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
});

const mockFetchRoles = vi.hoisted(() => vi.fn());
const mockAssignRole = vi.hoisted(() => vi.fn());
const mockRevokeRole = vi.hoisted(() => vi.fn());
const mockBulkAssignRoles = vi.hoisted(() => vi.fn());

vi.mock('@/services/quiz-role-client', () => ({
  QuizRoleClient: {
    fetchRoles: mockFetchRoles,
    assignRole: mockAssignRole,
    revokeRole: mockRevokeRole,
    bulkAssignRoles: mockBulkAssignRoles,
  },
}));

vi.mock('@ajabadia/satellite-sdk/auth-middleware', () => ({
  ensureIndustrialAccess: vi.fn(async () => ({ id: 'admin-user-id', email: 'admin@test.com', role: 'ADMIN' })),
}));

vi.mock('@ajabadia/satellite-sdk/db', () => ({
  encryptionPlugin: vi.fn(() => (schema: unknown) => schema),
}));

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

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
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
        { _id: 'role-1', tenantId: TENANT_ID, userId: 'user-1', scopeType: 'space', scopeId: 'space-1', roleType: 'CREATOR', assignedBy: 'admin-1' },
        { _id: 'role-2', tenantId: TENANT_ID, userId: 'user-2', scopeType: 'course', scopeId: 'course-1', roleType: 'AUDITOR', assignedBy: 'admin-1' },
      ];

      mockFetchRoles.mockResolvedValueOnce({ data: mockRoles });

      const result = await fetchQuizRolesAction(TENANT_ID);

      expect(mockFetchRoles).toHaveBeenCalledWith(TENANT_ID, undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].userId).toBe('user-1');
      expect(result.data![1].userId).toBe('user-2');
      expect(result.error).toBeUndefined();
    });

    it('should filter by scopeType when provided', async () => {
      mockFetchRoles.mockResolvedValueOnce({ data: [] });

      await fetchQuizRolesAction(TENANT_ID, { scopeType: 'space' });

      expect(mockFetchRoles).toHaveBeenCalledWith(TENANT_ID, { scopeType: 'space' });
    });

    it('should filter by scopeId when provided', async () => {
      mockFetchRoles.mockResolvedValueOnce({ data: [] });

      await fetchQuizRolesAction(TENANT_ID, { scopeId: 'space-42' });

      expect(mockFetchRoles).toHaveBeenCalledWith(TENANT_ID, { scopeId: 'space-42' });
    });

    it('should filter by both scopeType and scopeId', async () => {
      mockFetchRoles.mockResolvedValueOnce({ data: [] });

      await fetchQuizRolesAction(TENANT_ID, { scopeType: 'course', scopeId: 'course-7' });

      expect(mockFetchRoles).toHaveBeenCalledWith(TENANT_ID, { scopeType: 'course', scopeId: 'course-7' });
    });

    it('should return error if client returns error', async () => {
      mockFetchRoles.mockResolvedValueOnce({ error: 'DB connection failed' });

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
      };

      mockAssignRole.mockResolvedValueOnce({ data: mockDoc });

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(ensureIndustrialAccess).toHaveBeenCalledWith('ADMIN');
      expect(mockAssignRole).toHaveBeenCalledWith(TENANT_ID, {
        ...assignData,
        assignedBy: 'admin-user-id',
      });
      expect(result.data).toBeDefined();
      expect(result.data!._id).toBe('new-role-id');
      expect(result.data!.userId).toBe('user-42');
      expect(result.error).toBeUndefined();
    });

    it('should return DUPLICATE_ROLE error on conflict', async () => {
      mockAssignRole.mockResolvedValueOnce({ error: 'DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito' });

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(result.error).toBe('DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito');
      expect(result.data).toBeUndefined();
    });

    it('should return error message if client returns error', async () => {
      mockAssignRole.mockResolvedValueOnce({ error: 'Validation failed' });

      const result = await assignQuizRoleAction(TENANT_ID, assignData);

      expect(result.error).toBe('Validation failed');
    });
  });

  describe('revokeQuizRoleAction', () => {
    it('should revoke a role successfully', async () => {
      mockRevokeRole.mockResolvedValueOnce({ success: true });

      const result = await revokeQuizRoleAction('role-to-delete', TENANT_ID);

      expect(mockRevokeRole).toHaveBeenCalledWith('role-to-delete', TENANT_ID);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return ROLE_NOT_FOUND when role does not exist', async () => {
      mockRevokeRole.mockResolvedValueOnce({ error: 'ROLE_NOT_FOUND: No se encontró el rol especificado' });

      const result = await revokeQuizRoleAction('nonexistent-role', TENANT_ID);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('ROLE_NOT_FOUND: No se encontró el rol especificado');
    });

    it('should return error message if client returns error', async () => {
      mockRevokeRole.mockResolvedValueOnce({ error: 'DB timeout' });

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
      mockBulkAssignRoles.mockResolvedValueOnce({ data: { assigned: 3, skipped: 0 } });

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(ensureIndustrialAccess).toHaveBeenCalledWith('ADMIN');
      expect(mockBulkAssignRoles).toHaveBeenCalledWith(TENANT_ID, {
        ...bulkData,
        assignedBy: 'admin-user-id',
      });
      expect(result.data).toEqual({ assigned: 3, skipped: 0 });
      expect(result.error).toBeUndefined();
    });

    it('should handle partial duplicates', async () => {
      mockBulkAssignRoles.mockResolvedValueOnce({ data: { assigned: 1, skipped: 2 }, error: 'partial failure: 1 assigned' });

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(result.data).toEqual({ assigned: 1, skipped: 2 });
    });

    it('should return assigned 0 and skipped count on generic error', async () => {
      mockBulkAssignRoles.mockResolvedValueOnce({ error: 'Bulk write failed' });

      const result = await bulkAssignQuizRolesAction(TENANT_ID, bulkData);

      expect(result.error).toBe('Bulk write failed');
    });
  });
});
