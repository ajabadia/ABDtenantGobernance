'use client';

/**
 * @purpose Renderiza un modal para crear políticas con formularios de entrada y maneja el proceso de creación.
 * @purpose_en Renders a modal for creating policies with form inputs and handles the creation process.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:16d86e3
 * @lastUpdated 2026-06-23T20:38:49.306Z
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, FileText } from 'lucide-react';
import { createPolicyAction } from '../actions';
import { PolicyFormContent } from './PolicyFormContent';

interface PolicyFormModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PolicyFormModal({ tenantId, isOpen, onClose, onSuccess }: PolicyFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [resources, setResources] = useState('');
  const [actions, setActions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await createPolicyAction(tenantId, {
        name,
        description: description || undefined,
        effect,
        resources: resources.split(',').map(r => r.trim()).filter(Boolean),
        actions: actions.split(',').map(a => a.trim()).filter(Boolean),
        isActive: true,
      });

      if (result?.error) throw new Error(result.error);

      toast.success('Política creada correctamente');
      onSuccess();
      onClose();
      setName('');
      setDescription('');
      setEffect('ALLOW');
      setResources('');
      setActions('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la política';
      setError(msg);
      toast.error('Error al crear la política');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Crear política de permisos">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={(e) => { e.stopPropagation(); onClose(); }} />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <FileText size={18} className="text-primary" aria-hidden="true" /> Nueva Política
          </h2>
          <button onClick={onClose} aria-label="Cerrar modal" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider">{error}</div>
        )}

        <PolicyFormContent
          name={name} setName={setName}
          description={description} setDescription={setDescription}
          effect={effect} setEffect={setEffect}
          resources={resources} setResources={setResources}
          actions={actions} setActions={setActions}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
