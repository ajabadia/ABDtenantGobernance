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
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin`}
              className="p-2 bg-secondary/20 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              aria-label="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase italic text-foreground leading-none">
                  {t('title')}
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

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
