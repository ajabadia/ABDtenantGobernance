/**
 * @purpose Renderiza el layout para una aplicación de gobernanza de inquilinos, incluyendo navegación lateral, configuraciones del sistema, seleccionador de inquilino, paleta de comandos y notificaciones emergentes.
 * @purpose_en Renders the layout for a tenant governance application, including sidebar navigation, system settings, tenant selector, command palette, and toast notifications.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:8,sig:12a2r9w
 * @lastUpdated 2026-06-30T05:49:47.364Z
 */

import { getMessages } from "next-intl/server";
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolveTenantBranding } from "@ajabadia/satellite-sdk";
import { AppShellLayout } from "@ajabadia/ecosystem-widgets";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { GovernanceCommandPalette } from "@/components/layout/GovernanceCommandPalette";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const session = await getIndustrialSession();
  const branding = await resolveTenantBranding();

  return (
    <AppShellLayout
      locale={locale}
      messages={messages}
      sidebarNavigation={
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session.user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
      }
      commandPalette={<GovernanceCommandPalette />}
    >
      {children}
    </AppShellLayout>
  );
}
