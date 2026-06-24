"use client"

/**
 * @purpose Rendra un componente de tarjeta para mostrar y gestionar información de inquilinos, incluyendo acciones como editar y eliminar.
 * @purpose_en Renders a card component for displaying and managing tenant information, including actions like editing and deleting.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:38r99q
 * @lastUpdated 2026-06-23T21:45:47.877Z
 */

import { Building2, Globe, Database, Trash2, Edit3, Palette, Layers, ShieldCheck, Shield, Users } from 'lucide-react'
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

const actionBtnClass = "flex-1 h-full flex items-center justify-center border border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 rounded-none";

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
             {'ID:'} <span className="font-mono text-primary font-bold">{tenant.tenantId}</span>
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

      {/* Consola de Ejecución — Distribución Uniforme */}
      <div className="grid grid-cols-7 gap-1.5 h-12 z-10">
         {/* Branding */}
         <Link 
           href={`/${locale}/admin/branding?tenantId=${tenant.tenantId}`}
           className={actionBtnClass}
           aria-label="Configurar Branding visual"
           title="Branding Visual"
         >
           <Palette size={14} aria-hidden="true" />
         </Link>

         {/* Espacios */}
         <Link 
           href={`/${locale}/admin/spaces?tenantId=${tenant.tenantId}`}
           className={actionBtnClass}
           aria-label="Gestionar jerarquía de espacios"
           title="Espacios"
         >
           <Layers size={14} aria-hidden="true" />
         </Link>

         {/* Permisos y Grupos */}
         <Link 
           href={`/${locale}/admin/permissions?tenantId=${tenant.tenantId}`}
           className={actionBtnClass}
           aria-label="Gestionar grupos y políticas de permisos"
           title="Grupos y Permisos ABAC"
         >
           <Shield size={14} aria-hidden="true" />
         </Link>

         {/* Usuarios */}
         <Link 
           href={`/${locale}/admin/users?tenantId=${tenant.tenantId}`}
           className={actionBtnClass}
           aria-label="Gestionar usuarios del tenant"
           title="Usuarios"
         >
           <Users size={14} aria-hidden="true" />
         </Link>
         
         {/* Auditoría */}
         <Link 
           href={`/${locale}/admin/audit?tenantId=${tenant.tenantId}`}
           className={actionBtnClass}
           aria-label="Ver logs de auditoría"
           title="Auditoría y Telemetría"
         >
           <ShieldCheck size={14} aria-hidden="true" />
         </Link>
         
         {/* Editar */}
         <button 
           aria-label={t.actions.edit}
           onClick={() => onEdit(tenant)}
           className={actionBtnClass}
           title="Editar Tenant"
         >
           <Edit3 size={14} aria-hidden="true" />
         </button>
         
         {/* Eliminar */}
         <button 
           aria-label={t.actions.delete}
           onClick={() => onDelete(tenant._id?.toString() || '')}
           className={`${actionBtnClass} hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500`}
           title="Eliminar Organización"
         >
           <Trash2 size={14} aria-hidden="true" />
         </button>
      </div>
    </div>
  )
}

