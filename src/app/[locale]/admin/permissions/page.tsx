'use client';

/**
 * @purpose Gestiona y renderiza la página de permisos para un inquilino, incluyendo el manejo de grupos, creación de políticas y gestión de miembros.
 * @purpose_en Renders and manages the permissions page for a tenant, including group management, policy creation, and member management.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:12,sig:1mmczkp
 * @lastUpdated 2026-06-23T20:39:17.621Z
 */

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Shield, ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { deleteGroupAction } from './actions';
import { usePermissionsPage } from './usePermissionsPage';
import { GroupFormModal } from './components/GroupFormModal';
import { PolicyFormModal } from './components/PolicyFormModal';
import { ManageGroupMembersModal } from './components/ManageGroupMembersModal';
import { PermissionsContentPanels } from './components/PermissionsContentPanels';
import { AdminPageHeader } from '@ajabadia/styles';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';

export default function PermissionsPage() {
  const tAdmin = useTranslations('admin');
  const tPerm = useTranslations('admin.permissions');
  const { tenantId, activeTab, setActiveTab, groups, policies, loading, groupModalOpen, setGroupModalOpen, policyModalOpen, setPolicyModalOpen, editingGroup, setEditingGroup, manageMembersGroup, setManageMembersGroup, availableApps, locale, searchParams, fetchData } = usePermissionsPage();
  const deleteGroupDialog = useConfirmDialog<{ id: string; name: string }>({
    onConfirm: async (group) => {
      if (!group) return;
      const res = await deleteGroupAction(group.id, tenantId);
      if (res.error) { toast.error(res.error === 'DEPENDENT_SUBGROUPS_EXIST' ? tPerm('deleteDependentError') : res.error); }
      else { toast.success(tPerm('deleteSuccess')); fetchData(); }
    },
  });
  const handleDeleteGroup = (groupId: string, groupName: string) => { deleteGroupDialog.trigger({ id: groupId, name: groupName }); };
  const handleEditGroup = (group: import('./usePermissionsPage').Group) => { setEditingGroup(group); setGroupModalOpen(true); };
  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader icon={Shield} breadcrumb={<>{tAdmin('controlConsole')} • {tPerm('title').toUpperCase()}</>} title={tPerm('title')} backButton={<Link href={`/${locale}/admin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50" aria-label="Volver al dashboard"><ArrowLeft size={14} aria-hidden="true" /></Link>} description={<>{tPerm('subtitle')}<span className="text-primary font-bold">{tenantId}</span>.</>}>
          <button aria-label="Refrescar datos" onClick={fetchData} className="inline-flex items-center justify-center p-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-black uppercase transition-all duration-200 rounded-none active:scale-[0.98] focus:outline-none"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          {activeTab === 'groups' ? (
            <button aria-label={tPerm('newGroup')} onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"><Plus className="h-4 w-4" />{tPerm('newGroup')}</button>
          ) : (
            <button aria-label={tPerm('newPolicy')} onClick={() => setPolicyModalOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"><Plus className="h-4 w-4" />{tPerm('newPolicy')}</button>
          )}
        </AdminPageHeader>
        <PermissionsContentPanels activeTab={activeTab} onTabChange={setActiveTab} groups={groups} policies={policies} loading={loading} onEditGroup={handleEditGroup} onDeleteGroup={handleDeleteGroup} onManageMembers={(id, name) => setManageMembersGroup({ id, name })} onCreateFirstGroup={() => { setEditingGroup(null); setGroupModalOpen(true); }} />
      </div>
      <GroupFormModal tenantId={tenantId} isOpen={groupModalOpen} onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }} onSuccess={fetchData} editingGroup={editingGroup} groups={groups} policies={policies} availableApps={availableApps} />
      <PolicyFormModal tenantId={tenantId} isOpen={policyModalOpen} onClose={() => setPolicyModalOpen(false)} onSuccess={fetchData} />
      {manageMembersGroup && <ManageGroupMembersModal tenantId={tenantId} groupId={manageMembersGroup.id} groupName={manageMembersGroup.name} isOpen={!!manageMembersGroup} onClose={() => setManageMembersGroup(null)} onSuccess={fetchData} />}
      <ConfirmDialog open={deleteGroupDialog.open} title="ELIMINAR GRUPO" message={deleteGroupDialog.data ? tPerm('confirmDelete', { name: deleteGroupDialog.data.name }) : ''} confirmLabel="ELIMINAR" cancelLabel="CANCELAR" variant="danger" isLoading={deleteGroupDialog.isLoading} onConfirm={deleteGroupDialog.confirm} onCancel={deleteGroupDialog.cancel} />
    </main>
  );
}
