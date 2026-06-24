'use client';

/**
 * @purpose Renderiza una forma para editar literal de rol en español e inglés.
 * @purpose_en Renders a form for editing role literals in Spanish and English.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:izm5oe
 * @lastUpdated 2026-06-23T21:44:28.215Z
 */

import React from 'react';

interface RoleLiteralsData {
  CREATOR: { es: string; en: string };
  RECIPIENT: { es: string; en: string };
  AUDITOR: { es: string; en: string };
}

interface RoleLiteralsFieldsetProps {
  roleLiterals: RoleLiteralsData;
  onRoleLiteralsChange: (literals: RoleLiteralsData) => void;
  t: (key: string) => string;
}

const ROLES = ['CREATOR', 'RECIPIENT', 'AUDITOR'] as const;

export function RoleLiteralsFieldset({ roleLiterals, onRoleLiteralsChange, t }: RoleLiteralsFieldsetProps) {
  const updateRole = (role: typeof ROLES[number], lang: 'es' | 'en', value: string) => {
    onRoleLiteralsChange({
      ...roleLiterals,
      [role]: { ...roleLiterals[role], [lang]: value },
    });
  };

  return (
    <fieldset className="border border-border p-4 rounded-none">
      <legend className="text-[10px] font-black uppercase tracking-wider text-primary px-2">
        {t('roleLiteralsTitle') || 'Role Literals (Contextual Roles)'}
      </legend>
      <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
        {t('roleLiteralsDesc') || 'Configure how contextual roles are displayed in your tenant.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map((role) => (
          <div key={role} className="flex flex-col gap-2 p-3 bg-secondary/20 border border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{role}</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground">ES</label>
                <input
                  type="text"
                  value={roleLiterals[role].es}
                  onChange={e => updateRole(role, 'es', e.target.value)}
                  className="h-9 w-full px-3 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
                  placeholder={role === 'CREATOR' ? 'Creador' : role === 'RECIPIENT' ? 'Destinatario' : 'Auditor'}
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground">EN</label>
                <input
                  type="text"
                  value={roleLiterals[role].en}
                  onChange={e => updateRole(role, 'en', e.target.value)}
                  className="h-9 w-full px-3 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
                  placeholder={role === 'CREATOR' ? 'Creator' : role === 'RECIPIENT' ? 'Recipient' : 'Auditor'}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
