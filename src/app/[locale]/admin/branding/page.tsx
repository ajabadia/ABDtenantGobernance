/**
 * @purpose Renderiza la página de branding administrativa para un inquilino, incluyendo una forma para personalizar el branding y la configuración de roles.
 * @purpose_en ** Renders the admin branding page for a tenant, including a form for customizing branding and role customization.
 * @refactorable ** true (contains too many state variables and UI parts)
 * @classification ** UI Component
 * @complexity ** Medium
 * @fingerprint exports:2,imports:9,sig:8we71d
 * @lastUpdated 2026-06-23T20:37:15.468Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantBrandingForm } from '@/components/admin/TenantBrandingForm';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import { connectDB } from '@ajabadia/satellite-sdk';
import { AdminPageHeader } from '@ajabadia/styles';

export const revalidate = 0; // Evitar el cacheado estático de la página administrativa

export default async function AdminBrandingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const tAdmin = await getTranslations('admin');

  // 1. Garantizar acceso seguro y ROL mínimo de administrador
  const user = await ensureIndustrialAccess('ADMIN');
  
  const targetTenantId = sParams.tenantId || user.tenantId;

  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';
  
  // 2. Recuperar la configuración de marca viva desde MongoDB
  await connectDB();
  const tenantConfig = await TenantService.getConfig(targetTenantId);
  const allTenants = await TenantService.getAllTenants();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Cabecera Técnica de acuerdo con la guía de estilo */}
        <AdminPageHeader
          icon={Palette}
          breadcrumb={<>{tAdmin('controlConsole')} • {tAdmin('brandCardTitle')}</>}
          title={tAdmin('brandCardTitle')}
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
          description={<>{tAdmin.rich('brandCardDescFull', { tenantName: tenantConfig.name, tenant: (chunks) => <span className="text-primary font-bold">{chunks}</span> })}</>}
        />

        {/* Formulario de personalización premium con Live Preview */}
        <TenantBrandingForm 
          key={targetTenantId}
          tenantId={targetTenantId} 
          initialBranding={tenantConfig.branding} 
          initialRoleCustomization={tenantConfig.roleCustomization}
          allTenants={JSON.parse(JSON.stringify(allTenants))}
        />
      </div>
    </main>
  );
}
