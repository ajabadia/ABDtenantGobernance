import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';
import { DashboardCardsGrid } from '@/components/admin/dashboard/DashboardCardsGrid';
import { AdminPageHeader } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import Link from 'next/link';

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
    <main className="min-h-screen bg-background text-foreground pb-12 px-6 md:px-12 selection:bg-primary/30 relative z-10" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Back to home */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {locale === 'es' ? 'Volver a Inicio' : 'Back to Home'}
        </Link>

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

        <DashboardCardsGrid locale={locale} tenantQuery={tenantQuery} adminT={t} portalT={ap} />

        {/* Footer */}
        <GlobalFooter label={t('footer')} />

      </div>
    </main>
  );
}
