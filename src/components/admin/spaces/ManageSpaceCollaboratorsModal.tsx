'use client';

import React, { useState, useEffect, useTransition, startTransition } from 'react';
import { toast } from 'sonner';
import { X, Users } from 'lucide-react';
import { fetchUsersAction } from '@/app/[locale]/admin/users/actions';
import { fetchGroupsAction } from '@/app/[locale]/admin/permissions/actions';
import { IamUser } from '@/lib/services/iamClient';
import { IPermissionGroup } from '@/models/PermissionGroup';
import { SpaceData } from './SpaceForm';
import { useTranslations } from 'next-intl';
import { CollaboratorSearchPanel } from './CollaboratorSearchPanel';
import { CollaboratorAssignmentList } from './CollaboratorAssignmentList';

type CollaboratorInput = NonNullable<SpaceData['collaborators']>[0];

interface Props { tenantId: string; space: SpaceData | null; isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export function ManageSpaceCollaboratorsModal({ tenantId, space, isOpen, onClose, onSuccess }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [users, setUsers] = useState<IamUser[]>([]);
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      if (!isOpen || !space) { setCollaborators([]); return; }
      setCollaborators(space.collaborators || []);
    });
    const loadData = async () => {
      setLoading(true);
      const [usersRes, groupsRes] = await Promise.all([fetchUsersAction(tenantId), fetchGroupsAction(tenantId)]);
      startTransition(() => { if (!usersRes.error) setUsers(usersRes.data || []); if (!groupsRes.error) setGroups(groupsRes.data as IPermissionGroup[] || []); });
      startTransition(() => { setLoading(false); });
    };
    loadData();
  }, [isOpen, tenantId, space]);

  if (!isOpen || !space) return null;

  const handleAdd = (subjectId: string, subjectType: 'USER' | 'GROUP') => { setCollaborators(prev => [...prev, { subjectId, subjectType, role: 'VIEWER', propagates: true }]); };
  const handleRemove = (subjectId: string) => { setCollaborators(prev => prev.filter(c => String(c.subjectId) !== String(subjectId))); };
  const handleRoleChange = (subjectId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN') => { setCollaborators(prev => prev.map(c => String(c.subjectId) === String(subjectId) ? { ...c, role } : c)); };
  const handlePropagatesChange = (subjectId: string, propagates: boolean) => { setCollaborators(prev => prev.map(c => String(c.subjectId) === String(subjectId) ? { ...c, propagates } : c)); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/admin/spaces/${space._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborators }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Error saving collaborators');
      toast.success(t('collaborators_updated', { defaultMessage: 'Colaboradores actualizados' })); onSuccess(); onClose();
    } catch (err: unknown) { if (err instanceof Error) toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2"><Users size={18} className="text-primary" />{t('manage_collaborators', { defaultMessage: 'Gobernanza' })}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">{t('space_label')} <span className="text-primary font-bold">{space.name}</span> <span className="opacity-50">({space.materializedPath})</span></p>
        {loading ? (<div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">{t('loading_tenant_data')}</div>) : (
          <div className="flex flex-col gap-6 flex-1 overflow-hidden">
            <CollaboratorSearchPanel users={users} groups={groups} collaborators={collaborators} onAdd={handleAdd} onClose={onClose} />
            <CollaboratorAssignmentList collaborators={collaborators} users={users} groups={groups} onRoleChange={handleRoleChange} onPropagatesChange={handlePropagatesChange} onRemove={handleRemove} />
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} aria-label={t('cancel')} className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none">{t('cancel')}</button>
          <button type="button" onClick={handleSave} aria-label={saving ? t('saving') : t('save')} disabled={saving || loading} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none">{saving ? t('saving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}
