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
    <div className="group relative p-8 flex flex-col justify-between min-h-[300px] overflow-hidden rounded-none bg-card backdrop-blur-sm border border-border transition-all duration-500 hover:border-primary/40">
      {/* Marca de Agua Decorativa */}
      <Building2 className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-foreground" size={96} aria-hidden="true" />
      
      <div className="z-10">
        {/* Bloque Narrativo Superior */}
        <div className="flex flex-col gap-2 mb-6">
           <div className="flex items-center gap-3">
             <h3 className="text-2xl font-bold uppercase tracking-tight text-foreground leading-none truncate">{tenant.name}</h3>
             {tenant.active ? (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-label={t.status_label} />
             ) : (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 shrink-0" aria-label={t.status_label} />
             )}
           </div>
           <p className="text-sm text-muted-foreground leading-relaxed">
             ID: <span className="font-mono text-primary font-bold">{tenant.tenantId}</span>
           </p>
        </div>
        
        {/* Bandeja de Metadatos */}
        <div className="border-t border-border pt-4 mb-6 flex flex-wrap gap-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
           <div className="flex items-center gap-1.5">
             <Globe size={10} className="text-primary opacity-80" aria-hidden="true" />
             <span>{t.industry}: <span className="text-foreground/70 font-bold">{tenant.industry}</span></span>
           </div>
           <div className="flex items-center gap-1.5">
             <Database size={10} className="text-primary opacity-80" aria-hidden="true" />
             <span>{t.database}: <span className="text-foreground/70 font-bold">{tenant.dbPrefix || '---'}</span></span>
           </div>
           <div className="flex items-center gap-1.5">
             <Layers size={10} className="text-primary opacity-80" aria-hidden="true" />
             <span>{t.spaces}: <span className="text-foreground/70 font-bold">{tenant.spaceCount !== undefined ? tenant.spaceCount : 0}</span></span>
           </div>
        </div>
      </div>

      {/* Consola de Ejecución Fragmentada (Split Action Block) */}
      <div className="flex gap-2 h-14 z-10">
         {/* Acción Maestra */}
         <Link 
           href={`/${locale}/admin/branding?tenantId=${tenant.tenantId}`}
           className="flex-1 flex items-center justify-center bg-transparent border border-primary/40 hover:border-primary hover:bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest font-black transition-all rounded-none active:scale-[0.98]"
         >
           <Palette size={14} className="mr-2" aria-hidden="true" />
           Branding
         </Link>

         {/* Bloque de Operaciones Secundarias */}
         <Link 
           href={`/${locale}/admin/spaces?tenantId=${tenant.tenantId}`}
           className="w-14 h-full flex items-center justify-center border border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 rounded-none"
           aria-label="Manage space hierarchy"
           title="Manage Space Hierarchy"
         >
           <Layers size={14} aria-hidden="true" />
         </Link>
         
         <Link 
           href={`/${locale}/admin/audit?tenantId=${tenant.tenantId}`}
           className="w-14 h-full flex items-center justify-center border border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 rounded-none"
           aria-label="View audit logs"
           title="Audit Logs & Telemetry"
         >
           <ShieldCheck size={14} aria-hidden="true" />
         </Link>
         
         <button 
           aria-label={t.actions.edit}
           onClick={() => onEdit(tenant)}
           className="w-14 h-full flex items-center justify-center border border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 rounded-none"
           title="Edit Details"
         >
           <Edit3 size={14} aria-hidden="true" />
         </button>
         
         <button 
           aria-label={t.actions.delete}
           onClick={() => onDelete(tenant._id?.toString() || '')}
           className="w-14 h-full flex items-center justify-center border border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 rounded-none hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500"
           title="Delete Organization"
         >
           <Trash2 size={14} aria-hidden="true" />
         </button>
      </div>
    </div>
  )
}
