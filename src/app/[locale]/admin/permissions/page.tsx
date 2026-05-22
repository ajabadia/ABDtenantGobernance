'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Shield, ArrowLeft, Plus, RefreshCw, Trash2, Edit2, ChevronRight, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchGroupsAction,
  fetchPoliciesAction,
  deleteGroupAction,
} from './actions';
import { GroupFormModal } from './components/GroupFormModal';
import { PolicyFormModal } from './components/PolicyFormModal';
import { ManageGroupMembersModal } from './components/ManageGroupMembersModal';
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

type GroupNode = Group & { children: GroupNode[] };

interface Policy {
  _id: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive: boolean;
}

// Build a tree from flat group list
function buildTree(groups: Group[]): GroupNode[] {
  const map = new Map<string, GroupNode>();
  groups.forEach(g => map.set(g._id, { ...g, children: [] }));

  const roots: GroupNode[] = [];

  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function GroupTreeNode({
  node,
  depth = 0,
  onEdit,
  onDelete,
  onManageMembers,
  policies,
}: {
  node: GroupNode;
  depth?: number;
  onEdit: (group: Group) => void;
  onDelete: (groupId: string, groupName: string) => void;
  onManageMembers: (groupId: string, groupName: string) => void;
  policies: Policy[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children.length > 0;
  const assignedPolicies = policies.filter(p => node.policyIds?.includes(p._id));

  return (
    <div className="group">
      <div
        className={`flex items-center gap-2 px-4 py-3 hover:bg-primary/[0.03] transition-colors border-b border-border/40 ${
          depth === 0 ? 'pl-4' : depth === 1 ? 'pl-12' : depth === 2 ? 'pl-20' : 'pl-28'
        }`}
      >
        {/* Expand toggle */}
        <button aria-label={collapsed ? 'Expandir grupo' : 'Colapsar grupo'}
          onClick={() => setCollapsed(!collapsed)}
          className={`flex-shrink-0 transition-transform duration-150 ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <ChevronRight
            size={12}
            className={`text-muted-foreground transition-transform duration-200 ${!collapsed && hasChildren ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Group info */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground truncate">{node.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase">{node.slug}</span>
          </div>
          {node.description && (
            <span className="font-mono text-[9px] text-muted-foreground/70 truncate">{node.description}</span>
          )}
          {/* Policies & apps badges */}
          <div className="flex flex-wrap gap-1 mt-1">
            {assignedPolicies.slice(0, 3).map(p => (
              <span
                key={p._id}
                className={`font-mono text-[8px] uppercase px-1.5 py-0.5 border ${
                  p.effect === 'ALLOW' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'
                }`}
              >
                {p.name}
              </span>
            ))}
            {assignedPolicies.length > 3 && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-border text-muted-foreground">
                +{assignedPolicies.length - 3}
              </span>
            )}
            {node.allowedApps?.map(app => (
              <span key={app} className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-primary/20 text-primary/70 bg-primary/5">
                {app}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button aria-label={`Miembros del grupo ${node.name}`}
              onClick={() => onManageMembers(node._id, node.name)}
              className="p-1.5 text-muted-foreground hover:text-primary border border-transparent hover:border-border transition-all rounded-none"
            >
              <Users size={11} />
            </button>
            <button aria-label={`Editar grupo ${node.name}`}
              onClick={() => onEdit(node)}
              className="p-1.5 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all rounded-none"
            >
              <Edit2 size={11} />
            </button>
            <button aria-label={`Eliminar grupo ${node.name}`}
              onClick={() => onDelete(node._id, node.name)}
              className="p-1.5 text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all rounded-none"
            >
              <Trash2 size={11} />
            </button>
          </div>
      </div>

      {/* Children */}
      {!collapsed && hasChildren && (
        <div>
          {node.children.map(child => (
            <GroupTreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageMembers={onManageMembers}
              policies={policies}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PermissionsPage() {
  const t = useTranslations('admin');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const tenantId = searchParams.get('tenantId') || 'academia-alfa';

  const [activeTab, setActiveTab] = useState<'groups' | 'policies'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [manageMembersGroup, setManageMembersGroup] = useState<{id: string, name: string} | null>(null);

  const availableApps = ['quiz', 'rag', 'governance'];

  const fetchData = async () => {
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
    if (!confirm(`¿Eliminar el grupo "${groupName}"? Esta acción no es reversible.`)) return;
    const res = await deleteGroupAction(groupId, tenantId);
    if (res.error) {
      toast.error(res.error === 'DEPENDENT_SUBGROUPS_EXIST'
        ? 'No se puede eliminar: tiene subgrupos dependientes activos'
        : res.error);
    } else {
      toast.success('Grupo eliminado');
      fetchData();
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  const groupTree = buildTree(groups);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <AdminPageHeader
          icon={Shield}
          breadcrumb={<>{t('controlConsole')} • {'PERMISOS'}</>}
          title="Grupos y Permisos"
          backButton={
              <Link
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Volver al dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={<>Gestiona grupos de acceso con jerarquía recursiva y políticas ABAC para el tenant{' '}
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
                aria-label="Crear nuevo grupo"
                onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <Plus className="h-4 w-4" />
                NUEVO GRUPO
              </button>
            ) : (
              <button
                aria-label="Crear nueva política"
                onClick={() => setPolicyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <Plus className="h-4 w-4" />
                NUEVA POLÍTICA
              </button>
            )}
        </AdminPageHeader>

        {/* Tabs */}
        <div className="flex border-b border-border gap-0" role="tablist">
        <button aria-label="Pestaña grupos de permisos"
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
            {'Grupos'} ({groups.length})
          </span>
        </button>
        <button aria-label="Pestaña políticas ABAC"
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
            {'Políticas ABAC'} ({policies.length})
          </span>
        </button>
        </div>

        {/* Tab: Groups Tree */}
        {activeTab === 'groups' && (
          <div className="border border-border rounded-none bg-card/40 backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {'CARGANDO ESTRUCTURA DE GRUPOS...'}
              </div>
            ) : groups.length === 0 ? (
              <div className="px-6 py-16 flex flex-col items-center gap-4 text-muted-foreground/50">
                <Shield size={32} strokeWidth={1} />
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  {'No hay grupos definidos para este tenant'}
                </span>
                <button aria-label="Crear primer grupo de permisos"
                  onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                  className="mt-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all rounded-none"
                >
                  {'Crear Primer Grupo'}
                </button>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-1 px-4 py-3 bg-secondary/40 border-b border-border">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {'JERARQUÍA DE GRUPOS'}
                  </span>
                </div>
                {groupTree.map(node => (
                  <GroupTreeNode
                    key={node._id}
                    node={node}
                    onEdit={handleEditGroup}
                    onDelete={handleDeleteGroup}
                    onManageMembers={(id, name) => setManageMembersGroup({ id, name })}
                    policies={policies}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Policies Table */}
        {activeTab === 'policies' && (
          <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
            <table className="w-full text-left divide-y divide-border/60">
              <thead className="bg-secondary/40">
              <tr>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{'POLÍTICA'}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{'EFECTO'}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{'RECURSOS'}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{'ACCIONES'}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{'ESTADO'}</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                      {'CARGANDO POLÍTICAS...'}
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                      NO HAY POLÍTICAS DEFINIDAS
                    </td>
                  </tr>
                ) : (
                  policies.map(p => (
                    <tr key={p._id} className="hover:bg-primary/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="text-xs font-sans text-foreground/90 font-bold block">{p.name}</span>
                        {p.description && (
                          <span className="font-mono text-[9px] text-muted-foreground">{p.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-[10px] font-black uppercase px-2 py-1 border ${
                          p.effect === 'ALLOW'
                            ? 'border-green-500/30 text-green-400 bg-green-500/5'
                            : 'border-red-500/30 text-red-400 bg-red-500/5'
                        }`}>
                          {p.effect}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {p.resources.slice(0, 2).map((r, i) => (
                            <span key={i} className="font-mono text-[9px] text-muted-foreground">{r}</span>
                          ))}
                          {p.resources.length > 2 && (
                            <span className="font-mono text-[9px] text-muted-foreground/50">+{p.resources.length - 2} más</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[9px] text-muted-foreground uppercase">
                          {p.actions.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-[9px] uppercase font-black px-2 py-1 border ${
                          p.isActive
                            ? 'border-green-500/30 text-green-400 bg-green-500/5'
                            : 'border-border text-muted-foreground'
                        }`}>
                          {p.isActive ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
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
