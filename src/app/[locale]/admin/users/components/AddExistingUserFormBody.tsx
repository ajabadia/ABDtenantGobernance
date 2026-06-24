'use client';

/**
 * @purpose Renderiza un formulario para agregar o invitar a un usuario existente, incluyendo campos para correo electrónico, nombre, rol y selección de grupo.
 * @purpose_en Renders a form for adding or inviting an existing user, including fields for email, name, role, and group selection.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:uaampp
 * @lastUpdated 2026-06-23T21:42:58.552Z
 */

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface AddExistingUserFormBodyProps {
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

export function AddExistingUserFormBody({
  email, setEmail,
  name, setName,
  role, setRole,
  selectedGroups, toggleGroup,
  availableGroups,
  isLoading,
  onSubmit, onClose,
}: AddExistingUserFormBodyProps) {
  const t = useTranslations('common');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="add-email" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('email', { defaultMessage: 'Email' })}
        </label>
        <input
          id="add-email"
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
        <label htmlFor="add-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('name_label', { defaultMessage: 'Nombre Completo' })}
        </label>
        <input
          id="add-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
          placeholder={t('name_placeholder', { defaultMessage: 'Juan Pérez' })}
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-2">
        <label htmlFor="add-role" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {t('role_label', { defaultMessage: 'Rol' })}
        </label>
        <div className="relative">
          <select
            id="add-role"
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
            {t('permission_groups', { defaultMessage: 'Grupos de Permisos (Opcional)' })}
          </span>
          <div className="border border-border divide-y divide-border/40 max-h-36 overflow-y-auto">
            {availableGroups.map(group => (
              <label key={group._id} htmlFor={`add-group-${group._id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors">
                <input
                  id={`add-group-${group._id}`}
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-4">
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
          aria-label={isLoading ? t('processing', { defaultMessage: 'Procesando...' }) : t('addOrInviteUser', { defaultMessage: 'Agregar / Invitar' })}
          className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? t('processing', { defaultMessage: 'Procesando...' }) : t('addOrInviteUser', { defaultMessage: 'Agregar / Invitar' })}
        </button>
      </div>
    </form>
  );
}
