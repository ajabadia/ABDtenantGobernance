"use client"

/**
 * @purpose Renderiza un selector de casilla para seleccionar aplicaciones autorizadas para un inquilino.
 * @purpose_en Renders a checkbox selector for choosing authorized applications for a tenant.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:qufgei
 * @lastUpdated 2026-06-23T21:45:40.312Z
 */

import { useTranslations } from "next-intl"

interface TenantAppSelectorProps {
  allowedApps: string[];
  onAppsChange: (apps: string[]) => void;
}

export function TenantAppSelector({ allowedApps, onAppsChange }: TenantAppSelectorProps) {
  const t = useTranslations('dashboard.tenants')
  const APP_LIST = ['auth', 'quiz', 'gobernanza', 'elevators']

  return (
    <div className="space-y-1.5 pt-2">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
        {t('allowed_apps_label', { defaultMessage: 'Aplicaciones Autorizadas' })}
      </label>
      <div className="grid grid-cols-2 gap-3 p-3 bg-background/50 border border-border rounded-lg">
        {APP_LIST.map((app) => {
          const isChecked = allowedApps.includes(app)
          return (
            <label key={app} className="flex items-center gap-2 cursor-pointer select-none group text-xs text-foreground">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  const checked = e.target.checked
                  onAppsChange(checked ? [...allowedApps, app] : allowedApps.filter(a => a !== app))
                }}
                className="rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
              />
              <span className="font-mono text-[10px] tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
                {t(`apps.${app}` as `apps.${string}`, { defaultValue: app })}
              </span>
            </label>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/70 ml-1">
        {t('allowed_apps_help', { defaultMessage: 'Selecciona las aplicaciones satélite autorizadas para este tenant.' })}
      </p>
    </div>
  )
}
