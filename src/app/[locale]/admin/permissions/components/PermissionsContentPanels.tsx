'use client';

/**
 * @purpose Gestiona una interfaz tabuada para el manejo de permisos, mostrando árboles de grupos y tablas de políticas según la pestaña activa.
 * @purpose_en Renders a tabbed interface for managing permissions, displaying group trees and policies tables based on the active tab.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1n5l7xd
 * @lastUpdated 2026-06-23T20:38:28.899Z
 */

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
