'use client';

/**
 * @purpose Renderiza una tabla que muestra roles de quiz con acciones para revocarlos.
 * @purpose_en Renders a table displaying quiz roles with actions to revoke them.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:184x039
 * @lastUpdated 2026-06-23T21:42:25.480Z
 */

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { RoleBadge, type RoleLiteralsMap } from '@ajabadia/styles';
import { type IamUser } from '@/lib/services/iamClient';
import { type IQuizUserRole } from '@/models/QuizUserRole';

interface QuizRolesTableProps {
  roles: Partial<IQuizUserRole>[];
  users: IamUser[];
  loading: boolean;
  roleLiterals: RoleLiteralsMap | undefined;
  locale: string;
  userMap: Map<string, IamUser>;
  onRevoke: (target: { id: string; userId: string }) => void;
}

export function QuizRolesTable({
  roles,
  users,
  loading,
  roleLiterals,
  locale,
  userMap,
  onRevoke,
}: QuizRolesTableProps) {
  const tAdmin = useTranslations('admin');

  return (
    <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
      <table className="w-full text-left divide-y divide-border/60">
        <thead className="bg-secondary/40">
          <tr>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.user')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.scope')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.scopeId')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.role')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.assignedBy')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.date')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {tAdmin('quizRoles.loading')}
              </td>
            </tr>
          ) : roles.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {tAdmin('quizRoles.noRoles')}
              </td>
            </tr>
          ) : (
            roles.map((r) => {
              const u = userMap.get(r.userId || '');
              return (
                <tr key={String(r._id)} className="hover:bg-primary/[0.02] transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-sans text-foreground/90 font-bold">
                        {u ? `${u.name} ${u.surname}` : r.userId?.substring(0, 12) + '...'}
                      </span>
                      {u && (
                        <span className="font-mono text-[9px] text-muted-foreground">{u.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] uppercase font-bold text-primary/80">
                      {r.scopeType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[9px] text-muted-foreground" title={r.scopeId}>
                      {r.scopeId?.substring(0, 16)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.roleType === 'CREATOR' || r.roleType === 'AUDITOR' ? (
                      <RoleBadge
                        role={r.roleType}
                        roleLiterals={roleLiterals}
                        locale={locale as 'es' | 'en'}
                      />
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">{r.roleType}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {r.assignedBy?.substring(0, 12)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {(r as unknown as { createdAt?: string }).createdAt
                        ? new Date((r as unknown as { createdAt: string }).createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      aria-label={tAdmin('quizRoles.revoke')}
                      onClick={() => onRevoke({ id: String(r._id), userId: r.userId || '' })}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-none"
                      title={tAdmin('quizRoles.revoke')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
