'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Shield } from 'lucide-react';
import { updateUserGroupsAction } from '../memberships-actions';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface ManageUserGroupsModalProps {
  tenantId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableGroups: Group[];
  initialGroupIds: string[];
}

export function ManageUserGroupsModal({
  tenantId,
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess,
  availableGroups,
  initialGroupIds,
}: ManageUserGroupsModalProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      startTransition(() => {
        setSelectedGroups(initialGroupIds);
      });
    }
  }, [isOpen, initialGroupIds]);

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateUserGroupsAction(tenantId, userId, selectedGroups);
      if (result?.error) throw new Error(result.error);
      
      toast.success('Grupos actualizados correctamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error('Error al actualizar grupos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Grupos de Usuario
          </h2>
          <button onClick={onClose} aria-label="Cerrar modal" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase">
          Usuario: <span className="text-primary font-bold">{userName}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="border border-border divide-y divide-border/40 max-h-64 overflow-y-auto">
            {availableGroups.length === 0 ? (
               <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                 No hay grupos disponibles
               </div>
            ) : (
               availableGroups.map(group => (
                 <label key={group._id} htmlFor={`manage-group-${group._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-primary/[0.03] cursor-pointer transition-colors">
                   <input
                     id={`manage-group-${group._id}`}
                     type="checkbox"
                     checked={selectedGroups.includes(group._id)}
                     onChange={() => toggleGroup(group._id)}
                     className="accent-primary"
                   />
                   <span className="flex flex-col min-w-0">
                     <span className="font-mono text-[10px] text-foreground truncate uppercase">{group.name}</span>
                     <span className="font-mono text-[9px] text-muted-foreground/60">{group.slug}</span>
                   </span>
                 </label>
               ))
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              aria-label="Cancelar"
              onClick={onClose}
              className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              aria-label="Guardar cambios"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none"
            >
              {isLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
