'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { X, Link2, Trash2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SpaceData } from './SpaceForm';

interface AssetLinkInfo {
  _id: string;
  assetId: string;
  spaceId: string;
  spacePath: string;
  isPrimary: boolean;
  isZombie?: boolean;
}

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

  const loadLinks = React.useCallback(async () => {
    if (!space) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/spaces/links?spaceId=${space._id}`);
      if (!res.ok) throw new Error('Error loading links');
      const data = await res.json();
      startTransition(() => {
        setLinks(data.links || []);
      });
    } catch (err) {
      toast.error('Error al cargar enlaces');
    } finally {
      setLoading(false);
    }
  }, [space, startTransition]);

  useEffect(() => {
    if (isOpen && space) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadLinks();
    } else {
      startTransition(() => {
        setAssetId('');
        setIsPrimary(true);
      });
    }
  }, [isOpen, space, loadLinks, startTransition]);


  if (!isOpen || !space) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/spaces/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: assetId.trim(),
          spaceId: space._id,
          isPrimary
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('link_error'));
      }
      toast.success(t('link_success'));
      setAssetId('');
      loadLinks();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t('link_error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (targetAssetId: string) => {
    try {
      const res = await fetch(`/api/admin/spaces/links?assetId=${targetAssetId}&spaceId=${space._id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error unlinking');
      }
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
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground mb-4 uppercase shrink-0">
          {t('space_label')} <span className="text-primary font-bold">{space.name}</span> <span className="opacity-50">({space.materializedPath})</span>
        </p>

        <form onSubmit={handleLink} className="flex flex-col gap-4 mb-6 p-4 border border-border bg-secondary/10 shrink-0">
          <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
            {t('link_new_asset')}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder={t('asset_id_placeholder')}
              className="flex-1 h-9 px-3 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
              disabled={saving}
              required
            />
            <button
              type="submit"
              disabled={saving || !assetId.trim()}
              aria-label={saving ? t('linking') : t('add')}
              className="h-9 px-4 bg-primary/10 text-primary border border-primary/40 hover:border-primary hover:bg-primary/20 font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 rounded-none"
            >
              {saving ? t('linking') : t('add')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-3.5 h-3.5 rounded-none border-border bg-secondary/30 text-primary focus:ring-primary focus:ring-offset-0"
              disabled={saving}
            />
            <label htmlFor="isPrimary" className="text-[10px] font-mono text-muted-foreground uppercase select-none cursor-pointer">
              {t('is_primary_label')}
            </label>
          </div>
        </form>

        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-2 shrink-0">
          {t('linked_assets_title')} ({links.length})
        </span>

        {loading ? (
          <div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">
            {t('verifying_sovereignty')}
          </div>
        ) : (
          <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
            {links.length === 0 ? (
              <div className="p-6 text-center font-mono text-[10px] text-muted-foreground uppercase">
                {t('no_assets_linked')}
              </div>
            ) : (
              links.map((link) => (
                <div key={link._id} className={`flex flex-col px-4 py-3 hover:bg-primary/[0.02] ${link.isZombie ? 'bg-destructive/[0.02]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <Link2 size={14} className={link.isZombie ? 'text-destructive/50' : 'text-primary'} />
                      <div className="flex flex-col min-w-0">
                        <span className={`font-mono text-xs font-bold truncate ${link.isZombie ? 'text-muted-foreground/60 line-through' : 'text-foreground'}`}>
                          {link.assetId}
                        </span>
                        <div className="flex gap-2 mt-1">
                          {link.isPrimary && (
                            <span className="px-1.5 py-0.5 border border-primary/20 bg-primary/5 text-primary font-mono text-[8px] font-black uppercase">
                              PRIMARY
                            </span>
                          )}
                          {link.isZombie && (
                            <span className="px-1.5 py-0.5 border border-destructive/20 bg-destructive/5 text-destructive font-mono text-[8px] font-black uppercase flex items-center gap-1">
                              <AlertTriangle size={8} /> ZOMBIE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button aria-label="Unlink asset"
                      type="button"
                      onClick={() => handleUnlink(link.assetId)}
                      title={t('unlinking')}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>

                  {link.isZombie && (
                    <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 flex flex-col gap-2 shrink-0">
                      <div className="flex items-start gap-1.5 text-[9px] font-mono text-destructive uppercase tracking-wide">
                        <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                        <span>{t('zombie_asset_warning')}</span>
                      </div>
                      <button aria-label="Clean zombie link"
                        type="button"
                        onClick={() => handleUnlink(link.assetId)}
                        title={t('clean_zombie')}
                        className="self-start px-2 py-1 bg-destructive/10 text-destructive border border-destructive/30 hover:border-destructive hover:bg-destructive/20 font-mono text-[8px] font-black uppercase transition-all"
                      >
                        {t('clean_zombie')}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="px-4 py-2 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-bold uppercase transition-all rounded-none"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
