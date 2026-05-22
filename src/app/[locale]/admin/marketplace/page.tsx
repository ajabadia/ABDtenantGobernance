import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { ShoppingBag } from 'lucide-react';
import { AdminPageHeader, Footer } from '@abd/styles';
import { fetchMarketplaceData, fetchAllPendingRequests } from './actions';
import { MarketplaceGrid } from './components/MarketplaceGrid';
import { RequestsPanel } from './components/RequestsPanel';

export default async function MarketplacePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.marketplace');
  
  // 🛡️ Ensure minimum ADMIN access
  const user = await ensureIndustrialAccess('ADMIN');
  
  const targetTenantId = (user.role === 'SUPER_ADMIN' && sp?.tenantId) 
    ? sp.tenantId 
    : user.tenantId;

  // Fetch tenant licensing info
  const marketplaceData = await fetchMarketplaceData(targetTenantId);
  
  // Fetch all pending requests globally if user is SUPER_ADMIN
  let superAdminRequests: { _id: string; tenantId: string; appId: string; requestedBy: string; comments?: string; createdAt: Date }[] = [];
  if (user.role === 'SUPER_ADMIN') {
    superAdminRequests = await fetchAllPendingRequests();
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12 px-6 md:px-12 relative z-10" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader
          icon={ShoppingBag}
          breadcrumb={<>{t('title')} • DASHBOARD</>}
          title={t('title')}
          description={t('subtitle')}
          tenantId={targetTenantId}
        />

        {user.role === 'SUPER_ADMIN' && superAdminRequests.length > 0 && (
          <RequestsPanel 
            requests={superAdminRequests} 
            locale={locale}
          />
        )}

        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-md">
          <MarketplaceGrid 
            tenantId={targetTenantId}
            allowedApps={marketplaceData.allowedApps} 
            pendingRequests={marketplaceData.pendingRequests}
            locale={locale}
          />
        </div>

        <Footer label="ABD suite • Marketplace v1.0.0" opacity="high" />
      </div>
    </main>
  );
}
