'use client';

import React from 'react';
import { ShieldCheck, Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SystemTelemetryPanelProps {
  userId: string;
  userRole: string;
  locale: string;
}

export function SystemTelemetryPanel({
  userId,
  userRole,
  locale,
}: SystemTelemetryPanelProps) {
  const t = useTranslations('admin');

  return (
    <Card className="p-8 bg-card/50 border-border rounded-xl flex flex-col gap-6 h-fit shadow-sm">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
          {t('securityTitle')}
        </h2>
      </div>
      
      <Separator className="bg-border" aria-hidden="true" />

      <div className="flex flex-col gap-4 font-mono text-[10px] uppercase">
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground tracking-wider">{t('activeAuthority')}</span>
          <span className="text-foreground font-bold">{userId}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-t border-border pt-3">
          <span className="text-muted-foreground tracking-wider">{t('sessionRole')}</span>
          <span className="text-foreground font-bold">{userRole}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-t border-border pt-3">
          <span className="text-muted-foreground tracking-wider">{t('localRegion')}</span>
          <span className="text-foreground font-bold">{locale.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-t border-border pt-3">
          <span className="text-muted-foreground tracking-wider">{t('certification')}</span>
          <span className="text-emerald-500 font-black animate-pulse">{t('prodReady')}</span>
        </div>
      </div>

      <Separator className="bg-border" aria-hidden="true" />
      
      <div className="p-4 bg-secondary/30 border border-border flex flex-col gap-2 rounded-lg">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-widest text-primary uppercase">
          <Terminal className="w-3.5 h-3.5" />
          {t('auditTitle')}
        </div>
        <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-mono">
          {t('auditDesc')}
        </p>
      </div>
    </Card>
  );
}
