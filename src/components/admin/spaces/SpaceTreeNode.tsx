'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Pencil, Trash2, Plus, Users, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TreeNode } from './SpaceTreeView';
import type { SpaceData } from './CreateEditSpaceModal';

interface Props {
  node: TreeNode;
  customSpaceLabels: string[];
  onEdit: (space: SpaceData) => void;
  onDelete: (spaceId: string) => void;
  onAddChild: (parentId: string) => void;
  onManageCollaborators: (space: SpaceData) => void;
  onManageAssets: (space: SpaceData) => void;
}

export function SpaceTreeNode({ node, customSpaceLabels, onEdit, onDelete, onAddChild, onManageCollaborators, onManageAssets }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [expanded, setExpanded] = useState(node.depth < 1);
  const hasChildren = node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) setExpanded(!expanded);
  };

  const depthPads = ['pl-[8px]', 'pl-[32px]', 'pl-[56px]', 'pl-[80px]', 'pl-[104px]', 'pl-[128px]', 'pl-[152px]', 'pl-[176px]', 'pl-[200px]', 'pl-[224px]'];
  const paddingClass = depthPads[Math.min(node.depth, depthPads.length - 1)] || depthPads[depthPads.length - 1];

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-primary/[0.04] transition-colors group ${paddingClass} ${
          node.depth > 0 ? 'ml-6 border-l border-border/40' : ''
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label={expanded ? t('collapse') : t('expand')}
          className={`p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors ${!hasChildren && 'invisible'}`}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <span className="text-muted-foreground shrink-0">
          {hasChildren && expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>

        <div className="flex-1 min-w-0">
          <span className="font-sans text-xs font-bold text-foreground truncate block">
            {node.name}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60 truncate block">
            {node.materializedPath} {/* visibility badge */}
            {node.visibility && (
              <span className={`ml-2 uppercase ${
                node.visibility === 'PUBLIC' ? 'text-green-500' :
                node.visibility === 'INTERNAL' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                [{node.visibility}]
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onEdit(node)}
            aria-label={t('edit', { defaultMessage: 'Editar' })}
            className="p-1 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-sm transition-all"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={() => onAddChild(node._id!)}
            aria-label={t('add_child', { defaultMessage: 'Añadir hijo' })}
            className="p-1 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-sm transition-all"
          >
            <Plus size={11} />
          </button>
          <button
            type="button"
            onClick={() => onManageCollaborators(node)}
            aria-label={t('manage_collaborators', { defaultMessage: 'Colaboradores' })}
            className="p-1 text-muted-foreground/50 hover:text-blue-400 hover:bg-blue-500/10 rounded-sm transition-all"
          >
            <Users size={11} />
          </button>
          <button
            type="button"
            onClick={() => onManageAssets(node)}
            aria-label={t('manage_assets', { defaultMessage: 'Activos' })}
            className="p-1 text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10 rounded-sm transition-all"
          >
            <FileText size={11} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node._id!)}
            aria-label={t('delete', { defaultMessage: 'Eliminar' })}
            className="p-1 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>

        {customSpaceLabels.includes(node._id!) && (
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 font-mono text-[8px] font-black uppercase tracking-wider shrink-0">
            {t('custom', { defaultMessage: 'custom' })}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <SpaceTreeNode
              key={child._id}
              node={child}
              customSpaceLabels={customSpaceLabels}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onManageCollaborators={onManageCollaborators}
              onManageAssets={onManageAssets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
