'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@abd/styles';
import { DelegationTable } from './DelegationTable';

export default function DelegationsPage() {
  const t = useTranslations('admin');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    const resolveTenant = async () => {
      const explicit = searchParams.get('tenantId');
      if (explicit) {
        setTenantId(explicit);
      } else {
        try {
          const { getIndustrialSession } = await import('@/lib/session');
          const session = await getIndustrialSession();
          if (session?.user?.tenantId) {
            setTenantId(session.user.tenantId);
          } else {
            setTenantId('academia-alfa');
          }
        } catch {
          setTenantId('academia-alfa');
        }
      }
    };
    resolveTenant();
  }, [searchParams]);

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-12 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">
        Cargando datos del tenant...
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <AdminPageHeader
          icon={Clock}
          breadcrumb={<>{t('controlConsole')} • {'DELEGACIONES'}</>}
          title="Delegación de Roles"
          backButton={
              <Link
                href={`/${locale}/admin/permissions`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Volver a Permisos"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={<>Administra los permisos temporales delegados a usuarios dentro del tenant{' '}
              <span className="text-primary font-bold">{tenantId}</span>.</>}
        />

        <DelegationTable tenantId={tenantId} />
      </div>
    </main>
  );
}
