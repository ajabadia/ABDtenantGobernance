'use client';

import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type RoleLiteralsMap } from '@ajabadia/styles';
import { type IamUser } from '@/lib/services/iamClient';
import { BulkUserSelectionList } from './BulkUserSelectionList';
import { RoleSelectorButtons } from './RoleSelectorButtons';
import { SCOPE_TYPE_OPTIONS, type ScopeType } from './QuizRolesFilters';

interface BulkAssignModalProps {
  users: IamUser[];
  bulkScopeType: ScopeType;
  setBulkScopeType: (t: ScopeType) => void;
  bulkScopeId: string;
  setBulkScopeId: (id: string) => void;
  bulkRoleType: 'CREATOR' | 'AUDITOR';
  setBulkRoleType: (r: 'CREATOR' | 'AUDITOR') => void;
  bulkUserIds: string[];
  setBulkUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  bulkSelectAll: boolean;
  setBulkSelectAll: (v: boolean) => void;
  bulking: boolean;
  locale: string;
  roleLiterals: RoleLiteralsMap | undefined;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BulkAssignModal({ users, bulkScopeType, setBulkScopeType, bulkScopeId, setBulkScopeId, bulkRoleType, setBulkRoleType, bulkUserIds, setBulkUserIds, bulkSelectAll, setBulkSelectAll, bulking, locale, roleLiterals, onClose, onSubmit }: BulkAssignModalProps) {
  const tAdmin = useTranslations('admin');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={tAdmin('quizRoles.bulkAssign')}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2"><UserPlus size={18} className="text-primary" />{tAdmin('quizRoles.bulkTitle')}</h2>
          <button onClick={onClose} aria-label={tAdmin('quizRoles.close')} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{tAdmin('quizRoles.filterScopeType')}</label>
              <select value={bulkScopeType} onChange={(e) => setBulkScopeType(e.target.value as ScopeType)} className="h-10 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none uppercase">
                {SCOPE_TYPE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{tAdmin('quizRoles.filterScopeId')}</label>
              <input type="text" value={bulkScopeId} onChange={(e) => setBulkScopeId(e.target.value)} required placeholder="ObjectId..." className="h-10 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{tAdmin('quizRoles.role')}</label>
              <RoleSelectorButtons value={bulkRoleType} onChange={setBulkRoleType} locale={locale} roleLiterals={roleLiterals} />
            </div>
          </div>
          <BulkUserSelectionList users={users} bulkUserIds={bulkUserIds} bulkSelectAll={bulkSelectAll} onToggleUser={(userId) => { setBulkUserIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]); setBulkSelectAll(false); }} onToggleSelectAll={(checked) => { setBulkSelectAll(checked); setBulkUserIds(checked ? users.map((u) => u._id) : []); }} />
          <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-border">
            <button type="button" aria-label={tAdmin('quizRoles.cancel')} onClick={onClose} className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none">{tAdmin('quizRoles.cancel')}</button>
            <button type="submit" aria-label={bulking ? tAdmin('quizRoles.assigningToCount', { count: bulkUserIds.length }) : tAdmin('quizRoles.assignToCount', { count: bulkUserIds.length })} disabled={bulking || bulkUserIds.length === 0} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all rounded-none disabled:opacity-50">{bulking ? tAdmin('quizRoles.assigningToCount', { count: bulkUserIds.length }) : tAdmin('quizRoles.assignToCount', { count: bulkUserIds.length })}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
