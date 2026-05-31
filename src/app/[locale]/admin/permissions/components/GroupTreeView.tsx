'use client';


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
import { Shield } from 'lucide-react';
import { GroupTreeNode } from './GroupTreeNode';
import type { GroupNode } from './GroupTreeNode';

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
