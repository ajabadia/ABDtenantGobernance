'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, UserPlus } from 'lucide-react';
import { UserInviteFormBody } from './UserInviteFormBody';
import { useUserInvite } from './useUserInvite';

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

  const {
    email, setEmail, name, setName, role, setRole,
    selectedGroups, toggleGroup, isLoading, error, handleSubmit,
  } = useUserInvite(tenantId, isOpen, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Invitar nuevo usuario"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
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

        <UserInviteFormBody
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
