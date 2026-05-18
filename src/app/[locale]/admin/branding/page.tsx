import React from 'react';
import { ensureIndustrialAccess } from '@/lib/session';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantBrandingForm } from '@/components/admin/TenantBrandingForm';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import connectDB from '@/lib/database/mongodb';

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
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-col gap-2">
            {/* Tag Monospace de Ubicación (Breadcrumb/Ruta) de acuerdo con la guía de estilo */}
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
              <Palette size={14} className="text-primary animate-pulse" aria-hidden="true" />
              {tAdmin('controlConsole')} • {tAdmin('brandCardTitle')}
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              {/* Botón de Retroceso Aséptico y Táctico rounded-none */}
              <Link 
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
              
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
                {tAdmin('brandCardTitle')}
              </h1>
            </div>
            
            {/* Subtítulo descriptivo en Geist Sans, tamaño normal y sentence-case */}
            <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
              Ajusta los parámetros visuales para <span className="text-primary font-bold">{tenantConfig.name}</span>. Los cambios impactan a todos sus usuarios de forma instantánea.
            </p>
          </div>
        </header>

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
