'use client';

import { ChevronRight, Trash2, Edit2, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

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

export type GroupNode = Group & { children: GroupNode[] };

interface GroupTreeNodeProps {
  node: GroupNode;
  depth?: number;
  onEdit: (group: Group) => void;
  onDelete: (groupId: string, groupName: string) => void;
  onManageMembers: (groupId: string, groupName: string) => void;
  policies: Policy[];
}

export function GroupTreeNode({
  node,
  depth = 0,
  onEdit,
  onDelete,
  onManageMembers,
  policies,
}: GroupTreeNodeProps) {
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir grupo' : 'Colapsar grupo'}
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
          <button
            onClick={() => onManageMembers(node._id, node.name)}
            aria-label={t('membersLabel', { defaultMessage: 'Miembros del grupo' })}
            className="p-1.5 text-muted-foreground hover:text-primary border border-transparent hover:border-border transition-all rounded-none"
          >
            <Users size={11} />
          </button>
          <button
            onClick={() => onEdit(node)}
            aria-label={t('editGroup', { defaultMessage: 'Editar grupo' })}
            className="p-1.5 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all rounded-none"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(node._id, node.name)}
            aria-label={t('deleteGroup', { defaultMessage: 'Eliminar grupo' })}
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
