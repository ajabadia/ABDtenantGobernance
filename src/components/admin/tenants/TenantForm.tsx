"use client"

/**
 * @purpose Renderiza una forma para crear o editar información de inquilinos, incluyendo detalles básicos y selección de solicitud.
 * @purpose_en Renders a form for creating or editing tenant information, including basic details and application selection.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:x8pyfh
 * @lastUpdated 2026-06-23T21:45:53.656Z
 */

import * as React from "react"
import { Shield } from "lucide-react"
import type { Tenant } from "@/lib/schemas/tenant"
import { useTranslations } from "next-intl"
import type { SubmitTenantAction } from "./types"
import { TenantBasicInfoFields } from './TenantBasicInfoFields'
import { TenantAppSelector } from './TenantAppSelector'

interface TenantFormProps {
  initialData?: Tenant | null;
  onSubmit: SubmitTenantAction;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function TenantForm({ initialData, onSubmit, onCancel, isSubmitting }: TenantFormProps) {
  const t = useTranslations('dashboard.tenants')
  
  const [formData, setFormData] = React.useState<Partial<Tenant>>({
    name: "",
    tenantId: "" as Tenant["tenantId"],
    industry: "Industrial",
    dbPrefix: "",
    isolationStrategy: "COLLECTION_PREFIX",
    allowedApps: [],
    active: true,
  })

  React.useEffect(() => {
    if (initialData) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card border border-border rounded-b-xl">
      <div className="space-y-4">
        <TenantBasicInfoFields
          name={formData.name || ''}
          tenantId={formData.tenantId || ''}
          industry={formData.industry || 'Industrial'}
          dbPrefix={formData.dbPrefix || ''}
          initialData={initialData}
          onNameChange={name => setFormData(p => ({ ...p, name }))}
          onTenantIdChange={tenantId => setFormData(p => ({ ...p, tenantId: tenantId as Tenant['tenantId'] }))}
          onIndustryChange={industry => setFormData(p => ({ ...p, industry }))}
          onDbPrefixChange={dbPrefix => setFormData(p => ({ ...p, dbPrefix }))}
        />

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
            <Shield size={10} className="text-primary" aria-hidden="true" /> {t('isolation_label')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT'] as const).map((strategy) => (
              <button
                key={strategy}
                type="button"
                aria-label={strategy}
                onClick={() => setFormData({ ...formData, isolationStrategy: strategy })}
                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  formData.isolationStrategy === strategy 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-background/40 border-border text-muted-foreground hover:border-border/80 outline-none'
                }`}
              >
                {strategy.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('hierarchy_levels', { defaultMessage: 'Niveles de Jerarquía de Espacios' })}</label>
          <input 
            value={(formData.customSpaceLabels || []).join(', ')}
            onChange={e => setFormData({ 
              ...formData, 
              customSpaceLabels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
            })}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Ej: Organización, Espacio, Carpeta"
          />
          <p className="text-[10px] text-muted-foreground/70 ml-1">{t('hierarchy_help', { defaultMessage: 'Separa los niveles por coma. Se asignarán por profundidad.' })}</p>
        </div>

        <TenantAppSelector
          allowedApps={formData.allowedApps || []}
          onAppsChange={allowedApps => setFormData(p => ({ ...p, allowedApps }))}
        />
      </div>

      <footer className="flex gap-3 pt-4 border-t border-border">
        <button 
          type="button"
          onClick={onCancel}
          aria-label={t('actions.cancel')}
          className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors outline-none"
        >
          {t('actions.cancel')}
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          aria-label={t('actions.save')}
          className="flex-1 px-8 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 outline-none"
        >
          {isSubmitting ? '...' : t('actions.save')}
        </button>
      </footer>
    </form>
  )
}
