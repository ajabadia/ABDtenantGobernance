'use client';

import { GroupTreeView } from './GroupTreeView';
import { PoliciesTable } from './PoliciesTable';
import { PermissionsTabBar } from './PermissionsTabBar';
import type { Group, Policy } from '../usePermissionsPage';

interface PermissionsContentPanelsProps {
  activeTab: 'groups' | 'policies';
  onTabChange: (tab: 'groups' | 'policies') => void;
  groups: Group[];
  policies: Policy[];
  loading: boolean;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (id: string, name: string) => void;
  onManageMembers: (id: string, name: string) => void;
  onCreateFirstGroup: () => void;
}

export function PermissionsContentPanels({ activeTab, onTabChange, groups, policies, loading, onEditGroup, onDeleteGroup, onManageMembers, onCreateFirstGroup }: PermissionsContentPanelsProps) {
  return (
    <>
      <PermissionsTabBar activeTab={activeTab} onTabChange={onTabChange} groupsCount={groups.length} policiesCount={policies.length} />
      {activeTab === 'groups' && <GroupTreeView groups={groups} policies={policies} loading={loading} onEdit={onEditGroup} onDelete={onDeleteGroup} onManageMembers={onManageMembers} onCreateFirst={onCreateFirstGroup} />}
      {activeTab === 'policies' && <PoliciesTable policies={policies} loading={loading} />}
    </>
  );
}
