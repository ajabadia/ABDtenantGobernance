'use client';

/**
 * @purpose Gestiona y muestra activos vinculados a un espacio, permitiendo a los usuarios agregar, eliminar y cambiar el estado principal de activos.
 * @purpose_en Manages and displays assets linked to a space, allowing users to add, remove, and toggle primary status of assets.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:1wwf4dp
 * @lastUpdated 2026-06-23T21:45:08.432Z
 */

import React, { useState, useEffect, useTransition, useCallback, startTransition } from 'react';
import { toast } from 'sonner';
import { X, Link2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SpaceData } from './SpaceForm';
import { AssetLinkList, type AssetLinkInfo } from './AssetLinkList';

interface Props {
  tenantId: string;
  space: SpaceData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManageSpaceAssetsModal({ tenantId, space, isOpen, onClose, onSuccess }: Props) {
  const t = useTranslations('dashboard.spaces');
  const [links, setLinks] = useState<AssetLinkInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [, startTransition] = useTransition();

  const loadLinks = useCallback(async () => {
    if (!space) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/spaces/links?spaceId=${space._id}`);
      if (!res.ok) throw new Error('Error loading links');
      const data = await res.json();
      startTransition(() => setLinks(data.links || []));
    } catch {
      toast.error('Error al cargar enlaces');
    } finally {
      setLoading(false);
    }
  }, [space, startTransition]);

  useEffect(() => {
    if (isOpen && space) {
      startTransition(() => { loadLinks(); });
    } else {
      startTransition(() => { setAssetId(''); setIsPrimary(true); });
    }
  }, [isOpen, space, loadLinks]);

  if (!isOpen || !space) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/spaces/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: assetId.trim(), spaceId: space._id, isPrimary })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('link_error'));
      toast.success(t('link_success'));
      setAssetId('');
      loadLinks();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error(t('link_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (targetAssetId: string) => {
    try {
      const res = await fetch(`/api/admin/spaces/links?assetId=${targetAssetId}&spaceId=${space._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error unlinking');
      toast.success(t('unlink_success'));
      loadLinks();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl p-6 rounded-none animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border shrink-0">
          <h2 className="text-md font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Link2 size={16} className="text-primary" />
            {t('manage_assets')}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">
          {t('space_label')} <span className="text-primary font-bold">{space.name}</span> <span className="opacity-50">({space.materializedPath})</span>
        </p>

        <form onSubmit={handleLink} className="flex flex-col gap-4 mb-6 p-4 border border-border bg-secondary/10 shrink-0">
          <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{t('link_new_asset')}</span>
          <div className="flex gap-2">
            <input type="text" value={assetId} onChange={(e) => setAssetId(e.target.value)}
              placeholder={t('asset_id_placeholder')} disabled={saving} required
              className="flex-1 h-9 px-3 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
            />
            <button type="submit" disabled={saving || !assetId.trim()} aria-label={saving ? t('linking') : t('add')}
              className="h-9 px-4 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none"
            >
              {saving ? t('linking') : t('add')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPrimary" checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)} disabled={saving}
              className="w-3.5 h-3.5 rounded-none border-border bg-secondary/30 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label htmlFor="isPrimary" className="text-[10px] font-mono text-muted-foreground uppercase select-none cursor-pointer">
              {t('is_primary_label')}
            </label>
          </div>
        </form>

        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2 shrink-0">
          {t('linked_assets_title')} ({links.length})
        </span>

        <AssetLinkList links={links} loading={loading} onUnlink={handleUnlink} />

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} aria-label={t('close')}
            className="px-4 py-2 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
