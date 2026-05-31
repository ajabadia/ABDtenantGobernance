'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Folder, LayoutGrid } from 'lucide-react';
import { SpaceTreeNode } from './SpaceTreeNode';
import { SpaceData } from './CreateEditSpaceModal';

interface SpaceTreeViewProps {
  spaces: SpaceData[];
  onEdit: (space: SpaceData) => void;
  onDelete: (spaceId: string) => void;
  onAddChild: (parentId: string) => void;
  onManageCollaborators: (space: SpaceData) => void;
  onManageAssets: (space: SpaceData) => void;
  customSpaceLabels: string[];
}

export interface TreeNode extends SpaceData {
  children: TreeNode[];
  depth: number;
}

export function SpaceTreeView({ spaces, onEdit, onDelete, onAddChild, onManageCollaborators, onManageAssets, customSpaceLabels }: SpaceTreeViewProps) {
  const t = useTranslations('dashboard.spaces');

  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    spaces.forEach(s => { map.set(s._id!, { ...s, children: [], depth: 0 }); });
    spaces.forEach(s => {
      const node = map.get(s._id!);
      if (node) {
        if (s.parentSpaceId && map.has(s.parentSpaceId)) {
          map.get(s.parentSpaceId)!.children.push(node);
        } else { roots.push(node); }
      }
    });
    const calcDepth = (nodes: TreeNode[], depth: number) => {
      nodes.forEach(n => { n.depth = depth; calcDepth(n.children, depth + 1); });
    };
    calcDepth(roots, 0);
    return roots;
  }, [spaces]);

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-secondary/10 rounded-xl border border-border border-dashed">
        <LayoutGrid className="h-12 w-12 text-primary mb-6 opacity-40" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-2">{t('no_spaces', { defaultMessage: 'Sin espacios configurados' })}</h3>
        <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground max-w-md leading-relaxed">
          {t('no_spaces_desc', { defaultMessage: 'No hay ninguna jerarquía definida para este tenant. Crea tu primer espacio raíz para empezar.' })}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden text-foreground shadow-xl backdrop-blur-sm">
      <div className="p-4 flex flex-col gap-1">
        {tree.map(node => (
          <SpaceTreeNode
            key={node._id}
            node={node}
            customSpaceLabels={customSpaceLabels}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onManageCollaborators={onManageCollaborators}
            onManageAssets={onManageAssets}
          />
        ))}
      </div>
    </div>
  );
}
