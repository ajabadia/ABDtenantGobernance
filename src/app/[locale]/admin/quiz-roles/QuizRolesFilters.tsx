'use client';

/**
 * @purpose Renderiza un componente de filtro para roles de quiz con opciones para seleccionar el tipo y ID del escopo, y incluye un botón de filtrado claro.
 * @purpose_en Renders a filter component for quiz roles with options to select scope type and ID, and includes a clear filters button.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:3,imports:2,sig:1hgvgit
 * @lastUpdated 2026-06-23T21:42:19.462Z
 */

import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';

export type ScopeType = 'space' | 'course' | 'exam_config';

export const SCOPE_TYPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'space', label: 'Space' },
  { value: 'course', label: 'Course' },
  { value: 'exam_config', label: 'Exam Config' },
];

interface QuizRolesFiltersProps {
  filterScopeType: string;
  onFilterScopeTypeChange: (val: string) => void;
  filterScopeId: string;
  onFilterScopeIdChange: (val: string) => void;
  onClear: () => void;
}

export function QuizRolesFilters({
  filterScopeType,
  onFilterScopeTypeChange,
  filterScopeId,
  onFilterScopeIdChange,
  onClear,
}: QuizRolesFiltersProps) {
  const tAdmin = useTranslations('admin');
  const hasFilters = !!(filterScopeType || filterScopeId);

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Filter size={10} /> {tAdmin('quizRoles.filterScopeType')}
        </label>
        <select
          value={filterScopeType}
          onChange={(e) => onFilterScopeTypeChange(e.target.value)}
          className="h-9 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-[10px] outline-none text-foreground rounded-none uppercase"
        >
          <option value="">{tAdmin('quizRoles.allScopeTypes')}</option>
          {SCOPE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{tAdmin('quizRoles.filterScopeId')}</label>
        <input
          type="text"
          value={filterScopeId}
          onChange={(e) => onFilterScopeIdChange(e.target.value)}
          placeholder={tAdmin('quizRoles.filterPlaceholder')}
          className="h-9 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-[10px] outline-none text-foreground rounded-none w-56"
        />
      </div>
      {hasFilters && (
        <button
          aria-label={tAdmin('quizRoles.clearFilters')}
          onClick={onClear}
          className="h-9 px-4 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[9px] uppercase tracking-wider transition-colors rounded-none"
        >
          {tAdmin('quizRoles.clearFilters')}
        </button>
      )}
    </div>
  );
}
