import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
    <div className="group relative py-5 px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden rounded-none bg-card backdrop-blur-sm border border-border transition-all duration-500 hover:border-primary/40 w-full">
      {/* Marca de Agua Decorativa */}
      <ShieldCheck className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-foreground" size={56} aria-hidden="true" />
      
      {/* 4 columnas horizontales de telemetría */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {/* Columna 1 */}
        <div className="flex flex-col gap-1 min-w-0 pr-4">
          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
            {t('activeAuthority')}
          </span>
          <span className="text-xs text-primary font-mono font-bold truncate mt-1" title={userId}>
            {userId}
          </span>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col gap-1 md:border-l md:border-border/40 md:pl-6 pr-4 min-w-0">
          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
            {t('sessionRole')}
          </span>
          <span className="text-xs text-foreground font-mono font-bold mt-1">
            {userRole}
          </span>
        </div>

        {/* Columna 3 */}
        <div className="flex flex-col gap-1 md:border-l md:border-border/40 md:pl-6 pr-4 min-w-0">
          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
            {t('localRegion')}
          </span>
          <span className="text-xs text-foreground font-mono font-bold mt-1">
            {locale.toUpperCase()}
          </span>
        </div>

        {/* Columna 4 */}
        <div className="flex flex-col gap-1 md:border-l md:border-border/40 md:pl-6 min-w-0">
          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 leading-none flex items-center gap-1.5">
            {t('certification')}
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </span>
          <span className="text-xs text-emerald-500 font-mono font-black mt-1">
            {t('prodReady')}
          </span>
        </div>
      </div>
    </div>
  );
}
