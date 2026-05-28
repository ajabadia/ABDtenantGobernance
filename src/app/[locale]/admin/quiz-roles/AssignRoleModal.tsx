'use client';

import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type RoleLiteralsMap, RoleBadge } from '@ajabadia/styles';
import { IndustrialSelectSearch } from '@/components/ui/industrial/SelectSearch';
import { type IamUser } from '@/lib/services/iamClient';

type ScopeType = 'space' | 'course' | 'exam_config';

const SCOPE_TYPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'space', label: 'Space' },
  { value: 'course', label: 'Course' },
  { value: 'exam_config', label: 'Exam Config' },
];

interface AssignRoleModalProps {
  users: IamUser[];
  assignUserId: string;
  setAssignUserId: (id: string) => void;
  assignScopeType: ScopeType;
  setAssignScopeType: (t: ScopeType) => void;
  assignScopeId: string;
  setAssignScopeId: (id: string) => void;
  assignRoleType: 'CREATOR' | 'AUDITOR';
  setAssignRoleType: (r: 'CREATOR' | 'AUDITOR') => void;
  assigning: boolean;
  locale: string;
  roleLiterals: RoleLiteralsMap | undefined;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignRoleModal({
  users,
  assignUserId,
  setAssignUserId,
  assignScopeType,
  setAssignScopeType,
  assignScopeId,
  setAssignScopeId,
  assignRoleType,
  setAssignRoleType,
  assigning,
  locale,
  roleLiterals,
  onClose,
  onSubmit,
}: AssignRoleModalProps) {
  const tAdmin = useTranslations('admin');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={tAdmin('quizRoles.assignModalTitle')}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            {tAdmin('quizRoles.assignModalTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label={tAdmin('quizRoles.close')}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* User selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {tAdmin('quizRoles.userLabel')}
            </label>
            <IndustrialSelectSearch
              items={users.map((u) => ({
                id: u._id,
                label: `${u.name} ${u.surname}`,
                subLabel: u.email,
              }))}
              value={assignUserId}
              onChange={setAssignUserId}
              placeholder={tAdmin('quizRoles.selectUser')}
              noResultsLabel={tAdmin('quizRoles.noUsers')}
              ariaLabel={tAdmin('quizRoles.userLabel')}
            />
          </div>

          {/* Scope type */}
          <div className="flex flex-col gap-2">
            <label htmlFor="assign-scope-type" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {tAdmin('quizRoles.scopeTypeLabel')}
            </label>
            <select
              id="assign-scope-type"
              value={assignScopeType}
              onChange={(e) => setAssignScopeType(e.target.value as ScopeType)}
              required
              className="w-full h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none uppercase"
            >
              {SCOPE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Scope ID */}
          <div className="flex flex-col gap-2">
            <label htmlFor="assign-scope-id" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {tAdmin('quizRoles.filterScopeId')}
            </label>
            <input
              id="assign-scope-id"
              type="text"
              value={assignScopeId}
              onChange={(e) => setAssignScopeId(e.target.value)}
              required
              placeholder={tAdmin('quizRoles.scopeIdPlaceholder')}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
            />
          </div>

          {/* Role type */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {tAdmin('quizRoles.role')}
            </label>
            <div className="flex gap-3">
              {(['CREATOR', 'AUDITOR'] as const).map((roleValue) => (
                <button
                  key={roleValue}
                  type="button"
                  aria-label={roleValue}
                  aria-pressed={assignRoleType === roleValue}
                  onClick={() => setAssignRoleType(roleValue)}
                  className={`flex-1 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-2 ${
                    assignRoleType === roleValue
                      ? roleValue === 'CREATOR'
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground/40'
                  }`}
                >
                  <RoleBadge
                    role={roleValue}
                    roleLiterals={roleLiterals}
                    locale={locale as 'es' | 'en'}
                    variant={assignRoleType === roleValue ? 'default' : 'outline'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              aria-label={tAdmin('quizRoles.cancel')}
              onClick={onClose}
              className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
            >
              {tAdmin('quizRoles.cancel')}
            </button>
            <button
              type="submit"
              aria-label={assigning ? tAdmin('quizRoles.assigning') : tAdmin('quizRoles.assignRole')}
              disabled={assigning}
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all rounded-none disabled:opacity-50"
            >
              {assigning ? tAdmin('quizRoles.assigning') : tAdmin('quizRoles.assignRole')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
