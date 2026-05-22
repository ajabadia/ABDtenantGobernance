'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Trash2, Edit2, Users, Shield } from 'lucide-react';

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

type GroupNode = Group & { children: GroupNode[] };

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
  const t = useTranslations('admin.permissions');
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
        <button aria-label={collapsed ? t('expand') : t('collapse')}
          onClick={() => setCollapsed(!collapsed)}
          className={`flex-shrink-0 transition-transform duration-150 ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <ChevronRight
            size={12}
            className={`text-muted-foreground transition-transform duration-200 ${!collapsed && hasChildren ? 'rotate-90' : ''}`}
          />
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground truncate">{node.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase">{node.slug}</span>
          </div>
          {node.description && (
            <span className="font-mono text-[9px] text-muted-foreground/70 truncate">{node.description}</span>
          )}
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
                {t('table.more', { count: assignedPolicies.length - 3 })}
              </span>
            )}
            {node.allowedApps?.map(app => (
              <span key={app} className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-primary/20 text-primary/70 bg-primary/5">
                {app}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button aria-label={t('membersLabel')}
            onClick={() => onManageMembers(node._id, node.name)}
            className="p-1.5 text-muted-foreground hover:text-primary border border-transparent hover:border-border transition-all rounded-none"
          >
            <Users size={11} />
          </button>
          <button aria-label={t('editGroup')}
            onClick={() => onEdit(node)}
            className="p-1.5 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all rounded-none"
          >
            <Edit2 size={11} />
          </button>
          <button aria-label={t('deleteGroup')}
            onClick={() => onDelete(node._id, node.name)}
            className="p-1.5 text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all rounded-none"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

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

export function GroupTreeView({ 
  groups, 
  policies,
  loading,
  onEdit, 
  onDelete, 
  onManageMembers,
  onCreateFirst
}: {
  groups: Group[];
  policies: Policy[];
  loading: boolean;
  onEdit: (group: Group) => void;
  onDelete: (groupId: string, groupName: string) => void;
  onManageMembers: (groupId: string, groupName: string) => void;
  onCreateFirst: () => void;
}) {
  const t = useTranslations('admin.permissions');
  const groupTree = buildTree(groups);

  return (
    <div className="border border-border rounded-none bg-card/40 backdrop-blur-sm overflow-hidden">
      {loading ? (
        <div className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
          {t('loadingGroups')}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-6 py-16 flex flex-col items-center gap-4 text-muted-foreground/50">
          <Shield size={32} strokeWidth={1} />
          <span className="font-mono text-[10px] uppercase tracking-widest">
            {t('noGroups')}
          </span>
          <button aria-label={t('createFirstGroup')}
            onClick={onCreateFirst}
            className="mt-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all rounded-none"
          >
            {t('createFirstGroup')}
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 px-4 py-3 bg-secondary/40 border-b border-border">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {t('hierarchyHeader')}
            </span>
          </div>
          {groupTree.map(node => (
            <GroupTreeNode
              key={node._id}
              node={node}
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
