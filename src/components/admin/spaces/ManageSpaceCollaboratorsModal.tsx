'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Shield, Users, User, Trash2, Search } from 'lucide-react';
import { fetchUsersAction } from '@/app/[locale]/admin/users/actions';
import { fetchGroupsAction } from '@/app/[locale]/admin/permissions/actions';
import { IamUser } from '@/lib/services/iamClient';
import { IPermissionGroup } from '@/models/PermissionGroup';
import { SpaceData } from './SpaceForm';
import { useTranslations } from 'next-intl';

type CollaboratorInput = NonNullable<SpaceData['collaborators']>[0];
interface Props {
  tenantId: string;
  space: SpaceData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageSpaceCollaboratorsModal({ tenantId, space, isOpen, onClose, onSuccess }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [users, setUsers] = useState<IamUser[]>([]);
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'GROUP' | 'USER'>('GROUP');
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && space) {
      setCollaborators(space.collaborators || []);
      const loadData = async () => {
        setLoading(true);
        const [usersRes, groupsRes] = await Promise.all([
          fetchUsersAction(tenantId),
          fetchGroupsAction(tenantId)
        ]);
        startTransition(() => {
          if (!usersRes.error) setUsers(usersRes.data || []);
          if (!groupsRes.error) setGroups(groupsRes.data as IPermissionGroup[] || []);
        });
        setLoading(false);
      };
      loadData();
    } else {
      setSearch('');
      setActiveTab('GROUP');
    }
  }, [isOpen, tenantId, space]);

  if (!isOpen || !space) return null;

  const isAlreadyAdded = (id: string) => 
    collaborators.some(c => String(c.subjectId) === String(id));

  const getGroupPathName = (group: IPermissionGroup, allGroups: IPermissionGroup[]): string => {
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
  };

  const handleAdd = (subjectId: string, subjectType: 'USER' | 'GROUP') => {
    setCollaborators(prev => [...prev, { subjectId, subjectType, role: 'VIEWER', propagates: true }]);
  };

  const handleRemove = (subjectId: string) => {
    setCollaborators(prev => prev.filter(c => String(c.subjectId) !== String(subjectId)));
  };

  const handleRoleChange = (subjectId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN') => {
    setCollaborators(prev => prev.map(c => String(c.subjectId) === String(subjectId) ? { ...c, role } : c));
  };

  const handlePropagatesChange = (subjectId: string, propagates: boolean) => {
    setCollaborators(prev => prev.map(c => String(c.subjectId) === String(subjectId) ? { ...c, propagates } : c));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/spaces/${space._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborators })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error saving collaborators');
      toast.success(t('collaborators_updated', { defaultMessage: 'Colaboradores actualizados' }));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resolveSubjectName = (c: CollaboratorInput) => {
    if (c.subjectType === 'USER') {
      const u = users.find(x => String(x._id) === String(c.subjectId));
      return u ? `${u.name} ${u.surname}` : 'Unknown';
    } else {
      const g = groups.find(x => String(x._id) === String(c.subjectId));
      return g ? getGroupPathName(g, groups) : 'Unknown';
    }
  };

  const normalize = (txt: string | null | undefined) => 
    (txt || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Users size={18} className="text-primary" />
            {t('manage_collaborators', { defaultMessage: 'Gobernanza' })}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">
          {t('space_label')} <span className="text-primary font-bold">{space.name}</span> <span className="opacity-50">({space.materializedPath})</span>
        </p>
        
        {loading ? (
          <div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">
            {t('loading_tenant_data')}
          </div>
        ) : (
          <div className="flex flex-col gap-6 flex-1 overflow-hidden">
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex border-b border-border/60 mb-2">
                <button aria-label="Grupos"
                  type="button"
                  onClick={() => { setActiveTab('GROUP'); setSearch(''); }}
                  className={`flex-1 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'GROUP' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10'
                  }`}
                >
                  <Shield size={12} />
                  {t('groups_tab', { defaultMessage: 'Grupos' })}
                </button>
                <button aria-label="Usuarios"
                  type="button"
                  onClick={() => { setActiveTab('USER'); setSearch(''); }}
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
                  placeholder={activeTab === 'GROUP' ? 'Filtrar grupos por nombre...' : 'Filtrar usuarios por nombre o email...'} 
                  className="w-full h-10 pl-9 pr-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground" 
                />
              </div>

              <div className="border border-border bg-secondary/10 max-h-40 overflow-y-auto divide-y divide-border/40">
                {activeTab === 'GROUP' ? (
                  availableGroups.length === 0 ? (
                    <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                      {search ? 'Sin grupos que coincidan' : 'No hay más grupos disponibles'}
                    </div>
                  ) : (
                    availableGroups.map(g => (
                      <div key={g.id} className="flex items-center justify-between px-4 py-2 hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <Shield size={12} className="text-amber-500 shrink-0" />
                          <span className="font-sans text-xs font-bold text-foreground truncate" title={g.name}>{g.name}</span>
                        </div>
                        <button aria-label="Agregar grupo"
                          type="button" 
                          onClick={() => handleAdd(g.id, 'GROUP')}
                          className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 hover:border-primary hover:bg-primary/20 font-mono text-[9px] font-bold uppercase transition-all shrink-0"
                        >
                          + {t('add', { defaultMessage: 'Agregar' })}
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  availableUsers.length === 0 ? (
                    <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                      {search ? 'Sin usuarios que coincidan' : 'No hay más usuarios disponibles'}
                    </div>
                  ) : (
                    availableUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-2 hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <User size={12} className="text-primary shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-xs font-bold text-foreground truncate">{u.name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground truncate">{u.email}</span>
                          </div>
                        </div>
                        <button aria-label="Agregar usuario"
                          type="button" 
                          onClick={() => handleAdd(u.id, 'USER')}
                          className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 hover:border-primary hover:bg-primary/20 font-mono text-[9px] font-bold uppercase transition-all shrink-0"
                        >
                          + {t('add', { defaultMessage: 'Agregar' })}
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

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
                           <span className="font-mono text-[9px] text-muted-foreground">
                             {c.subjectType}
                           </span>
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
                             onChange={e => handlePropagatesChange(c.subjectId, e.target.checked)} 
                             className="w-3 h-3 rounded border-border text-primary focus:ring-primary" 
                           />
                         </div>
                         <select 
                           className="h-7 bg-secondary/30 border border-border text-[10px] font-mono uppercase text-foreground px-2 focus:border-primary outline-none" 
                           value={c.role} 
                           onChange={e => handleRoleChange(c.subjectId, e.target.value as 'VIEWER' | 'EDITOR' | 'ADMIN')}
                         >
                           <option value="VIEWER">{t('role_viewer')}</option>
                           <option value="EDITOR">{t('role_editor')}</option>
                           <option value="ADMIN">{t('role_admin')}</option>
                         </select>
                         <button aria-label="Eliminar"
                           type="button" 
                           onClick={() => handleRemove(c.subjectId)} 
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
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            aria-label={t('cancel')} 
            className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
          >
            {t('cancel')}
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            aria-label={saving ? t('saving') : t('save')} 
            disabled={saving || loading} 
            className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
