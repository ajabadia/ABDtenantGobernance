'use client';

/**
 * @purpose Renderiza un conjunto de botones para seleccionar roles ('CREATOR' o 'AUDITOR'), cada uno mostrando una insignia de rol.
 * @purpose_en Renders a set of buttons for selecting roles ('CREATOR' or 'AUDITOR'), each displaying a role badge.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:1i29fx2
 * @lastUpdated 2026-06-23T21:42:32.992Z
 */

import { RoleBadge, type RoleLiteralsMap } from '@ajabadia/styles';

interface RoleSelectorButtonsProps {
  value: 'CREATOR' | 'AUDITOR';
  onChange: (role: 'CREATOR' | 'AUDITOR') => void;
  locale: string;
  roleLiterals: RoleLiteralsMap | undefined;
}

export function RoleSelectorButtons({ value, onChange, locale, roleLiterals }: RoleSelectorButtonsProps) {
  return (
    <div className="flex gap-3">
      {(['CREATOR', 'AUDITOR'] as const).map((roleValue) => (
        <button
          key={roleValue}
          type="button"
          aria-label={roleValue}
          aria-pressed={value === roleValue}
          onClick={() => onChange(roleValue)}
          className={`flex-1 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-2 ${
            value === roleValue
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
            variant={value === roleValue ? 'default' : 'outline'}
          />
        </button>
      ))}
    </div>
  );
}
