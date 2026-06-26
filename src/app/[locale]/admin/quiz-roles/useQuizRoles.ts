'use client';

/**
 * @purpose Gestiona roles de quiz para inquilinos en la aplicación ABDSuite, incluyendo la recuperación, asignación, revocación y asignación en masa de roles.
 * @purpose_en Manages quiz roles for tenants in the ABDSuite application, including fetching, assigning, revoking, and bulk-assigning roles.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Custom Hook
 * @complexity Medium
 * @fingerprint exports:2,imports:10,sig:1nmr3vt
 * @lastUpdated 2026-06-26T10:04:59.617Z
 */

import { useEffect, useState, useCallback, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchTenantRoleCustomizationAction } from './role-queries';
import { fetchQuizRolesAction, assignQuizRoleAction, revokeQuizRoleAction, bulkAssignQuizRolesAction } from './actions';
import { fetchUsersAction } from '@/app/[locale]/admin/users/actions';
import { type RoleLiteralsMap } from '@ajabadia/styles';
import { type IamUser } from '@/lib/services/iamClient';
import { type QuizRoleRecord } from './types';

export type ScopeType = 'space' | 'course' | 'exam_config';

export function useQuizRoles(locale: string) {
  const tAdmin = useTranslations('admin');
  const searchParams = useSearchParams();

  const [tenantId, setTenantId] = useState<string>('');
  const [roles, setRoles] = useState<Partial<QuizRoleRecord>[]>([]);
  const [users, setUsers] = useState<IamUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterScopeType, setFilterScopeType] = useState<string>('');
  const [filterScopeId, setFilterScopeId] = useState<string>('');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [assignScopeType, setAssignScopeType] = useState<ScopeType>('space');
  const [assignScopeId, setAssignScopeId] = useState<string>('');
  const [assignRoleType, setAssignRoleType] = useState<'CREATOR' | 'AUDITOR'>('AUDITOR');
  const [assigning, setAssigning] = useState(false);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkScopeType, setBulkScopeType] = useState<ScopeType>('space');
  const [bulkScopeId, setBulkScopeId] = useState<string>('');
  const [bulkRoleType, setBulkRoleType] = useState<'CREATOR' | 'AUDITOR'>('AUDITOR');
  const [bulkUserIds, setBulkUserIds] = useState<string[]>([]);
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [bulking, setBulking] = useState(false);

  const [roleLiterals, setRoleLiterals] = useState<RoleLiteralsMap | undefined>(undefined);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; userId: string } | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      const explicit = searchParams.get('tenantId');
      setTenantId(explicit || 'academia-alfa');
    };
    resolve();
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [rolesRes, usersRes, roleCustRes] = await Promise.all([
      fetchQuizRolesAction(tenantId, {
        scopeType: filterScopeType || undefined,
        scopeId: filterScopeId || undefined,
      }),
      fetchUsersAction(tenantId),
      fetchTenantRoleCustomizationAction(tenantId),
    ]);
    if (rolesRes.error) toast.error(tAdmin('quizRoles.loadError'));
    else setRoles(rolesRes.data || []);
    if (!usersRes.error) setUsers(usersRes.data || []);
    if (!roleCustRes.error && roleCustRes.roleCustomization?.roleLiterals) {
      setRoleLiterals(roleCustRes.roleCustomization.roleLiterals);
    }
    setLoading(false);
  }, [tenantId, filterScopeType, filterScopeId, tAdmin]);

  useEffect(() => { startTransition(() => { fetchData(); }); }, [fetchData]);

  const resetAssignForm = () => {
    setAssignUserId(''); setAssignScopeType('space'); setAssignScopeId(''); setAssignRoleType('AUDITOR');
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignScopeId) { toast.error(tAdmin('quizRoles.validationError')); return; }
    setAssigning(true);
    const res = await assignQuizRoleAction(tenantId, { userId: assignUserId, scopeType: assignScopeType, scopeId: assignScopeId, roleType: assignRoleType });
    if (res.error) toast.error(res.error);
    else { toast.success(tAdmin('quizRoles.assignSuccess')); setAssignModalOpen(false); resetAssignForm(); fetchData(); }
    setAssigning(false);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const res = await revokeQuizRoleAction(revokeTarget.id, tenantId);
    if (res.error) toast.error(res.error);
    else { toast.success(tAdmin('quizRoles.revokeSuccess')); setRevokeTarget(null); fetchData(); }
    setRevoking(false);
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkUserIds.length === 0 || !bulkScopeId) { toast.error(tAdmin('quizRoles.bulkValidationError')); return; }
    setBulking(true);
    const res = await bulkAssignQuizRolesAction(tenantId, { userIds: bulkUserIds, scopeType: bulkScopeType, scopeId: bulkScopeId, roleType: bulkRoleType });
    if (res.error && !res.data) toast.error(res.error);
    else { toast.success(tAdmin('quizRoles.bulkSuccess', { assigned: res.data?.assigned || 0, skipped: res.data?.skipped || 0 })); setBulkModalOpen(false); setBulkUserIds([]); setBulkSelectAll(false); fetchData(); }
    setBulking(false);
  };

  const userMap = new Map(users.map((u) => [u._id, u]));

  return {
    tenantId, roles, users, loading, userMap, roleLiterals, locale,
    filterScopeType, setFilterScopeType, filterScopeId, setFilterScopeId,
    assignModalOpen, setAssignModalOpen, assignUserId, setAssignUserId,
    assignScopeType, setAssignScopeType, assignScopeId, setAssignScopeId,
    assignRoleType, setAssignRoleType, assigning, resetAssignForm,
    bulkModalOpen, setBulkModalOpen, bulkScopeType, setBulkScopeType,
    bulkScopeId, setBulkScopeId, bulkRoleType, setBulkRoleType,
    bulkUserIds, setBulkUserIds, bulkSelectAll, setBulkSelectAll, bulking,
    revokeTarget, setRevokeTarget, revoking,
    fetchData, handleAssign, handleRevoke, handleBulkAssign,
  };
}
