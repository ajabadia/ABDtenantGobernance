import React from 'react';
import { ensureIndustrialAccess } from '@/lib/session';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantBrandingForm } from '@/components/admin/TenantBrandingForm';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import connectDB from '@/lib/database/mongodb';
import { AdminPageHeader } from '@abd/styles';

export const revalidate = 0; // Evitar el cacheado estático de la página administrativa

export default async function AdminBrandingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tenantId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tAdmin = await getTranslations('admin');

  // 1. Garantizar acceso seguro y ROL mínimo de administrador
  const user = await ensureIndustrialAccess('ADMIN');
  
  const { tenantId } = await searchParams;
  const targetTenantId = tenantId || user.tenantId;
  
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
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={<>Ajusta los parámetros visuales para <span className="text-primary font-bold">{tenantConfig.name}</span>. Los cambios impactan a todos sus usuarios de forma instantánea.</>}
        />

        {/* Formulario de personalización premium con Live Preview */}
        <TenantBrandingForm 
          tenantId={targetTenantId} 
          initialBranding={tenantConfig.branding} 
          allTenants={JSON.parse(JSON.stringify(allTenants))}
        />
      </div>
    </main>
  );
}
