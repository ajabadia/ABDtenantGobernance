/**
 * @purpose Renderiza la página de administración del Sandbox de QA para inyectar JWTs, saltar de rol y simular licencias.
 * @purpose_en Renders the QA Sandbox admin page to inject JWTs, perform role shifting, and simulate licenses.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { TenantService } from '@/services/tenant/tenant-service';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Terminal } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { SandboxForm } from '@/components/admin/sandbox/SandboxForm';

export const revalidate = 0;

export default async function AdminSandboxPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ tenantId?: string; contextId?: string; contextType?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sParams = await searchParams;
  const tAdmin = await getTranslations('admin');

  // 1. Enforce SUPER_ADMIN access
  const user = await ensureIndustrialAccess('SUPER_ADMIN');

  const queryStr = Object.entries(sParams)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const querySuffix = queryStr ? `?${queryStr}` : '';

  // 2. Fetch all tenants from database
  await connectDB();
  const allTenants = await TenantService.getAllTenants();

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <AdminPageHeader
          icon={Terminal}
          breadcrumb={<>{tAdmin('controlConsole')} • SANDBOX</>}
          title={locale === 'es' ? 'Simulador Sandbox QA' : 'QA Sandbox Simulator'}
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
          description={
            locale === 'es' 
              ? 'Consola local para inyectar JWTs de prueba, simular desconexión de licencias y saltos de rol instantáneos para QA.'
              : 'Local console to inject test JWTs, simulate license disconnection, and perform instant role shifts for QA.'
          }
        />

        {/* Sandbox Form */}
        <SandboxForm 
          tenants={JSON.parse(JSON.stringify(allTenants))}
          currentUserId={user.id}
          locale={locale}
        />
      </div>
    </main>
  );
}
