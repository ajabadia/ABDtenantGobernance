'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Shield, User, Trash2 } from 'lucide-react';
import { IamUser } from '@/lib/services/iamClient';
import { IPermissionGroup } from '@/models/PermissionGroup';

type CollaboratorInput = { subjectId: string; subjectType: 'USER' | 'GROUP'; role: 'VIEWER' | 'EDITOR' | 'ADMIN'; propagates: boolean };

interface Props {
  collaborators: CollaboratorInput[];
  users: IamUser[];
  groups: IPermissionGroup[];
  onRoleChange: (subjectId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN') => void;
  onPropagatesChange: (subjectId: string, propagates: boolean) => void;
  onRemove: (subjectId: string) => void;
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

export function CollaboratorAssignmentList({ collaborators, users, groups, onRoleChange, onPropagatesChange, onRemove }: Props) {
  const t = useTranslations('dashboard.spaces');

  const resolveSubjectName = (c: CollaboratorInput) => {
    if (c.subjectType === 'USER') {
      const u = users.find(x => String(x._id) === String(c.subjectId));
      return u ? `${u.name} ${u.surname}` : 'Unknown';
    } else {
      const g = groups.find(x => String(x._id) === String(c.subjectId));
      return g ? getGroupPathName(g, groups) : 'Unknown';
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2 shrink-0">
        {t('assigned_collaborators')} ({collaborators.length})
      </span>
      <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
        {collaborators.length === 0 ? (
          <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
            {t('no_explicit_collaborators')}
          </div>
        ) : (
          collaborators.map(c => (
            <div key={String(c.subjectId)} className="flex items-center justify-between px-4 py-3 hover:bg-primary/[0.02]">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                {c.subjectType === 'GROUP' ? (
                  <Shield size={14} className="text-amber-500 shrink-0" />
                ) : (
                  <User size={14} className="text-primary shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-sans text-xs font-bold text-foreground truncate" title={resolveSubjectName(c)}>
                    {resolveSubjectName(c)}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">{c.subjectType}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-mono text-muted-foreground uppercase" title={t('heritage_title')}>
                    {t('heritage')}
                  </label>
                  <input 
                    type="checkbox" 
                    checked={c.propagates} 
                    onChange={e => onPropagatesChange(c.subjectId, e.target.checked)} 
                    className="w-3 h-3 rounded border-border text-primary focus:ring-primary" 
                  />
                </div>
                <select 
                  className="h-7 bg-secondary/30 border border-border text-[10px] font-mono uppercase text-foreground px-2 focus:border-primary outline-none" 
                  value={c.role} 
                  onChange={e => onRoleChange(c.subjectId, e.target.value as 'VIEWER' | 'EDITOR' | 'ADMIN')}
                >
                  <option value="VIEWER">{t('role_viewer')}</option>
                  <option value="EDITOR">{t('role_editor')}</option>
                  <option value="ADMIN">{t('role_admin')}</option>
                </select>
                <button type="button" onClick={() => onRemove(c.subjectId)} 
                  aria-label="Remove collaborator"
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
