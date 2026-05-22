'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Shield, Users, User, Trash2, Search, Check } from 'lucide-react';
import { fetchUsersAction } from '@/app/[locale]/admin/users/actions';
import { fetchGroupsAction } from '@/app/[locale]/admin/permissions/actions';
import { IamUser } from '@/lib/services/iamClient';
import { IPermissionGroup } from '@/models/PermissionGroup';
import { SpaceData } from './SpaceForm';
import { useTranslations } from 'next-intl';

type CollaboratorInput = NonNullable<SpaceData['collaborators']>[0];
interface Props { tenantId: string; space: SpaceData | null; isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export function ManageSpaceCollaboratorsModal({ tenantId, space, isOpen, onClose, onSuccess }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [users, setUsers] = useState<IamUser[]>([]);
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && space) {
      setCollaborators(space.collaborators || []);
      const loadData = async () => {
        setLoading(true);
        const [usersRes, groupsRes] = await Promise.all([fetchUsersAction(tenantId), fetchGroupsAction(tenantId)]);
        startTransition(() => {
          if (!usersRes.error) setUsers(usersRes.data || []);
          if (!groupsRes.error) setGroups(groupsRes.data as IPermissionGroup[] || []);
        });
        setLoading(false);
      };
      loadData();
    } else setSearch('');
  }, [isOpen, tenantId, space]);

  if (!isOpen || !space) return null;

  const isAlreadyAdded = (id: string) => collaborators.some(c => c.subjectId === id);
  const matchedUsers = search.length >= 2 ? users.filter(u => !isAlreadyAdded(u._id) && (`${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase()))).slice(0, 3) : [];
  const matchedGroups = search.length >= 2 ? groups.filter(g => !isAlreadyAdded(g._id!.toString()) && g.name.toLowerCase().includes(search.toLowerCase())).slice(0, 3) : [];

  const handleAdd = (subjectId: string, subjectType: 'USER' | 'GROUP') => { setCollaborators(prev => [...prev, { subjectId, subjectType, role: 'VIEWER', propagates: true }]); setSearch(''); };
  const handleRemove = (subjectId: string) => { setCollaborators(prev => prev.filter(c => c.subjectId !== subjectId)); };
  const handleRoleChange = (subjectId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN') => { setCollaborators(prev => prev.map(c => c.subjectId === subjectId ? { ...c, role } : c)); };
  const handlePropagatesChange = (subjectId: string, propagates: boolean) => { setCollaborators(prev => prev.map(c => c.subjectId === subjectId ? { ...c, propagates } : c)); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/admin/spaces/${space._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborators }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Error saving collaborators');
      toast.success(t('collaborators_updated', { defaultMessage: 'Colaboradores actualizados' }));
      onSuccess(); onClose();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resolveSubjectName = (c: CollaboratorInput) => c.subjectType === 'USER' ? (users.find(x => x._id === c.subjectId) ? `${users.find(x => x._id === c.subjectId)?.name} ${users.find(x => x._id === c.subjectId)?.surname}` : 'Unknown') : (groups.find(x => x._id!.toString() === c.subjectId)?.name || 'Unknown');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2"><Users size={18} className="text-primary" />{t('manage_collaborators', { defaultMessage: 'Gobernanza' })}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">{t('space_label')} <span className="text-primary font-bold">{space.name}</span> <span className="opacity-50">({space.materializedPath})</span></p>
        
        {loading ? <div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">{t('loading_tenant_data')}</div> : (
          <div className="flex flex-col gap-6 flex-1 overflow-hidden">
            <div className="flex flex-col gap-2 shrink-0 relative">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('add_user_group')}</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder')} className="w-full h-10 pl-9 pr-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground" />
              </div>
              {(matchedUsers.length > 0 || matchedGroups.length > 0) && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border shadow-lg">
                  {matchedGroups.map(g => (
                    <button key={g._id!.toString()} type="button" onClick={() => handleAdd(g._id!.toString(), 'GROUP')} className="w-full flex items-center justify-between px-4 py-2 hover:bg-primary/[0.05] border-b border-border/40 text-left transition-colors">
                      <div className="flex items-center gap-2"><Shield size={12} className="text-amber-500" /><span className="font-sans text-xs font-bold text-foreground">{g.name}</span></div><Check size={14} className="text-primary/0 hover:text-primary transition-colors" />
                    </button>
                  ))}
                  {matchedUsers.map(u => (
                    <button key={u._id} type="button" onClick={() => handleAdd(u._id, 'USER')} className="w-full flex items-center justify-between px-4 py-2 hover:bg-primary/[0.05] border-b border-border/40 text-left transition-colors">
                      <div className="flex items-center gap-2"><User size={12} className="text-primary" /><div className="flex flex-col"><span className="font-sans text-xs font-bold text-foreground">{u.name} {u.surname}</span><span className="font-mono text-[9px] text-muted-foreground">{u.email}</span></div></div><Check size={14} className="text-primary/0 hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
               <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2 shrink-0">{t('assigned_collaborators')} ({collaborators.length})</span>
               <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
                 {collaborators.length === 0 ? <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">{t('no_explicit_collaborators')}</div> : (
                    collaborators.map(c => (
                      <div key={c.subjectId} className="flex items-center justify-between px-4 py-3 hover:bg-primary/[0.02]">
                        <div className="flex items-center gap-3">
                          {c.subjectType === 'GROUP' ? <Shield size={14} className="text-amber-500" /> : <User size={14} className="text-primary" />}
                          <div className="flex flex-col"><span className="font-sans text-xs font-bold text-foreground">{resolveSubjectName(c)}</span><span className="font-mono text-[9px] text-muted-foreground">{c.subjectType}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] font-mono text-muted-foreground uppercase" title={t('heritage_title')}>{t('heritage')}</label>
                            <input type="checkbox" checked={c.propagates} onChange={e => handlePropagatesChange(c.subjectId, e.target.checked)} className="w-3 h-3 rounded border-border text-primary focus:ring-primary" />
                          </div>
                          <select className="h-7 bg-secondary/30 border border-border text-[10px] font-mono uppercase text-foreground px-2 focus:border-primary outline-none" value={c.role} onChange={e => handleRoleChange(c.subjectId, e.target.value as 'VIEWER' | 'EDITOR' | 'ADMIN')}>
                            <option value="VIEWER">{t('role_viewer')}</option><option value="EDITOR">{t('role_editor')}</option><option value="ADMIN">{t('role_admin')}</option>
                          </select>
                          <button type="button" onClick={() => handleRemove(c.subjectId)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))
                 )}
               </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none">{t('cancel')}</button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none">{saving ? t('saving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}
