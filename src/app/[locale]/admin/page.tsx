import { getTranslations } from 'next-intl/server';
import { Separator } from '@/components/ui/separator';
import { ensureIndustrialAccess } from '@/lib/session';
import { LayoutDashboard, Palette, Layers, Building2 } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';

/**
 * 🛰️ Central Admin Governance Portal Page (Federated Server Component)
 * Rediseñado específicamente para la Gobernanza de Tenants y Marca Blanca.
 */
export default async function AdminPortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('admin');
  const ap = await getTranslations('adminPortal');

  // 🛡️ Ecosystem Identity Guard
  // Only users authenticated via ABDAuth with ADMIN privileges can enter.
  const user = await ensureIndustrialAccess('ADMIN');

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-8 h-8 text-primary" aria-hidden="true" />
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                ABD <span className="text-primary">{ap('gobernanza')}</span>
              </h1>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono ml-12">
              Consola de Control del Tenant: <span className="text-primary font-bold">{user.tenantId}</span>
            </p>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls Column (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Card 1: Visual Branding Customizer */}
              <DashboardActionCard 
                icon={Palette}
                category={t('visual')}
                title={t('brandCardTitle')}
                description={t('brandCardDesc')}
                footerLabel={t('yiqContrast')}
                footerValue={ap('activo')}
                buttonText={t('brandCardBtn')}
                href={`/${locale}/admin/branding`}
              />

              {/* Card 2: Space Hierarchy Management */}
              <DashboardActionCard 
                icon={Layers}
                category={t('estructura')}
                title={t('spaceCardTitle')}
                description={t('spaceCardDesc')}
                footerLabel={t('materializedPaths')}
                footerValue={ap('activo')}
                buttonText={t('spaceCardBtn')}
                href={`/${locale}/admin/spaces`}
              />

              {/* Card 3: Tenant Governance Panel */}
              <DashboardActionCard 
                icon={Building2}
                category={t('organizaciones')}
                title={t('tenantCardTitle')}
                description={t('tenantCardDesc')}
                footerLabel={t('multiTenancy')}
                footerValue={ap('activo')}
                buttonText={t('tenantCardBtn')}
                href={`/${locale}/admin/tenants`}
              />

            </div>
          </div>

          {/* System Telemetry Sidebar (1/3 width) */}
          <SystemTelemetryPanel 
            userId={user.id}
            userRole={user.role}
            locale={locale}
          />

        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 flex flex-col items-center gap-6 text-muted-foreground/40 font-mono text-[9px] uppercase tracking-[0.3em]" role="contentinfo">
          <Separator className="bg-border" aria-hidden="true" />
          <span>{t('footer')}</span>
        </footer>

      </div>
    </main>
  );
}
