"use client"

import { Building2, Globe, Database, Trash2, Edit3, Palette, Layers, ShieldCheck } from 'lucide-react'
import type { Tenant } from "@/lib/schemas/tenant"
import type { TenantManagementTranslations } from "./types"
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface TenantCardProps {
  tenant: Tenant;
  translations: TenantManagementTranslations;
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
}

export function TenantCard({ tenant, translations: t, onEdit, onDelete }: TenantCardProps) {
  const params = useParams()
  const locale = params?.locale as string || 'en'

  return (
    <div className="bg-card p-5 rounded-xl border border-border hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col justify-between">
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10 text-primary shrink-0">
            <Building2 size={24} aria-hidden="true" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-black tracking-tight uppercase truncate text-foreground leading-none">{tenant.name}</h3>
              {tenant.active ? (
                <span className="flex h-2 w-2 rounded-full bg-green-500 shrink-0" aria-label={t.status_label} />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-red-500 shrink-0" aria-label={t.status_label} />
              )}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">{tenant.tenantId}</p>
          </div>
        </div>

        {/* Botones de acción alineados estáticamente en el flujo flex para prevenir colisiones */}
        <div className="flex items-center gap-0.5 shrink-0 bg-card">
          <Link 
            href={`/${locale}/admin/spaces?tenantId=${tenant.tenantId}`}
            className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all outline-none"
            aria-label="Manage space hierarchy"
            title="Manage Space Hierarchy"
          >
            <Layers size={13} aria-hidden="true" />
          </Link>
          <Link 
            href={`/${locale}/admin/branding?tenantId=${tenant.tenantId}`}
            className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all outline-none"
            aria-label="Customize white-label branding"
            title="Branding Customizer"
          >
            <Palette size={13} aria-hidden="true" />
          </Link>
          <Link 
            href={`/${locale}/admin/audit?tenantId=${tenant.tenantId}`}
            className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all outline-none"
            aria-label="View audit logs and telemetries"
            title="Audit Logs & Telemetry"
          >
            <ShieldCheck size={13} aria-hidden="true" />
          </Link>
          <button aria-label={t.actions.edit}
            onClick={() => onEdit(tenant)}
            className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all outline-none cursor-pointer"
            title="Edit Details"
          >
            <Edit3 size={13} aria-hidden="true" />
          </button>
          <button aria-label={t.actions.delete}
            onClick={() => onDelete(tenant._id?.toString() || '')}
            className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-md transition-all outline-none cursor-pointer"
            title="Delete Organization"
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{t.industry}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe size={10} className="text-primary" aria-hidden="true" />
            <span className="truncate">{tenant.industry}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{t.database}</p>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Database size={10} className="text-primary" aria-hidden="true" />
            {tenant.dbPrefix || '---'}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{t.spaces}</p>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Layers size={10} className="text-primary" aria-hidden="true" />
            {tenant.spaceCount !== undefined ? tenant.spaceCount : 0}
          </div>
        </div>
      </div>
    </div>
  )
}
