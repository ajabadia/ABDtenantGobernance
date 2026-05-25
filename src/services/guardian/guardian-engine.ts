import { PermissionService } from '@/services/tenant/permission-service';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';
import { delegatedRoleRepository } from '@/lib/repositories/DelegatedRoleRepository';
import type { PermissionPolicy } from '@/lib/schemas/permissions';

export interface EvaluationRequest {
  tenantId: string;
  userId: string;
  resource: string;
  action: string;
  context?: {
    isSuperAdmin?: boolean;
    ip?: string;
  };
}

export interface EvaluationResult {
  decision: 'ALLOW' | 'DENY';
  reason?: string;
  allowedSpaceIds?: string[];
  allowedGroupIds?: string[];
}

export class GuardianEngine {
  /**
   * Evalúa si un usuario tiene permiso para realizar una acción sobre un recurso.
   * Aplica un modelo ABAC con herencia de roles transitorios (Delegación).
   */
  static async evaluate(req: EvaluationRequest): Promise<EvaluationResult> {
    const { tenantId, userId, resource, action, context } = req;
    
    // 1. Bypass para Super Admins globales
    if (context?.isSuperAdmin) {
      return { decision: 'ALLOW', reason: 'SUPER_ADMIN_BYPASS' };
    }

    // 2. Obtener membresías directas del usuario
    const memberships = await userGroupMembershipRepository.findByUserId(tenantId, userId);
    const groupIds = new Set<string>(memberships.map(m => m.groupId.toString()));

    // 3. Obtener delegaciones temporales activas (el usuario es delegado por otro)
    const activeDelegations = await delegatedRoleRepository.findActiveByDelegatee(tenantId, userId);
    
    // Añadimos grupos delegados
    for (const delegation of activeDelegations) {
      if (delegation.groupIds) {
        delegation.groupIds.forEach(gid => groupIds.add(gid.toString()));
      }
    }

    // 4. Resolución de espacios permitidos
    const { SpaceService } = await import('@/services/tenant/space-service');
    const userSpaces = await SpaceService.getAccessibleSpaces(tenantId, userId);
    const allowedSpaceIds = userSpaces.map(s => s._id!.toString());
    const allowedGroupIds = Array.from(groupIds);

    // 5. Resolver políticas efectivas desde los grupos (Resolución BFS Jerárquica)
    let allPolicies = await PermissionService.resolveEffectivePolicies(
      tenantId,
      allowedGroupIds
    );

    // Añadimos políticas directas desde delegaciones (si aplica)
    const directPolicyIds = new Set<string>();
    for (const delegation of activeDelegations) {
      if (delegation.policyIds) {
        delegation.policyIds.forEach(pid => directPolicyIds.add(pid.toString()));
      }
    }

    if (directPolicyIds.size > 0) {
      const { PermissionPolicyRepository } = await import('@/lib/repositories/PermissionPolicyRepository');
      const policyRepo = new PermissionPolicyRepository();
      const directPoliciesDocs = await policyRepo.find({
        tenantId,
        _id: { $in: Array.from(directPolicyIds) },
        isActive: true,
      });
      
      const { PermissionPolicySchema } = await import('@/lib/schemas/permissions');
      const directPolicies = directPoliciesDocs.map(doc => {
        const obj = doc.toObject();
        if (obj._id) obj._id = obj._id.toString();
        return PermissionPolicySchema.parse(obj) as PermissionPolicy;
      });
      allPolicies = allPolicies.concat(directPolicies);
    }

    // 5. Evaluar políticas (DENY tiene precedencia absoluta)
    let isAllowed = false;

    for (const policy of allPolicies) {
      // Soporte para wilcards y match exacto
      const resourceMatch = policy.resources.some((r: string) => r === '*' || r === resource || resource.startsWith(`${r}/`));
      const actionMatch = policy.actions.some((a: string) => a === '*' || a === action);

      if (resourceMatch && actionMatch) {
        if (policy.effect === 'DENY') {
          return { decision: 'DENY', reason: `Explicit DENY from policy: ${policy.name}` };
        }
        if (policy.effect === 'ALLOW') {
          isAllowed = true;
        }
      }
    }

    if (isAllowed) {
      return { decision: 'ALLOW', allowedSpaceIds, allowedGroupIds };
    }

    return { decision: 'DENY', reason: 'Implicit DENY: No matching ALLOW policy found for this context', allowedSpaceIds, allowedGroupIds };
  }
}
