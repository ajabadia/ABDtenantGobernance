'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Users, Trash2, Search, Check } from 'lucide-react';
import { fetchUsersAction } from '../../users/actions';
import { fetchTenantMembershipsAction, updateGroupUsersAction } from '../../users/memberships-actions';
import { IamUser } from '@/lib/services/iamClient';

interface ManageGroupMembersModalProps {
  tenantId: string;
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageGroupMembersModal({
  tenantId,
  groupId,
  groupName,
  isOpen,
  onClose,
  onSuccess,
}: ManageGroupMembersModalProps) {
  const [users, setUsers] = useState<IamUser[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoading(true);
        const [usersRes, memRes] = await Promise.all([
          fetchUsersAction(tenantId),
          fetchTenantMembershipsAction(tenantId)
        ]);
        if (!usersRes.error) {
          startTransition(() => {
            setUsers(usersRes.data || []);
          });
        }
        if (!memRes.error) {
          const groupMemberships = (memRes.data as { userId: string; groupId: string }[] || []).filter(m => m.groupId === groupId);
          startTransition(() => {
            setMemberIds(groupMemberships.map(m => m.userId));
          });
        }
        setLoading(false);
      };
      loadData();
    }
  }, [isOpen, tenantId, groupId]);

  if (!isOpen) return null;

  const currentMembers = users.filter(u => memberIds.includes(u._id));
  
  const searchResults = search.length >= 2 
    ? users.filter(u => 
        !memberIds.includes(u._id) && 
        (`${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 5) // Limit to 5 results
    : [];

  const handleAddMember = (userId: string) => {
    setMemberIds(prev => [...prev, userId]);
    setSearch('');
  };

  const handleRemoveMember = (userId: string) => {
    setMemberIds(prev => prev.filter(id => id !== userId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateGroupUsersAction(tenantId, groupId, memberIds);
      if (result?.error) throw new Error(result.error);
      
      toast.success('Miembros actualizados correctamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error('Error al actualizar miembros');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl p-8 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Miembros del Grupo
          </h2>
          <button onClick={onClose} aria-label="Cerrar modal" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">
          Grupo: <span className="text-primary font-bold">{groupName}</span>
        </p>

        {loading ? (
           <div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">
             CARGANDO DATOS...
           </div>
        ) : (
          <div className="flex flex-col gap-6 flex-1 overflow-hidden">
            {/* Buscador */}
            <div className="flex flex-col gap-2 shrink-0 relative">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                Añadir Miembro
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por email o nombre..."
                  className="w-full h-10 pl-9 pr-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
                />
              </div>
              
              {/* Resultados de Búsqueda */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border shadow-lg">
                  {searchResults.map(u => (
                    <button
                      key={u._id}
                      type="button"
                      aria-label={`Añadir a ${u.name}`}
                      onClick={() => handleAddMember(u._id)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-primary/[0.05] border-b border-border/40 last:border-0 text-left transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-sans text-xs font-bold text-foreground">{u.name} {u.surname}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{u.email}</span>
                      </div>
                      <Check size={14} className="text-primary/0 hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Miembros Actuales */}
            <div className="flex flex-col flex-1 overflow-hidden">
               <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2 shrink-0">
                 Miembros Actuales ({memberIds.length})
               </span>
               <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
                 {currentMembers.length === 0 ? (
                    <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                      El grupo está vacío
                    </div>
                 ) : (
                    currentMembers.map(u => (
                      <div key={u._id} className="flex items-center justify-between px-4 py-2 hover:bg-primary/[0.02]">
                        <div className="flex flex-col">
                          <span className="font-sans text-xs font-bold text-foreground">{u.name} {u.surname}</span>
                          <span className="font-mono text-[9px] text-muted-foreground">{u.email}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Quitar a ${u.name}`}
                          onClick={() => handleRemoveMember(u._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                 )}
               </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button
            type="button"
            aria-label="Cancelar"
            onClick={onClose}
            className="px-5 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            aria-label="Guardar cambios"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none"
          >
            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>
    </div>
  );
}
