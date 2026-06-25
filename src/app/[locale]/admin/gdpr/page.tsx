/**
 * @purpose Renderiza la página de eliminación de datos GDPR para administradores.
 * @purpose_en Renders the GDPR data purge page for administrators.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:7,sig:u0eqa2
 * @lastUpdated 2026-06-25T09:23:32.931Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { getTranslations } from 'next-intl/server';
import { ShieldX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { GdprForm } from './GdprForm';

export const revalidate = 0;

export default async function AdminGdprPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const tAdmin = await getTranslations('admin');

  await ensureIndustrialAccess('SUPER_ADMIN');

  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader
          icon={ShieldX}
          breadcrumb={<>{tAdmin('controlConsole')} • GDPR</>}
          title="GDPR Data Purge"
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
          description="Orchestrate GDPR Right to be Forgotten across all satellites. This will anonymize or delete the user's personal data in every service."
        />
        <GdprForm />
      </div>
    </main>
  );
}
