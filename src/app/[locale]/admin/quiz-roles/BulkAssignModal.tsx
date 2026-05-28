'use client';

import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type RoleLiteralsMap, RoleBadge } from '@ajabadia/styles';
import { type IamUser } from '@/lib/services/iamClient';

type ScopeType = 'space' | 'course' | 'exam_config';

const SCOPE_TYPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'space', label: 'Space' },
  { value: 'course', label: 'Course' },
  { value: 'exam_config', label: 'Exam Config' },
];

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

export function BulkAssignModal({
  users,
  bulkScopeType,
  setBulkScopeType,
  bulkScopeId,
  setBulkScopeId,
  bulkRoleType,
  setBulkRoleType,
  bulkUserIds,
  setBulkUserIds,
  bulkSelectAll,
  setBulkSelectAll,
  bulking,
  locale,
  roleLiterals,
  onClose,
  onSubmit,
}: BulkAssignModalProps) {
  const tAdmin = useTranslations('admin');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={tAdmin('quizRoles.bulkAssign')}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            {tAdmin('quizRoles.bulkTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label={tAdmin('quizRoles.close')}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                {tAdmin('quizRoles.filterScopeType')}
              </label>
              <select
                value={bulkScopeType}
                onChange={(e) => setBulkScopeType(e.target.value as ScopeType)}
                className="h-10 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none uppercase"
              >
                {SCOPE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                {tAdmin('quizRoles.filterScopeId')}
              </label>
              <input
                type="text"
                value={bulkScopeId}
                onChange={(e) => setBulkScopeId(e.target.value)}
                required
                placeholder="ObjectId..."
                className="h-10 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                {tAdmin('quizRoles.role')}
              </label>
              <div className="flex gap-2">
                {(['CREATOR', 'AUDITOR'] as const).map((roleValue) => (
                  <button
                    key={roleValue}
                    type="button"
                    aria-label={roleValue}
                    aria-pressed={bulkRoleType === roleValue}
                    onClick={() => setBulkRoleType(roleValue)}
                    className={`flex-1 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-2 ${
                      bulkRoleType === roleValue
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
                      variant={bulkRoleType === roleValue ? 'default' : 'outline'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User selection list */}
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                {tAdmin('quizRoles.selectUsers', { count: bulkUserIds.length, total: users.length })}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{tAdmin('quizRoles.allUsers')}</span>
                <input
                  type="checkbox"
                  checked={bulkSelectAll}
                  onChange={(e) => {
                    setBulkSelectAll(e.target.checked);
                    setBulkUserIds(e.target.checked ? users.map((u) => u._id) : []);
                  }}
                  className="accent-primary"
                />
              </label>
            </div>
            <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
              {users.length === 0 ? (
                <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                  {tAdmin('quizRoles.noUsers')}
                </div>
              ) : (
                users.map((u) => (
                  <label
                    key={u._id}
                    htmlFor={`bulk-user-${u._id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors"
                  >
                    <input
                      id={`bulk-user-${u._id}`}
                      type="checkbox"
                      checked={bulkUserIds.includes(u._id)}
                      onChange={() => {
                        setBulkUserIds((prev) =>
                          prev.includes(u._id)
                            ? prev.filter((id) => id !== u._id)
                            : [...prev, u._id]
                        );
                        setBulkSelectAll(false);
                      }}
                      className="accent-primary shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-xs font-bold text-foreground truncate">{u.name} {u.surname}</span>
                      <span className="font-mono text-[9px] text-muted-foreground truncate">{u.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-border">
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
              aria-label={bulking
                ? tAdmin('quizRoles.assigningToCount', { count: bulkUserIds.length })
                : tAdmin('quizRoles.assignToCount', { count: bulkUserIds.length })}
              disabled={bulking || bulkUserIds.length === 0}
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all rounded-none disabled:opacity-50"
            >
              {bulking
                ? tAdmin('quizRoles.assigningToCount', { count: bulkUserIds.length })
                : tAdmin('quizRoles.assignToCount', { count: bulkUserIds.length })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
