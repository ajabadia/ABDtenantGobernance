/**
 * @purpose Renderiza la página de conectores administrativos con un encabezado y una interfaz de cliente interactiva para gestionar conectores.
 * @purpose_en Renders the admin connectors page with a header and a client interactive dashboard for managing connectors.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:8,sig:bxszad
 * @lastUpdated 2026-06-23T20:37:21.023Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';;
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Cloud } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { listConnectorsAction } from '@/actions/connector-actions';
import { ConnectorsClient } from '@/components/admin/connectors/ConnectorsClient';

export const revalidate = 0; // Avoid static compilation caching of admin page

export default async function AdminConnectorsPage({
  searchParams,
  params
}: {
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const tAdmin = await getTranslations('admin');
  const tConnectors = await getTranslations('connectors');

  // 1. Authenticate with ADMIN minimum permissions
  const user = await ensureIndustrialAccess('ADMIN');
  const targetTenantId = sParams.tenantId || user.tenantId;

  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

  // 2. Fetch active connectors for the tenant
  await connectDB();
  const initialConnectors = await listConnectorsAction(targetTenantId);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Technical Header */}
        <AdminPageHeader
          icon={Cloud}
          breadcrumb={<>{tAdmin('controlConsole')} • {tConnectors('title')}</>}
          title={tConnectors('title')}
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
          description={tConnectors('subtitle')}
        />

        {/* Client Interactive Dashboard Container */}
        <div className="bg-card border border-border p-6 rounded-none shadow-sm">
          <ConnectorsClient 
            tenantId={targetTenantId} 
            initialConnectors={JSON.parse(JSON.stringify(initialConnectors))} 
          />
        </div>
      </div>
    </main>
  );
}
