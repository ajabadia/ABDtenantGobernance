'use client';

import { useTranslations } from 'next-intl';
import { RoleBadge } from '@ajabadia/styles';
import type { RoleLiteralsMap } from '@ajabadia/styles';

interface QuizRolesSummaryProps {
  roles: Array<{ roleType?: string }>;
  loading: boolean;
  roleLiterals: RoleLiteralsMap | undefined;
  locale: string;
}

export function QuizRolesSummary({ roles, loading, roleLiterals, locale }: QuizRolesSummaryProps) {
  const tAdmin = useTranslations('admin');

  if (loading || roles.length === 0) return null;

  return (
    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-3">
      <span>{tAdmin('quizRoles.total', { count: roles.length })}</span>
      <span className="flex items-center gap-1">
        <RoleBadge role="CREATOR" roleLiterals={roleLiterals} locale={locale as 'es' | 'en'} variant="ghost" showIcon={false} />
        <span className="font-bold">{roles.filter(r => r.roleType === 'CREATOR').length}</span>
      </span>
      <span className="flex items-center gap-1">
        <RoleBadge role="AUDITOR" roleLiterals={roleLiterals} locale={locale as 'es' | 'en'} variant="ghost" showIcon={false} />
        <span className="font-bold">{roles.filter(r => r.roleType === 'AUDITOR').length}</span>
      </span>
    </div>
  );
}
