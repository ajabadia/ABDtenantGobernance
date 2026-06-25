'use client';

/**
 * @purpose Gestiona un componente de navegación lateral con enlaces y maneja cambios de sesión, idioma y selección de tenant.
 * @purpose_en Renders a sidebar navigation component with links and handles user session, locale changes, and tenant selection.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1z02ok0
 * @lastUpdated 2026-06-23T21:46:13.510Z
 */

import React from 'react';
import { Home, Palette, Folder, Terminal, ShieldCheck, Building, GraduationCap, Cloud, Zap, ShieldX } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SmartNavbar, buildSidebarLinks } from '@ajabadia/ecosystem-widgets';

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
  const pathname = usePathname();
  const router = useRouter();
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

  const allLinks = [
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
  ] as const;

  const links = buildSidebarLinks(allLinks, user?.role, isLoggedIn);

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  const handleLocaleChange = (newLocale: string) => {
    let domainSuffix = "";
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
      }
    }
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: newLocale });
  };

  return (
    <SmartNavbar
      session={session}
      links={links}
      logoUrl={finalLogoUrl}
      onLogout={() => { window.location.href = '/api/auth/logout'; }}
      locale={locale}
      brandName={t('appTitle') || 'ABD SYSTEM'}
      activeHref={pathname}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
      onLocaleChange={handleLocaleChange}
      appBadge="GOV"
      onSearchTrigger={() => {
        window.dispatchEvent(new CustomEvent('abd-command-palette-open'));
      }}
      translations={{
        brandFallback: t('appTitle') || 'ABD SYSTEM',
        logoutBtn: t('logout') || (locale === 'es' ? 'TERMINAR SESIÓN' : 'SIGN OUT'),
        identityProvider: locale === 'es' ? 'PROVEEDOR DE IDENTIDAD' : 'IDENTITY PROVIDER',
        statusOnline: locale === 'es' ? 'EN LÍNEA' : 'ONLINE',
        emailLabel: locale === 'es' ? 'CORREO' : 'EMAIL'
      }}
    />
  );
}
