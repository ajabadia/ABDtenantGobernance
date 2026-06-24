'use client';

/**
 * @purpose Gestiona la creación y edición de permisos de grupo en el sistema de gobernanza de un inquilino.
 * @purpose_en Manages the creation and editing of group permissions in a tenant's governance system.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1w8qujm
 * @lastUpdated 2026-06-23T20:38:06.145Z
 */

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { X, Shield, ChevronDown } from 'lucide-react';
import { createGroupAction, updateGroupAction } from '../actions';

interface Policy { _id: string; name: string; effect: 'ALLOW' | 'DENY'; resources: string[]; actions: string[]; }
interface Group { _id: string; name: string; slug: string; description?: string; parentId?: string | null; policyIds?: string[]; allowedApps?: string[]; }
interface GroupFormModalProps { tenantId: string; isOpen: boolean; onClose: () => void; onSuccess: () => void; editingGroup?: Group | null; groups: Group[]; policies: Policy[]; availableApps: string[]; }

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '').replace(/-+/g, '-');
}

export function GroupFormModal({ tenantId, isOpen, onClose, onSuccess, editingGroup, groups, policies, availableApps }: GroupFormModalProps) {
  const t = useTranslations('admin.permissions.modals');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name || ''); setSlug(editingGroup.slug || ''); setDescription(editingGroup.description || '');
      setParentId(editingGroup.parentId || null); setSelectedPolicies(editingGroup.policyIds || []); setSelectedApps(editingGroup.allowedApps || []);
    } else {
      setName(''); setSlug(''); setDescription(''); setParentId(null); setSelectedPolicies([]); setSelectedApps([]);
    }
    setError('');
  }, [editingGroup, isOpen]);

  useEffect(() => { if (!editingGroup) setSlug(slugify(name)); }, [name, editingGroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError('');
    try {
      const payload = { name, slug, description: description || undefined, parentId: parentId || null, policyIds: selectedPolicies, allowedApps: selectedApps };
      const result = editingGroup ? await updateGroupAction(editingGroup._id, tenantId, payload) : await createGroupAction(tenantId, payload);
      if (result?.error) throw new Error(result.error);
      toast.success(editingGroup ? t('groupUpdated') : t('groupCreated'));
      onSuccess(); onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('groupSaveError');
      setError(msg); toast.error(t('groupSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const parentOptions = groups.filter(g => g._id !== editingGroup?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={editingGroup ? t('editGroup') : t('createGroup')}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Shield size={18} className="text-primary" aria-hidden="true" />
            {editingGroup ? t('editGroup') : t('createGroup')}
          </h2>
          <button onClick={onClose} aria-label={t('cancel')} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="group-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('groupName')}</label>
            <input id="group-name" type="text" required value={name} onChange={e => setName(e.target.value)} className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder={t('groupNamePlaceholder')} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="group-slug" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('slug')}</label>
            <input id="group-slug" type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder="tecnicos-campo" pattern="[a-z0-9\-_]+" />
            <span className="text-[9px] font-mono text-muted-foreground/60">{t('slugHelp')}</span>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="group-description" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('description')} <span className="text-muted-foreground/50">{t('optional')}</span></label>
            <textarea id="group-description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="px-4 py-2 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none resize-none" placeholder="..." />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="group-parent" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('parentGroup')}</label>
            <div className="relative">
              <select id="group-parent" value={parentId || ''} onChange={e => setParentId(e.target.value || null)} className="w-full h-10 pl-4 pr-10 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none appearance-none uppercase">
                <option value="">{t('noParent')}</option>
                {parentOptions.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {policies.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('assignedPolicies')}</span>
              <div className="border border-border divide-y divide-border/40 max-h-36 overflow-y-auto">
                {policies.map(policy => (
                  <label key={policy._id} htmlFor={`policy-${policy._id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors">
                    <input id={`policy-${policy._id}`} type="checkbox" checked={selectedPolicies.includes(policy._id)} onChange={() => setSelectedPolicies(prev => prev.includes(policy._id) ? prev.filter(id => id !== policy._id) : [...prev, policy._id])} className="accent-primary" />
                    <span className="flex-1 min-w-0"><span className="font-mono text-[10px] text-foreground block truncate">{policy.name}</span><span className={`font-mono text-[9px] ${policy.effect === 'ALLOW' ? 'text-green-500' : 'text-red-500'}`}>{policy.effect}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {availableApps.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('inheritedApps')}</span>
              <div className="flex flex-wrap gap-2">
                {availableApps.map(app => (
                  <button aria-label={app} type="button" key={app} onClick={() => setSelectedApps(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app])} aria-pressed={selectedApps.includes(app)} className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider border rounded-none transition-all ${selectedApps.includes(app) ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground/50'}`}>{app}</button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} aria-label={t('cancel')} className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:bg-white/[0.02] font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]">{t('cancel')}</button>
            <button type="submit" disabled={isLoading} aria-label={editingGroup ? t('saveChanges') : t('create')} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50">{isLoading ? t('saving') : editingGroup ? t('save') : t('create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
