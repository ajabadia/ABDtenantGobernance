'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, FileText, ChevronDown } from 'lucide-react';
import { createPolicyAction } from '../actions';

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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            Nueva Política
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="policy-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Nombre de la Política
            </label>
            <input
              id="policy-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="Aprobar Exámenes"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="policy-description" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {'Descripción'} <span className="text-muted-foreground/50">{'(Opcional)'}</span>
            </label>
            <input
              id="policy-description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="Permite aprobar exámenes de la plataforma"
            />
          </div>

          {/* Effect */}
          <div className="flex flex-col gap-2">
            <label htmlFor="policy-effect" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Efecto
            </label>
            <div className="relative">
              <select
                id="policy-effect"
                value={effect}
                onChange={e => setEffect(e.target.value as 'ALLOW' | 'DENY')}
                className="w-full h-10 pl-4 pr-10 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none appearance-none uppercase"
              >
                <option value="ALLOW">{'ALLOW — Permitir'}</option>
                <option value="DENY">{'DENY — Denegar'}</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-2">
            <label htmlFor="policy-resources" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Recursos
            </label>
            <input
              id="policy-resources"
              type="text"
              required
              value={resources}
              onChange={e => setResources(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="quiz:exams:*, quiz:results:read"
            />
            <span className="text-[9px] font-mono text-muted-foreground/60">
              Separados por coma. Soporta patrones glob (*)
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <label htmlFor="policy-actions" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Acciones
            </label>
            <input
              id="policy-actions"
              type="text"
              required
              value={actions}
              onChange={e => setActions(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="read, write, approve"
            />
            <span className="text-[9px] font-mono text-muted-foreground/60">
              Separadas por coma
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancelar"
              className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:bg-white/[0.02] font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Crear política"
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'GUARDANDO...' : 'CREAR POLÍTICA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
