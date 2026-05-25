'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Shield, ArrowLeft, Plus, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchGroupsAction,
  fetchPoliciesAction,
  deleteGroupAction,
} from './actions';
import { GroupFormModal } from './components/GroupFormModal';
import { PolicyFormModal } from './components/PolicyFormModal';
import { ManageGroupMembersModal } from './components/ManageGroupMembersModal';
import { GroupTreeView } from './components/GroupTreeView';
import { PoliciesTable } from './components/PoliciesTable';
import { AdminPageHeader } from '@abd/styles';

interface Group {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}

interface Policy {
  _id: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive: boolean;
}

export default function PermissionsPage() {
  const tAdmin = useTranslations('admin');
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
  const [manageMembersGroup, setManageMembersGroup] = useState<{id: string, name: string} | null>(null);

  const availableApps = ['quiz', 'rag', 'governance'];

  useEffect(() => {
    const resolveTenant = async () => {
      const explicit = searchParams.get('tenantId');
      if (explicit) {
        setTenantId(explicit);
      } else {
        try {
          const { getIndustrialSession } = await import('@/lib/session');
          const session = await getIndustrialSession();
          if (session?.user?.tenantId) {
            setTenantId(session.user.tenantId);
          } else {
            setTenantId('academia-alfa');
          }
        } catch {
          setTenantId('academia-alfa');
        }
      }
    };
    resolveTenant();
  }, [searchParams]);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [tenantId]);

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(tPerm('confirmDelete', { name: groupName }))) return;
    const res = await deleteGroupAction(groupId, tenantId);
    if (res.error) {
      toast.error(res.error === 'DEPENDENT_SUBGROUPS_EXIST'
        ? tPerm('deleteDependentError')
        : res.error);
    } else {
      toast.success(tPerm('deleteSuccess'));
      fetchData();
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        <AdminPageHeader
          icon={Shield}
          breadcrumb={<>{tAdmin('controlConsole')} • {tPerm('title').toUpperCase()}</>}
          title={tPerm('title')}
          backButton={
              <Link
                href={`/${locale}/admin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Volver al dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={<>{tPerm('subtitle')}
              <span className="text-primary font-bold">{tenantId}</span>.</>}
        >
            <button
              aria-label="Refrescar datos"
              onClick={fetchData}
              className="inline-flex items-center justify-center p-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-black uppercase transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {activeTab === 'groups' ? (
              <button
                aria-label={tPerm('newGroup')}
                onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <Plus className="h-4 w-4" />
                {tPerm('newGroup')}
              </button>
            ) : (
              <button
                aria-label={tPerm('newPolicy')}
                onClick={() => setPolicyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <Plus className="h-4 w-4" />
                {tPerm('newPolicy')}
              </button>
            )}
        </AdminPageHeader>

        <div className="flex border-b border-border gap-0" role="tablist">
        <button aria-label={tPerm('tabs.groups')}
          role="tab"
          aria-selected={activeTab === 'groups'}
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
            activeTab === 'groups'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield size={11} />
            {tPerm('tabs.groups')} ({groups.length})
          </span>
        </button>
        <button aria-label={tPerm('tabs.policies')}
          role="tab"
          aria-selected={activeTab === 'policies'}
          onClick={() => setActiveTab('policies')}
          className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
            activeTab === 'policies'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText size={11} />
            {tPerm('tabs.policies')} ({policies.length})
          </span>
        </button>
        </div>

        {activeTab === 'groups' && (
          <GroupTreeView
            groups={groups}
            policies={policies}
            loading={loading}
            onEdit={handleEditGroup}
            onDelete={handleDeleteGroup}
            onManageMembers={(id, name) => setManageMembersGroup({ id, name })}
            onCreateFirst={() => { setEditingGroup(null); setGroupModalOpen(true); }}
          />
        )}

        {activeTab === 'policies' && (
          <PoliciesTable policies={policies} loading={loading} />
        )}
      </div>

      <GroupFormModal
        tenantId={tenantId}
        isOpen={groupModalOpen}
        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }}
        onSuccess={fetchData}
        editingGroup={editingGroup}
        groups={groups}
        policies={policies}
        availableApps={availableApps}
      />

      <PolicyFormModal
        tenantId={tenantId}
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        onSuccess={fetchData}
      />

      {manageMembersGroup && (
        <ManageGroupMembersModal
          tenantId={tenantId}
          groupId={manageMembersGroup.id}
          groupName={manageMembersGroup.name}
          isOpen={!!manageMembersGroup}
          onClose={() => setManageMembersGroup(null)}
          onSuccess={fetchData}
        />
      )}
    </main>
  );
}
