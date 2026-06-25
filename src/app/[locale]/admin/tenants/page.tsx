/**
 * @purpose Renderiza la página administrativa para el manejo de inquilinos, incluyendo una lista y interfaz de gestión.
 * @purpose_en Renders the admin page for managing tenants, including a list and management interface.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:10,sig:1vgilbd
 * @lastUpdated 2026-06-23T21:42:51.406Z
 */

import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantManagementContainer } from '@/components/admin/tenants/TenantManagementContainer';
import { connectDB } from '@ajabadia/satellite-sdk/db';;
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { TenantManagementTranslations } from '@/components/admin/tenants/types';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@ajabadia/styles';
export default async function TenantsAdminPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  
  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';
  
  // 🛡️ Ecosystem Identity Guard with redirect fallback
  try {
    await ensureIndustrialAccess('ADMIN');
  } catch (e) {
    // If access check fails, send user back to admin home
    redirect(`/${locale}/admin${querySuffix}`);
  }
  
  await connectDB();
  const initialTenants = await TenantService.getAllTenants();
  
  const t = await getTranslations('dashboard.tenants');
  const tAdmin = await getTranslations('admin');
  
  // Map translations to typesafe interface
  const translations: TenantManagementTranslations = {
    title: t('title'),
    subtitle: t('subtitle'),
    new_tenant: t('new_tenant'),
    edit_tenant: t('edit_tenant'),
    register_tenant: t('register_tenant'),
    industry: t('industry'),
    database: t('database'),
    spaces: t('spaces'),
    confirm_delete: t('confirm_delete'),
    edit_action: t('edit_action'),
    delete_action: t('delete_action'),
    orchestrator_version: t('orchestrator_version'),
    name_label: t('name_label'),
    id_label: t('id_label'),
    isolation_label: t('isolation_label'),
    status_label: t('status_label'),
    industries: {
      industrial: t('industries.industrial'),
      energy: t('industries.energy'),
      logistics: t('industries.logistics'),
      security: t('industries.security'),
    },
    actions: {
      edit: t('actions.edit'),
      delete: t('actions.delete'),
      save: t('actions.save'),
      cancel: t('actions.cancel'),
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header Navigation alineado al 100% con el Manual de Estilos */}
        <AdminPageHeader
          icon={Building2}
          breadcrumb={<>{tAdmin('controlConsole')} • {t('title')}</>}
          title={t('title')}
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
          description={t('subtitle')}
        />

        {/* Client Management Container */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <TenantManagementContainer 
            initialTenants={JSON.parse(JSON.stringify(initialTenants))} 
            translations={translations} 
          />
        </div>

      </div>
    </main>
  );
}
