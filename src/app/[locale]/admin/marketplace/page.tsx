import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { AdminPageHeader, Footer } from '@abd/styles';
import { fetchMarketplaceData, fetchAllPendingRequests } from './actions';
import { MarketplaceGrid } from './components/MarketplaceGrid';
import { RequestsPanel } from './components/RequestsPanel';
import Link from 'next/link';

export default async function MarketplacePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.marketplace');
  
  // 🛡️ Ensure minimum ADMIN access
  const user = await ensureIndustrialAccess('ADMIN');
  
  const targetTenantId = (user.role === 'SUPER_ADMIN' && sp?.tenantId) 
    ? sp.tenantId 
    : user.tenantId;

  const queryStr = Object.entries(sp)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

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

        <Footer label="ABD suite • Marketplace v1.0.0" />
      </div>
    </main>
  );
}
