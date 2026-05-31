// AddExistingUserModal.tsx - Allows adding an existing user or creating a new one and sending an invitation
// Located in src/app/[locale]/admin/users/components/AddExistingUserModal.tsx

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { X, UserPlus } from 'lucide-react';
import { AddExistingUserFormBody } from './AddExistingUserFormBody';
import { inviteUserAction } from '../actions';
import { updateUserGroupsAction } from '../memberships-actions';

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
      });
      
      if (result?.error) throw new Error(result.error);

      if (result?.data && selectedGroups.length > 0) {
        const membershipResult = await updateUserGroupsAction(tenantId, result.data._id, selectedGroups);
        if (membershipResult?.error) throw new Error(membershipResult.error);
      }
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
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

        <AddExistingUserFormBody
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          role={role}
          setRole={setRole}
          selectedGroups={selectedGroups}
          toggleGroup={toggleGroup}
          availableGroups={availableGroups}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
