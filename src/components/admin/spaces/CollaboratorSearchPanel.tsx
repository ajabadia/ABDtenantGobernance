'use client';

/**
 * @purpose Gestiona la funcionalidad de búsqueda para colaboradores en un espacio de gobernanza.
 * @purpose_en Manages the search functionality for collaborators in a governance space.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:qu4j75
 * @lastUpdated 2026-06-23T21:51:16.115Z
 */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Shield, User, X } from 'lucide-react';
import { IamUser } from '@/lib/services/iamClient';
import { IPermissionGroup } from '@/models/PermissionGroup';
import { CollaboratorSearchResultList } from './CollaboratorSearchResultList';

type CollaboratorInput = { subjectId: string; subjectType: 'USER' | 'GROUP'; role: 'VIEWER' | 'EDITOR' | 'ADMIN'; propagates: boolean };

interface Props {
  users: IamUser[];
  groups: IPermissionGroup[];
  collaborators: CollaboratorInput[];
  onAdd: (subjectId: string, subjectType: 'USER' | 'GROUP') => void;
  onClose: () => void;
}

function getGroupPathName(group: IPermissionGroup, allGroups: IPermissionGroup[]): string {
  const parts: string[] = [group.name];
  let current = group;
  let safetyCounter = 0;
  while (current.parentId && safetyCounter < 10) {
    const parentIdStr = String(current.parentId);
    const parent = allGroups.find(g => String(g._id) === parentIdStr);
    if (parent) {
      parts.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
    safetyCounter++;
  }
  return parts.join(' > ');
}

function normalize(txt: string | null | undefined) {
  return (txt || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function CollaboratorSearchPanel({ users, groups, collaborators, onAdd, onClose }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'GROUP' | 'USER'>('GROUP');

  const isAlreadyAdded = (id: string) => 
    collaborators.some(c => String(c.subjectId) === String(id));

  const searchClean = normalize(search).trim();

  const availableGroups = groups
    .filter(g => !isAlreadyAdded(String(g._id)))
    .map(g => ({
      id: String(g._id),
      name: getGroupPathName(g, groups),
      rawName: g.name,
      type: 'GROUP' as const
    }))
    .filter(g => !searchClean || normalize(g.name).includes(searchClean) || normalize(g.rawName).includes(searchClean));

  const availableUsers = users
    .filter(u => !isAlreadyAdded(String(u._id)))
    .map(u => ({
      id: String(u._id),
      name: `${u.name || ''} ${u.surname || ''}`.trim() || 'Unknown User',
      email: u.email || '',
      type: 'USER' as const
    }))
    .filter(u => !searchClean || normalize(u.name).includes(searchClean) || normalize(u.email).includes(searchClean));

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex border-b border-border/60 mb-2">
        <button
          type="button"
          onClick={() => { setActiveTab('GROUP'); setSearch(''); }}
          aria-label="Groups tab"
          className={`flex-1 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'GROUP' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10'
          }`}
        >
          <Shield size={12} />
          {t('groups_tab', { defaultMessage: 'Grupos' })}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('USER'); setSearch(''); }}
          aria-label="Users tab"
          className={`flex-1 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'USER' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10'
          }`}
        >
          <User size={12} />
          {t('users_tab', { defaultMessage: 'Usuarios' })}
        </button>
      </div>

      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder={activeTab === 'GROUP' ? t('search_groups_placeholder', { defaultMessage: 'Filtrar grupos por nombre...' }) : t('search_users_placeholder', { defaultMessage: 'Filtrar usuarios por nombre o email...' })} 
          className="w-full h-10 pl-9 pr-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground" 
        />
      </div>

      <CollaboratorSearchResultList
        activeTab={activeTab}
        items={activeTab === 'GROUP' ? availableGroups : availableUsers}
        search={search}
        onAdd={(id) => onAdd(id, activeTab)}
      />
    </div>
  );
}
