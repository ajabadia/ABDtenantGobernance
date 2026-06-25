/**
 * @purpose Renderiza la página de auditoría para un inquilino en la aplicación ABDSuite, permitiendo a los administradores visualizar y gestionar la historia de auditorías.
 * @purpose_en ** Renders the audit page for a tenant in the ABDSuite application, allowing administrators to view and manage audit history.
 * @refactorable ** true (contains too many state variables and UI parts)
 * @classification ** UI Component
 * @complexity ** Medium
 * @fingerprint exports:2,imports:11,sig:uih62y
 * @lastUpdated 2026-06-23T20:37:09.390Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { TenantService } from '@/services/tenant/tenant-service';
import { AuditHistoryPanel } from '@/components/admin/audit/AuditHistoryPanel';
import { AuditTenantSelector } from '@/components/admin/audit/AuditTenantSelector';
import { ShieldCheck, Activity, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { connectDB } from '@ajabadia/satellite-sdk/db';;
import type { Tenant } from '@/lib/schemas/tenant';
import { AdminPageHeader } from '@ajabadia/styles';

export const revalidate = 0; // Evitar el cacheado estático de la página administrativa

interface SearchParams {
  tenantId?: string;
  contextId?: string;
  contextType?: string;
}

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const { tenantId } = sParams;
  const t = await getTranslations('admin');
  
  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

  // 1. Garantizar acceso seguro y ROL mínimo de administrador
  const user = await ensureIndustrialAccess('ADMIN');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // 2. Aislamiento Estricto SaaS: Solo SuperAdmin puede auditar otros tenants vía URL
  const targetTenantId = isSuperAdmin && tenantId ? tenantId : user.tenantId;

  // Conectar a la base de datos principal
  await connectDB();

  // 3. Recuperar la configuración del tenant auditado actual
  const tenantConfig = await TenantService.getConfig(targetTenantId);

  // 4. Si es SuperAdmin, cargar todos los tenants activos del ecosistema para el selector
  let allTenants: Tenant[] = [];
  if (isSuperAdmin) {
    allTenants = await TenantService.getAllTenants();
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Encabezado Principal consistente con los estándares del Portal */}
        <AdminPageHeader
          icon={ShieldCheck}
          breadcrumb={<>{t('controlConsole')} • {tenantConfig.name}</>}
          title={t('auditTitle')}
          backButton={
              <Link 
                href={`/${locale}/admin${querySuffix}`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={t('auditDesc')}
        />

        {/* 🏢 Selector de Tenant Activo (Únicamente renderizado para SUPER_ADMIN) */}
        {isSuperAdmin && allTenants.length > 1 && (
          <AuditTenantSelector 
            currentTenantId={targetTenantId}
            allTenants={JSON.parse(JSON.stringify(allTenants))}
            locale={locale}
          />
        )}

        {/* 📊 Historial de Auditoría e Ingesta Inmutable */}
        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <Activity className="w-4.5 h-4.5" />
              </span>
              {t('auditActivityHistory')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('auditActivityDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <AuditHistoryPanel key={targetTenantId} tenantId={targetTenantId} />
          </div>
        </div>

      </div>
    </main>
  );
}
