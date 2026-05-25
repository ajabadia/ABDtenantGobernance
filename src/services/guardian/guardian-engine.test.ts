import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuardianEngine } from './guardian-engine';

// 1. Mock repositories and services
vi.mock('@/lib/repositories/UserGroupMembershipRepository', () => {
  const mockFindByUserId = vi.fn();
  return {
    userGroupMembershipRepository: {
      findByUserId: mockFindByUserId,
    },
    mockFindByUserId,
  };
});

vi.mock('@/lib/repositories/DelegatedRoleRepository', () => {
  const mockFindActiveByDelegatee = vi.fn();
  return {
    delegatedRoleRepository: {
      findActiveByDelegatee: mockFindActiveByDelegatee,
    },
    mockFindActiveByDelegatee,
  };
});

vi.mock('@/lib/repositories/SpaceRepository', () => {
  const mockFind = vi.fn();
  class MockSpaceRepository {
    find = mockFind;
  }
  return {
    SpaceRepository: MockSpaceRepository,
    mockFindSpaces: mockFind,
  };
});

vi.mock('@/lib/repositories/PermissionPolicyRepository', () => {
  const mockFind = vi.fn();
  class MockPermissionPolicyRepository {
    find = mockFind;
  }
  return {
    PermissionPolicyRepository: MockPermissionPolicyRepository,
    mockFindPolicies: mockFind,
  };
});

vi.mock('@/services/tenant/permission-service', () => {
  const mockResolveEffectivePolicies = vi.fn();
  return {
    PermissionService: {
      resolveEffectivePolicies: mockResolveEffectivePolicies,
    },
    mockResolveEffectivePolicies,
  };
});

vi.mock('@/services/tenant/audit-service', () => {
  return {
    AuditService: {
      logEvent: vi.fn(),
    },
  };
});

vi.mock('@/lib/database/tenant-model', () => {
  return {
    withTenantContext: vi.fn(async (callback) => await callback()),
  };
});

// Import mock references
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindByUserId } from '@/lib/repositories/UserGroupMembershipRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindActiveByDelegatee } from '@/lib/repositories/DelegatedRoleRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindSpaces } from '@/lib/repositories/SpaceRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockFindPolicies } from '@/lib/repositories/PermissionPolicyRepository';
// @ts-expect-error - mock exports only exist in runtime mock
import { mockResolveEffectivePolicies } from '@/services/tenant/permission-service';

describe('GuardianEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluate', () => {
    it('should immediately ALLOW access if the user is a global Super Admin', async () => {
      const request = {
        tenantId: 'tenant-1',
        userId: 'user-super',
        resource: 'console/settings',
        action: 'write',
        context: { isSuperAdmin: true },
      };

      const result = await GuardianEngine.evaluate(request);

      expect(result).toEqual({
        decision: 'ALLOW',
        reason: 'SUPER_ADMIN_BYPASS',
      });
      // Verify other lookups were bypassed
      expect(mockFindByUserId).not.toHaveBeenCalled();
    });

    it('should DENY access if no policies match (implicit DENY)', async () => {
      mockFindByUserId.mockResolvedValue([]);
      mockFindActiveByDelegatee.mockResolvedValue([]);
      mockFindSpaces.mockResolvedValue([]);
      mockResolveEffectivePolicies.mockResolvedValue([]);

      const request = {
        tenantId: 'tenant-1',
        userId: 'user-normal',
        resource: 'space/secret-space',
        action: 'read',
      };

      const result = await GuardianEngine.evaluate(request);

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Implicit DENY');
      expect(result.allowedSpaceIds).toEqual([]);
      expect(result.allowedGroupIds).toEqual([]);
    });

    it('should ALLOW access when an ALLOW policy matches', async () => {
      mockFindByUserId.mockResolvedValue([
        { groupId: 'group-1' },
      ]);
      mockFindActiveByDelegatee.mockResolvedValue([]);
      
      const mockSpaceDoc = {
        _id: 'space-101',
        name: 'Space 101',
        slug: 'space-101',
        tenantId: 'tenant-1',
        type: 'TENANT' as const,
        visibility: 'PUBLIC' as const,
        materializedPath: '/space-101',
        collaborators: [],
        isActive: true,
        toObject: function() { return this; },
      };
      mockFindSpaces.mockResolvedValue([mockSpaceDoc]);

      const mockPolicy = {
        _id: 'policy-1',
        name: 'Allow View Spaces',
        effect: 'ALLOW' as const,
        resources: ['space'],
        actions: ['read'],
        isActive: true,
      };
      mockResolveEffectivePolicies.mockResolvedValue([mockPolicy]);

      const request = {
        tenantId: 'tenant-1',
        userId: 'user-normal',
        resource: 'space/space-101',
        action: 'read',
      };

      const result = await GuardianEngine.evaluate(request);

      expect(result.decision).toBe('ALLOW');
      expect(result.allowedSpaceIds).toEqual(['space-101']);
      expect(result.allowedGroupIds).toEqual(['group-1']);
    });

    it('should enforce explicit DENY policy taking absolute precedence over ALLOW policies', async () => {
      mockFindByUserId.mockResolvedValue([{ groupId: 'group-1' }]);
      mockFindActiveByDelegatee.mockResolvedValue([]);
      mockFindSpaces.mockResolvedValue([]);

      const mockAllowPolicy = {
        _id: 'policy-allow',
        name: 'Allow Space Actions',
        effect: 'ALLOW' as const,
        resources: ['space'],
        actions: ['*'],
        isActive: true,
      };

      const mockDenyPolicy = {
        _id: 'policy-deny',
        name: 'Deny Write Space',
        effect: 'DENY' as const,
        resources: ['space/critical-space'],
        actions: ['write'],
        isActive: true,
      };

      mockResolveEffectivePolicies.mockResolvedValue([mockAllowPolicy, mockDenyPolicy]);

      const request = {
        tenantId: 'tenant-1',
        userId: 'user-normal',
        resource: 'space/critical-space',
        action: 'write',
      };

      const result = await GuardianEngine.evaluate(request);

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Explicit DENY from policy: Deny Write Space');
    });

    it('should resolve policies from active temporal delegated roles', async () => {
      mockFindByUserId.mockResolvedValue([]); // No direct memberships
      
      const mockDelegation = {
        groupIds: ['group-delegated'],
        policyIds: ['policy-delegated-id'],
      };
      mockFindActiveByDelegatee.mockResolvedValue([mockDelegation]);
      mockFindSpaces.mockResolvedValue([]);

      // Resolve policies via delegated group
      const mockGroupPolicy = {
        _id: 'policy-g',
        name: 'Group Policy',
        effect: 'ALLOW' as const,
        resources: ['delegated-res'],
        actions: ['read'],
        isActive: true,
      };
      mockResolveEffectivePolicies.mockResolvedValue([mockGroupPolicy]);

      // Resolve policies via direct policyIds list
      const mockDirectPolicyDoc = {
        toObject: () => ({
          _id: 'policy-delegated-id',
          tenantId: 'tenant-1',
          name: 'Direct Delegated Policy',
          effect: 'ALLOW' as const,
          resources: ['delegated-res-direct'],
          actions: ['write'],
          isActive: true,
        }),
      };
      mockFindPolicies.mockResolvedValue([mockDirectPolicyDoc]);

      const request = {
        tenantId: 'tenant-1',
        userId: 'user-delegatee',
        resource: 'delegated-res-direct',
        action: 'write',
      };

      const result = await GuardianEngine.evaluate(request);

      expect(result.decision).toBe('ALLOW');
      expect(mockResolveEffectivePolicies).toHaveBeenCalledWith('tenant-1', ['group-delegated']);
      expect(mockFindPolicies).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        _id: { $in: ['policy-delegated-id'] },
        isActive: true,
      });
      expect(result.allowedGroupIds).toEqual(['group-delegated']);
    });
  });
});
