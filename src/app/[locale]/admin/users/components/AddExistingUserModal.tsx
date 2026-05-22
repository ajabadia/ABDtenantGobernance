// AddExistingUserModal.tsx - Allows adding an existing user or creating a new one and sending an invitation
// Located in src/app/[locale]/admin/users/components/AddExistingUserModal.tsx

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { X, UserPlus, ChevronDown } from 'lucide-react';
import { inviteUserAction } from '../actions';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface AddExistingUserModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableGroups?: Group[];
}

export function AddExistingUserModal({
  tenantId,
  isOpen,
  onClose,
  onSuccess,
  availableGroups = [],
}: AddExistingUserModalProps) {
  const t = useTranslations('common');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  // Reset fields when modal opens — deferred via startTransition to avoid
  // synchronous setState inside effect (react-hooks/set-state-in-effect)
  useEffect(() => {
    if (isOpen) {
      startTransition(() => {
        setEmail('');
        setName('');
        setRole('student');
        setSelectedGroups([]);
        setError('');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await inviteUserAction({
        email,
        name,
        tenantId,
        role,
        allowedApps: ['quiz'], // adjust as needed
        groupIds: selectedGroups,
      });
      if (result?.error) throw new Error(result.error);
      toast.success('Usuario procesado correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el usuario';
      setError(msg);
      toast.error('Falló el proceso');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Agregar/Invitar usuario">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <UserPlus size={18} className="text-primary" aria-hidden="true" />
            {t('addOrInviteUser')}
          </h2>
          <button onClick={onClose} aria-label="Cerrar modal" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="add-email" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Email
            </label>
            <input
              id="add-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
              placeholder="usuario@empresa.com"
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="add-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Nombre Completo
            </label>
            <input
              id="add-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label htmlFor="add-role" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Rol
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
                Grupos de Permisos (Opcional)
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
      </div>
    </div>
  );
}
