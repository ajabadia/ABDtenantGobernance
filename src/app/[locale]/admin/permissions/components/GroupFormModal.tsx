'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Shield, ChevronDown } from 'lucide-react';
import { createGroupAction, updateGroupAction } from '../actions';

interface Policy {
  _id: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
}

interface Group {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}

interface GroupFormModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGroup?: Group | null;
  groups: Group[];
  policies: Policy[];
  availableApps: string[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-');
}

export function GroupFormModal({
  tenantId,
  isOpen,
  onClose,
  onSuccess,
  editingGroup,
  groups,
  policies,
  availableApps,
}: GroupFormModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (editingGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editingGroup.name || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(editingGroup.slug || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(editingGroup.description || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParentId(editingGroup.parentId || null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPolicies(editingGroup.policyIds || []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedApps(editingGroup.allowedApps || []);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParentId(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPolicies([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedApps([]);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('');
  }, [editingGroup, isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(slugify(name));
    }
  }, [name, editingGroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name,
        slug,
        description: description || undefined,
        parentId: parentId || null,
        policyIds: selectedPolicies,
        allowedApps: selectedApps,
      };

      let result;
      if (editingGroup) {
        result = await updateGroupAction(editingGroup._id, tenantId, payload);
      } else {
        result = await createGroupAction(tenantId, payload);
      }

      if (result?.error) throw new Error(result.error);

      toast.success(editingGroup ? 'Grupo actualizado correctamente' : 'Grupo creado correctamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el grupo';
      setError(msg);
      toast.error('Error al guardar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePolicy = (policyId: string) => {
    setSelectedPolicies(prev =>
      prev.includes(policyId) ? prev.filter(id => id !== policyId) : [...prev, policyId]
    );
  };

  const toggleApp = (app: string) => {
    setSelectedApps(prev =>
      prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]
    );
  };

  // Filter out the group being edited and descendants from parent options
  const parentOptions = groups.filter(g => g._id !== editingGroup?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={editingGroup ? 'Editar grupo de permisos' : 'Crear grupo de permisos'}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Shield size={18} className="text-primary" aria-hidden="true" />
            {editingGroup ? 'Editar Grupo' : 'Crear Grupo'}
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
            <label htmlFor="group-name" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Nombre del Grupo
            </label>
            <input
              id="group-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="Técnicos de Campo"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-2">
            <label htmlFor="group-slug" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Slug
            </label>
            <input
              id="group-slug"
              type="text"
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none"
              placeholder="tecnicos-campo"
              pattern="[a-z0-9\-_]+"
            />
            <span className="text-[9px] font-mono text-muted-foreground/60">
              Solo minúsculas, números, guiones y guiones bajos
            </span>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="group-description" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              {'Descripción'} <span className="text-muted-foreground/50">{'(Opcional)'}</span>
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="px-4 py-2 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none resize-none"
              placeholder="Descripción del grupo..."
            />
          </div>

          {/* Parent Group */}
          <div className="flex flex-col gap-2">
            <label htmlFor="group-parent" className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Grupo Superior (Herencia)
            </label>
            <div className="relative">
              <select
                id="group-parent"
                value={parentId || ''}
                onChange={e => setParentId(e.target.value || null)}
                className="w-full h-10 pl-4 pr-10 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none appearance-none uppercase"
              >
                <option value="">{'— Sin Padre (Nivel Raíz) —'}</option>
                {parentOptions.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Policies */}
          {policies.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                Políticas Asignadas
              </span>
              <div className="border border-border divide-y divide-border/40 max-h-36 overflow-y-auto">
                {policies.map(policy => (
                  <label
                    key={policy._id}
                    htmlFor={`policy-${policy._id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors"
                  >
                    <input
                      id={`policy-${policy._id}`}
                      type="checkbox"
                      checked={selectedPolicies.includes(policy._id)}
                      onChange={() => togglePolicy(policy._id)}
                      className="accent-primary"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-mono text-[10px] text-foreground block truncate">{policy.name}</span>
                      <span className={`font-mono text-[9px] ${policy.effect === 'ALLOW' ? 'text-green-500' : 'text-red-500'}`}>
                        {policy.effect}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Apps */}
          {availableApps.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                Aplicaciones Heredadas
              </span>
              <div className="flex flex-wrap gap-2">
                {availableApps.map(app => (
                  <button aria-label={`Toggle aplicación ${app}`}
                    type="button"
                    key={app}
                    onClick={() => toggleApp(app)}
                    aria-pressed={selectedApps.includes(app)}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider border rounded-none transition-all ${
                      selectedApps.includes(app)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              aria-label={editingGroup ? 'Guardar cambios' : 'Crear grupo'}
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'GUARDANDO...' : editingGroup ? 'GUARDAR' : 'CREAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
