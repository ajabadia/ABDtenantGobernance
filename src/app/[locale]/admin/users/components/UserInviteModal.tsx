'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { inviteUserAction } from '../actions';
import { updateUserGroupsAction } from '../memberships-actions';
import { X, UserPlus, ChevronDown } from 'lucide-react';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface UserInviteModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableGroups?: Group[];
}

export function UserInviteModal({
  tenantId,
  isOpen,
  onClose,
  onSuccess,
  availableGroups = [],
}: UserInviteModalProps) {
  const t = useTranslations('common');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole('student');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedGroups([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Primera llamada: invitar usuario (envía groupIds para que IAM las almacene)
      const invitePromise = inviteUserAction({
        email,
        name,
        tenantId,
        role,
        allowedApps: ['quiz'],
        groupIds: selectedGroups.length > 0 ? selectedGroups : undefined,
      }).then(result => {
        if (result?.error) throw new Error(result.error);
        return result;
      });

      // Segunda llamada (encadenada): asignar grupos localmente si se seleccionaron
      const groupsPromise = invitePromise.then(result => {
        if (result?.data && selectedGroups.length > 0) {
          return updateUserGroupsAction(tenantId, result.data._id, selectedGroups);
        }
      });

      // Promise.all espera a que ambas se resuelvan (la segunda depende de la primera)
      await toast.promise(
        Promise.all([invitePromise, groupsPromise]),
        {
          loading: 'Enviando invitación…',
          success: 'Usuario invitado correctamente',
          error: (err) =>
            `Error: ${err instanceof Error ? err.message : 'Fallo la invitación'}`,
        }
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al invitar al usuario';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Invitar nuevo usuario"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <UserPlus size={18} className="text-primary" aria-hidden="true" />
            Invitar Usuario
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-email" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
              placeholder="operario@empresa.com"
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Nombre Completo
            </label>
            <input
              id="invite-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-role" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {'Rol'}
            </label>
            <div className="relative">
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground uppercase appearance-none"
              >
                <option value="student">{'Estudiante / Operario'}</option>
                <option value="admin">{'Administrador (Tenant)'}</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Groups */}
          {availableGroups.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                {'Grupos de Permisos'} <span className="text-muted-foreground/50">{'(Opcional)'}</span>
              </span>
              <div className="border border-border divide-y divide-border/40 max-h-36 overflow-y-auto">
                {availableGroups.map(group => (
                  <label
                    key={group._id}
                    htmlFor={`invite-group-${group._id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors"
                  >
                    <input aria-label={`Toggle grupo ${group.name}`}
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
              aria-label="Cancelar invitación"
              className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:bg-white/[0.02] font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Invitar al usuario"
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'ENVIANDO...' : 'INVITAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
