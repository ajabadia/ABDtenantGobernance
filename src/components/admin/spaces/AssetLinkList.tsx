'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link2, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';

export interface AssetLinkInfo {
  _id: string;
  assetId: string;
  spaceId: string;
  spacePath: string;
  isPrimary: boolean;
  isZombie?: boolean;
}

interface Props {
  links: AssetLinkInfo[];
  loading: boolean;
  onUnlink: (assetId: string) => void;
}

export function AssetLinkList({ links, loading, onUnlink }: Props) {
  const t = useTranslations('dashboard.spaces');

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-[10px] text-muted-foreground uppercase flex-1">
        {t('verifying_sovereignty')}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="p-6 text-center font-mono text-[10px] text-muted-foreground uppercase">
        {t('no_assets_linked')}
      </div>
    );
  }

  return (
    <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
      {links.map((link) => (
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

            <button type="button" onClick={() => onUnlink(link.assetId)}
              title={t('unlinking')}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {link.isZombie && (
            <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 flex flex-col gap-2 shrink-0">
              <div className="flex items-start gap-1.5 text-[9px] font-mono text-destructive uppercase tracking-wide">
                <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                <span>{t('zombie_asset_warning')}</span>
              </div>
              <button type="button" onClick={() => onUnlink(link.assetId)}
                title={t('clean_zombie')}
                className="self-start px-2 py-1 bg-destructive/10 text-destructive border border-destructive/30 hover:border-destructive hover:bg-destructive/20 font-mono text-[8px] font-black uppercase transition-all"
              >
                {t('clean_zombie')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
