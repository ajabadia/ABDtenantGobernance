'use client';

/**
 * @purpose Renderiza una barra de herramientas con botones para refrescar roles de quiz, asignar roles individuales y asignar roles en masa.
 * @purpose_en Renders a toolbar with buttons for refreshing quiz roles, assigning individual roles, and bulk assigning roles.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1p5epy5
 * @lastUpdated 2026-06-23T21:42:14.000Z
 */

import { RefreshCw, Plus, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QuizRolesActionsBarProps {
  loading: boolean;
  onRefresh: () => void;
  onAssign: () => void;
  onBulkAssign: () => void;
}

export function QuizRolesActionsBar({ loading, onRefresh, onAssign, onBulkAssign }: QuizRolesActionsBarProps) {
  const tAdmin = useTranslations('admin');

  return (
    <>
      <button
        aria-label={tAdmin('quizRoles.refresh')}
        onClick={onRefresh}
        className="inline-flex items-center justify-center p-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-black uppercase transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
        title={tAdmin('quizRoles.refresh')}
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      </button>
      <button
        aria-label={tAdmin('quizRoles.assignRole')}
        onClick={onAssign}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
      >
        <Plus className="h-4 w-4" />
        {tAdmin('quizRoles.assignRole')}
      </button>
      <button
        aria-label={tAdmin('quizRoles.bulkAssign')}
        onClick={onBulkAssign}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
      >
        <UserPlus className="h-4 w-4" />
        {tAdmin('quizRoles.bulkAssign')}
      </button>
    </>
  );
}
