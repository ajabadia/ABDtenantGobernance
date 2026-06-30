'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con enlaces variados según la autenticación del usuario y su rol.
 * @purpose_en Renders a sidebar navigation component with various links based on user authentication and role.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1olmeng
 * @lastUpdated 2026-06-29T22:24:58.606Z
 */

import React from 'react';
import { Home, Palette, Folder, Terminal, ShieldCheck, Building, GraduationCap, Cloud, Zap, ShieldX } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { AppSidebarNavigation, type AppSidebarLink } from '@ajabadia/ecosystem-widgets';

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname: string;
    email: string;
    role: string;
    tenantId: string;
    branding?: {
      logoUrl?: string | null;
    } | null;
  };
}

interface SidebarNavigationProps {
  session: UserSession;
  logoUrl?: string | null;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
}

export function SidebarNavigation({ session, logoUrl, tenantSelectorSlot, settingsSlot }: SidebarNavigationProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const [tenantQuery, setTenantQuery] = React.useState('');

  React.useEffect(() => {
    React.startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      const activeTenantId = params.get('tenantId');
      const activeContextId = params.get('contextId');
      const activeContextType = params.get('contextType');

      const queryParts: string[] = [];
      if (activeTenantId) queryParts.push(`tenantId=${activeTenantId}`);
      if (activeContextId) queryParts.push(`contextId=${activeContextId}`);
      if (activeContextType) queryParts.push(`contextType=${activeContextType}`);
      setTenantQuery(queryParts.length > 0 ? `?${queryParts.join('&')}` : '');
    });
  }, []);

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    {
      href: `/${tenantQuery}`,
      label: locale === 'es' ? 'Bienvenida' : 'Welcome',
      icon: <Home size={14} />
    },
    {
      href: `/admin/tenants${tenantQuery}`,
      label: locale === 'es' ? 'Gestión de Organizaciones' : 'Tenants Management',
      icon: <Building size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/branding${tenantQuery}`,
      label: locale === 'es' ? 'Marca Blanca' : 'White-Labeling',
      icon: <Palette size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/spaces${tenantQuery}`,
      label: locale === 'es' ? 'Jerarquía de Espacios' : 'Spaces Hierarchy',
      icon: <Folder size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/audit${tenantQuery}`,
      label: locale === 'es' ? 'Auditoría en Cadena' : 'Chain Auditing',
      icon: <ShieldCheck size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/quiz-roles${tenantQuery}`,
      label: locale === 'es' ? 'Roles Contextuales' : 'Contextual Roles',
      icon: <GraduationCap size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/connectors${tenantQuery}`,
      label: locale === 'es' ? 'Proveedores de Almacenamiento' : 'Storage Providers',
      icon: <Cloud size={14} />,
      requiresAdmin: true
    },
    {
      href: `/admin/sandbox${tenantQuery}`,
      label: locale === 'es' ? 'Sandbox JWT' : 'Sandbox JWT',
      icon: <Zap size={14} />,
      requiresSuperAdmin: true
    },
    {
      href: `/admin/gdpr${tenantQuery}`,
      label: locale === 'es' ? 'GDPR Purge' : 'GDPR Purge',
      icon: <ShieldX size={14} />,
      requiresSuperAdmin: true
    },
    {
      href: `/admin${tenantQuery}`,
      label: t('adminMenu'),
      icon: <Terminal size={14} />,
      requiresAdmin: true
    }
  ];

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={finalLogoUrl}
      links={allLinks}
      brandName={t('appTitle') || 'ABD Suite'}
      appBadge="GOV"
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
      translations={{
        logoutBtn: t('logout') || (locale === 'es' ? 'TERMINAR SESIÓN' : 'SIGN OUT'),
      }}
    />
  );
}
