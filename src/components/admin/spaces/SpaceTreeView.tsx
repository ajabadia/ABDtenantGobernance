'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, ChevronDown, Folder, Plus, Trash2, Edit2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpaceData } from './CreateEditSpaceModal';

interface SpaceTreeViewProps {
  spaces: SpaceData[];
  onEdit: (space: SpaceData) => void;
  onDelete: (spaceId: string) => void;
  onAddChild: (parentId: string) => void;
  customSpaceLabels: string[];
}

interface TreeNode extends SpaceData {
  children: TreeNode[];
  depth: number;
}

export function SpaceTreeView({ spaces, onEdit, onDelete, onAddChild, customSpaceLabels }: SpaceTreeViewProps) {
  const t = useTranslations('dashboard.spaces');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Construir el árbol recursivamente
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize nodes
    spaces.forEach(s => {
      map.set(s._id!, { ...s, children: [], depth: 0 });
    });

    // Build hierarchy
    spaces.forEach(s => {
      const node = map.get(s._id!);
      if (node) {
        if (s.parentSpaceId && map.has(s.parentSpaceId)) {
          const parent = map.get(s.parentSpaceId)!;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    // Calcular profundidades
    const calcDepth = (nodes: TreeNode[], depth: number) => {
      nodes.forEach(n => {
        n.depth = depth;
        calcDepth(n.children, depth + 1);
      });
    };
    calcDepth(roots, 0);

    return roots;
  }, [spaces]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const getLabelForDepth = (depth: number) => {
    if (depth < customSpaceLabels.length) {
      return customSpaceLabels[depth];
    }
    return `L${(depth + 1).toString().padStart(2, '0')}`;
  };

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node._id!);
    const hasChildren = node.children.length > 0;
    const levelLabel = getLabelForDepth(node.depth);

    const paddingClasses = ['pl-2', 'pl-8', 'pl-14', 'pl-20', 'pl-24', 'pl-28'];
    const paddingClass = paddingClasses[node.depth] || 'pl-32';

    return (
      <div key={node._id} className="select-none">
        <div 
          className={`flex items-center group py-3 pr-4 hover:bg-secondary/20 rounded-lg transition-colors border border-transparent hover:border-border ${paddingClass}`}
        >
          <div className="w-5 flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={() => hasChildren && toggleExpand(node._id!)}>
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />
            ) : <span className="w-4" />}
          </div>
          
          <Folder size={16} className="text-primary mr-3 flex-shrink-0" />
          
          <div className="flex-grow flex flex-col min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm tracking-wide truncate text-foreground">{node.name}</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest font-mono">
                {levelLabel}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate hidden md:inline-block">
                {node.materializedPath}
              </span>
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/20" onClick={() => onAddChild(node._id!)} title={t('new_space')}>
              <Plus size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/20" onClick={() => onEdit(node)} title={t('edit_space')}>
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(node._id!)}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="flex flex-col">
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

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
        {tree.map(renderNode)}
      </div>
    </div>
  );
}
