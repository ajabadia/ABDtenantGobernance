'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

interface PolicyFormContentProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  effect: 'ALLOW' | 'DENY';
  setEffect: (v: 'ALLOW' | 'DENY') => void;
  resources: string;
  setResources: (v: string) => void;
  actions: string;
  setActions: (v: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PolicyFormContent({
  name, setName,
  description, setDescription,
  effect, setEffect,
  resources, setResources,
  actions, setActions,
  isLoading,
  onSubmit, onClose,
}: PolicyFormContentProps) {
  const t = useTranslations('admin.permissions.policyForm');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="policy-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('policy_name')}</label>
        <input id="policy-name" type="text" required value={name} onChange={e => setName(e.target.value)}
          className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder={t('policy_name_placeholder')} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="policy-description" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('description')} <span className="text-muted-foreground/50">{t('optional')}</span></label>
        <input id="policy-description" type="text" value={description} onChange={e => setDescription(e.target.value)}
          className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder={t('description_placeholder')} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="policy-effect" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('effect')}</label>
        <div className="relative">
          <select id="policy-effect" value={effect} onChange={e => setEffect(e.target.value as 'ALLOW' | 'DENY')}
            className="w-full h-10 pl-4 pr-10 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none appearance-none uppercase">
            <option value="ALLOW">{t('allow_option')}</option>
            <option value="DENY">{t('deny_option')}</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="policy-resources" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('resources')}</label>
        <input id="policy-resources" type="text" required value={resources} onChange={e => setResources(e.target.value)}
          className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder={t('resources_placeholder')} />
        <span className="text-[9px] font-mono text-muted-foreground/60">{t('resources_help')}</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="policy-actions" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('actions')}</label>
        <input id="policy-actions" type="text" required value={actions} onChange={e => setActions(e.target.value)}
          className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" placeholder={t('actions_placeholder')} />
        <span className="text-[9px] font-mono text-muted-foreground/60">{t('actions_help')}</span>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} aria-label={t('cancel', { defaultMessage: 'Cancelar' })}
          className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:bg-white/[0.02] font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]">{t('cancel', { defaultMessage: 'Cancelar' })}</button>
        <button type="submit" disabled={isLoading} aria-label={isLoading ? t('saving') : t('create_policy')}
          className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50">
          {isLoading ? t('saving') : t('create_policy')}</button>
      </div>
    </form>
  );
}
