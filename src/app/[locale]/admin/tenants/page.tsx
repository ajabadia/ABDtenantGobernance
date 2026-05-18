import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantManagementContainer } from '@/components/admin/tenants/TenantManagementContainer';
import connectDB from '@/lib/database/mongodb';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { TenantManagementTranslations } from '@/components/admin/tenants/types';

export default async function TenantsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // 🛡️ Ecosystem Identity Guard
  await ensureIndustrialAccess('ADMIN');
  
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
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-col gap-2">
            {/* Tag Monospace de Ubicación (Breadcrumb/Ruta) de acuerdo con la guía de estilo */}
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-primary animate-pulse" aria-hidden="true" />
              {tAdmin('controlConsole')} • {t('title')}
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
                {t('title')}
              </h1>
            </div>
            
            {/* Subtítulo descriptivo en Geist Sans, tamaño normal y sentence-case */}
            <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </header>

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
