import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { LayoutDashboard, Palette, Layers, Building2, ShieldCheck, Shield, ShoppingBag } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';
import { Footer, AdminPageHeader } from '@abd/styles';

/**
 * 🛰️ Central Admin Governance Portal Page (Federated Server Component)
 * Rediseñado específicamente para la Gobernanza de Tenants y Marca Blanca.
 */
export default async function AdminPortalPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const t = await getTranslations('admin');
  const ap = await getTranslations('adminPortal');

  // 🛡️ Ecosystem Identity Guard
  // Only users authenticated via ABDAuth with ADMIN privileges can enter.
  const user = await ensureIndustrialAccess('ADMIN');

  const activeTenantId = sParams?.tenantId || user.tenantId;
  const activeContextId = sParams?.contextId;
  const activeContextType = sParams?.contextType;

  const queryParts = [];
  if (activeTenantId) queryParts.push(`tenantId=${activeTenantId}`);
  if (activeContextId) queryParts.push(`contextId=${activeContextId}`);
  if (activeContextType) queryParts.push(`contextType=${activeContextType}`);
  const tenantQuery = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12 px-6 md:px-12 selection:bg-primary/30 relative z-10" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <AdminPageHeader
          icon={LayoutDashboard}
          breadcrumb={<>{t('controlConsole')} • DASHBOARD</>}
          title={<>{ap('abdTitle')} <span className="text-primary">{ap('gobernanza')}</span></>}
          description={<>{ap.rich('adminDescriptionFull', { tenantId: user.tenantId, tenant: (chunks) => <span className="text-primary font-bold">{chunks}</span> })}</>}
        />

        {/* System Telemetry Panel */}
        <SystemTelemetryPanel 
          userId={user.id}
          userRole={user.role}
          locale={locale}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
          
          {/* Card 1: Tenant Governance Panel */}
          <DashboardActionCard 
            icon={Building2}
            category={t('organizaciones')}
            title={t('tenantCardTitle')}
            description={t('tenantCardDesc')}
            footerLabel={t('multiTenancy')}
            footerValue={ap('activo')}
            buttonText={t('tenantCardBtn')}
            href={`/${locale}/admin/tenants${tenantQuery}`}
          />

          {/* Card 2: Visual Branding Customizer */}
          <DashboardActionCard 
            icon={Palette}
            category={t('visual')}
            title={t('brandCardTitle')}
            description={t('brandCardDesc')}
            footerLabel={t('yiqContrast')}
            footerValue={ap('activo')}
            buttonText={t('brandCardBtn')}
            href={`/${locale}/admin/branding${tenantQuery}`}
          />

          {/* Card 3: Space Hierarchy Management */}
          <DashboardActionCard 
            icon={Layers}
            category={t('estructura')}
            title={t('spaceCardTitle')}
            description={t('spaceCardDesc')}
            footerLabel={t('materializedPaths')}
            footerValue={ap('activo')}
            buttonText={t('spaceCardBtn')}
            href={`/${locale}/admin/spaces${tenantQuery}`}
          />

          {/* Card 4: Chain Auditing Logs */}
          <DashboardActionCard 
            icon={ShieldCheck}
            category={t('certification')}
            title={t('auditTitle')}
            description={t('auditDesc')}
            footerLabel={t('prodReady')}
            footerValue={ap('activo')}
            buttonText={t('auditTitle')}
            href={`/${locale}/admin/audit${tenantQuery}`}
          />

          {/* Card 5: Permission Groups (Phase 3) */}
          <DashboardActionCard 
            icon={Shield}
            category={t('iamGovernance')}
            title={t('permissionsCardTitle')}
            description={t('permissionsCardDesc')}
            footerLabel={t('abacPolicies')}
            footerValue={ap('activo')}
            buttonText={t('permissionsCardBtn')}
            href={`/${locale}/admin/permissions${tenantQuery}`}
          />

          {/* Card 6: Marketplace de Satélites */}
          <DashboardActionCard 
            icon={ShoppingBag}
            category={t('marketplace.title')}
            title={t('marketplace.title')}
            description={t('marketplace.subtitle')}
            footerLabel={t('marketplace.title')}
            footerValue={ap('activo')}
            buttonText={t('marketplace.title')}
            href={`/${locale}/admin/marketplace${tenantQuery}`}
          />

        </div>

        {/* Footer */}
        <Footer label={t('footer')} />

      </div>
    </main>
  );
}
