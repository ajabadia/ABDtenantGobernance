import React from 'react';
import { ensureIndustrialAccess } from '@/lib/session';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantBrandingForm } from '@/components/admin/TenantBrandingForm';
import connectDB from '@/lib/database/mongodb';

export const revalidate = 0; // Evitar el cacheado estático de la página administrativa

export default async function AdminBrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  // 1. Garantizar acceso seguro y ROL mínimo de administrador
  const user = await ensureIndustrialAccess('ADMIN');
  
  const { tenantId } = await searchParams;
  const targetTenantId = tenantId || user.tenantId;
  
  // 2. Recuperar la configuración de marca viva desde MongoDB
  await connectDB();
  const tenantConfig = await TenantService.getConfig(targetTenantId);
  const allTenants = await TenantService.getAllTenants();

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">
            Consola de Control • {tenantConfig.name}
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
            Marca Blanca de Satélites
          </h1>
          <p className="text-sm text-muted-foreground">
            Ajusta los parámetros visuales para <span className="text-primary font-bold">{tenantConfig.name}</span>. Los cambios impactan a todos sus usuarios de forma instantánea.
          </p>
        </div>

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
