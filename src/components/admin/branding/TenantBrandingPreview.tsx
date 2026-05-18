'use client';

import React from 'react';
import { Eye, Layout, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TenantBrandingPreviewProps {
  tenantId: string;
  logoPreview: string | null;
  faviconPreview: string | null;
  previewCss: string;
}

export function TenantBrandingPreview({
  tenantId,
  logoPreview,
  faviconPreview,
  previewCss,
}: TenantBrandingPreviewProps) {
  const t = useTranslations('admin');

  return (
    <div className="lg:col-span-5 flex flex-col gap-4 border-l border-border pl-0 lg:pl-8 pt-6 lg:pt-0">
      {/* Estilo inyectado dinámicamente que TIÑE ÚNICAMENTE la caja de previsualización (scoping selectivo) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #simulated-satellite-preview {
            ${previewCss.replace(/:root/g, '#simulated-satellite-preview')}
            ${previewCss.replace(/\.dark/g, '#simulated-satellite-preview')}
          }
        `
      }} />

      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Eye size={14} className="text-muted-foreground" />
        Previsualizador de Satélite
      </h3>

      {/* Caja del Satélite Virtual */}
      <div 
        id="simulated-satellite-preview"
        className="relative flex flex-col justify-between aspect-video rounded-xl p-5 border border-border transition-colors duration-300 overflow-hidden shadow-sm bg-secondary text-secondary-foreground"
      >
        {/* Header del Simulador */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            {logoPreview ? (
              <img src={logoPreview} alt="Simulated Logo" className="h-6 max-w-[100px] object-contain" />
            ) : (
              <Layout size={18} className="text-primary" />
            )}
            <span className="text-[10px] font-bold tracking-widest">{t('abdPortal')}</span>
          </div>
          <div className="flex items-center gap-2">
            {faviconPreview && (
              <img src={faviconPreview} alt="Simulated Favicon" className="h-4 w-4 object-contain rounded" />
            )}
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Cuerpo del Simulador */}
        <div className="flex flex-col gap-2 my-3">
          <div className="bg-background/40 border border-border/50 p-3 rounded-[var(--radius)] text-secondary-foreground">
            <span className="text-[9px] opacity-70 block mb-0.5">{t('licenseControl')}</span>
            <span className="text-xs font-semibold">{t('premiumSubscription')}</span>
          </div>

          <div className="flex gap-2">
            <button aria-label="Acceder Satélite"
              type="button"
              className="flex-1 py-1.5 px-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-[var(--radius)] cursor-default transition-all duration-200"
            >
              Acceder Satélite
            </button>
            <button aria-label="Volver"
              type="button"
              className="flex-1 py-1.5 px-3 border border-border/50 text-[10px] rounded-[var(--radius)] cursor-default hover:bg-background/20 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Footer del Simulador */}
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[9px] opacity-70">
          <span className="flex items-center gap-1">
            <Database size={10} />
            Org: {tenantId}
          </span>
          <span>{t('versionShort')}</span>
        </div>
      </div>

      <div className="bg-secondary/10 border border-border p-3 rounded-lg text-[10px] text-muted-foreground flex flex-col gap-1.5">
        <span className="font-semibold text-foreground">{t('wcagCompliance')}</span>
        <span>{t('wcagDesc')}</span>
      </div>
    </div>
  );
}
