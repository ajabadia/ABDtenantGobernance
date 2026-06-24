"use client"

/**
 * @purpose Renderiza un formulario para campos de información básica de los inquilinos, como nombre, ID, industria y prefijo de base de datos.
 * @purpose_en Renders a form for basic tenant information fields such as name, ID, industry, and database prefix.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:me0860
 * @lastUpdated 2026-06-23T21:45:44.210Z
 */

import * as React from "react"
import { Globe, Database } from "lucide-react"
import type { Tenant } from "@/lib/schemas/tenant"
import { useTranslations } from "next-intl"

interface TenantBasicInfoFieldsProps {
  name: string;
  tenantId: string;
  industry: string;
  dbPrefix: string;
  initialData?: Tenant | null;
  onNameChange: (name: string) => void;
  onTenantIdChange: (id: string) => void;
  onIndustryChange: (industry: string) => void;
  onDbPrefixChange: (prefix: string) => void;
}

export function TenantBasicInfoFields({
  name, tenantId, industry, dbPrefix, initialData,
  onNameChange, onTenantIdChange, onIndustryChange, onDbPrefixChange,
}: TenantBasicInfoFieldsProps) {
  const t = useTranslations('dashboard.tenants')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('name_label')}</label>
          <input
            required
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Acme Corp"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('id_label')}</label>
          <input
            required
            disabled={!!initialData}
            value={tenantId}
            onChange={e => onTenantIdChange(e.target.value.toUpperCase())}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
            placeholder="ACME_IND"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
            <Globe size={10} className="text-primary" aria-hidden="true" /> {t('industry')}
          </label>
          <select
            value={industry}
            onChange={e => onIndustryChange(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="Industrial" className="bg-background">{t('industries.industrial')}</option>
            <option value="Energy" className="bg-background">{t('industries.energy')}</option>
            <option value="Logistics" className="bg-background">{t('industries.logistics')}</option>
            <option value="Security" className="bg-background">{t('industries.security')}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
            <Database size={10} className="text-primary" aria-hidden="true" /> {t('database')}
          </label>
          <input
            required
            value={dbPrefix}
            onChange={e => onDbPrefixChange(e.target.value.toLowerCase())}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="acme_"
          />
        </div>
      </div>
    </div>
  )
}
