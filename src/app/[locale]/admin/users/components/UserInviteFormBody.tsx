'use client';

/**
 * @purpose Renderiza una forma para invitar a los usuarios con opciones para seleccionar roles y grupos.
 * @purpose_en Renders a form for inviting users with options to select roles and groups.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1b3axml
 * @lastUpdated 2026-06-23T21:43:09.541Z
 */

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface UserInviteFormBodyProps {
  email: string;
  setEmail: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  selectedGroups: string[];
  toggleGroup: (id: string) => void;
  availableGroups: Group[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function UserInviteFormBody({
  email, setEmail,
  name, setName,
  role, setRole,
  selectedGroups, toggleGroup,
  availableGroups,
  isLoading,
  onSubmit, onClose,
}: UserInviteFormBodyProps) {
  const t = useTranslations('common');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-email" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('email', { defaultMessage: 'Email' })}
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
          placeholder={t('email_placeholder', { defaultMessage: 'user@company.com' })}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('name_label', { defaultMessage: 'Nombre Completo' })}
        </label>
        <input
          id="invite-name"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
          placeholder={t('name_placeholder', { defaultMessage: 'Juan Pérez' })}
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-role" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('role', { defaultMessage: 'Rol' })}
        </label>
        <div className="relative">
          <select
            id="invite-role"
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full h-10 pl-4 pr-10 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground uppercase appearance-none"
          >
            <option value="student">{t('roleStudent', { defaultMessage: 'Estudiante / Operario' })}</option>
            <option value="admin">{t('roleAdmin', { defaultMessage: 'Administrador (Tenant)' })}</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Groups */}
      {availableGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
            {t('permission_groups', { defaultMessage: 'Grupos de Permisos' })} <span className="text-muted-foreground/50">{t('optional', { defaultMessage: '(Opcional)' })}</span>
          </span>
          <div className="border border-border divide-y divide-border/40 max-h-36 overflow-y-auto">
            {availableGroups.map(group => (
              <label
                key={group._id}
                htmlFor={`invite-group-${group._id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors"
              >
                <input
                  id={`invite-group-${group._id}`}
                  type="checkbox"
                  checked={selectedGroups.includes(group._id)}
                  onChange={() => toggleGroup(group._id)}
                  className="accent-primary"
                />
                <span className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-foreground truncate">{group.name}</span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">{group.slug}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('cancel', { defaultMessage: 'Cancelar' })}
          className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:bg-white/[0.02] font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]"
        >
          {t('cancel', { defaultMessage: 'Cancelar' })}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? t('processing', { defaultMessage: 'Enviando...' }) : t('invite', { defaultMessage: 'Invitar usuario' })}
          className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? t('processing', { defaultMessage: 'ENVIANDO...' }) : t('invite', { defaultMessage: 'INVITAR' })}
        </button>
      </div>
    </form>
  );
}
