'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  fetchGroupsAction,
  fetchPoliciesAction,
  deleteGroupAction,
} from './actions';

export interface Group {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}

export interface Policy {
  _id: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive: boolean;
}

export function usePermissionsPage() {
  const tPerm = useTranslations('admin.permissions');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';

  const [tenantId, setTenantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'groups' | 'policies'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [manageMembersGroup, setManageMembersGroup] = useState<{ id: string; name: string } | null>(null);

  const availableApps = ['quiz', 'rag', 'governance'];

  useEffect(() => {
    const resolveTenant = async () => {
      const explicit = searchParams.get('tenantId');
      if (explicit) {
        setTenantId(explicit);
      } else {
        setTenantId('academia-alfa');
      }
    };
    resolveTenant();
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [groupsRes, policiesRes] = await Promise.all([
      fetchGroupsAction(tenantId),
      fetchPoliciesAction(tenantId),
    ]);
    if (groupsRes.error) toast.error('Error al cargar grupos');
    else setGroups((groupsRes.data as Group[]) || []);

    if (policiesRes.error) toast.error('Error al cargar políticas');
    else setPolicies((policiesRes.data as Policy[]) || []);

    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    startTransition(() => { fetchData(); });
  }, [fetchData]);

  const deleteGroupDialog = {
    open: false as boolean,
    data: null as { id: string; name: string } | null,
    confirm: async () => {},
    cancel: () => {},
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    // Simplified — the actual dialog uses useConfirmDialog from ecosystem-widgets
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  return {
    tenantId, setTenantId,
    activeTab, setActiveTab,
    groups, setGroups,
    policies, setPolicies,
    loading, setLoading,
    groupModalOpen, setGroupModalOpen,
    policyModalOpen, setPolicyModalOpen,
    editingGroup, setEditingGroup,
    manageMembersGroup, setManageMembersGroup,
    availableApps,
    locale,
    searchParams,
    fetchData,
    deleteGroupDialog,
    handleDeleteGroup,
    handleEditGroup,
  };
}
