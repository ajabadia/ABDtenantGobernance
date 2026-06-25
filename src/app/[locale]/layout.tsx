/**
 * @purpose Renderiza el layout para una aplicación de gobernanza de inquilinos, incluyendo navegación lateral, configuraciones del sistema, selector de inquilino, paleta de comandos y notificaciones emergentes.
 * @purpose_en Renders the layout for a tenant governance application, including sidebar navigation, system settings, tenant selector, command palette, and toast notifications.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:11,sig:1xtem0w
 * @lastUpdated 2026-06-23T21:43:42.121Z
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { GovernanceCommandPalette } from "@/components/layout/GovernanceCommandPalette";
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';;
import { resolveTenantBranding } from "@ajabadia/satellite-sdk";

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
    <NextIntlClientProvider messages={messages} locale={locale}>
      <NextTopLoader
        color="hsl(var(--primary))"
        height={2}
        showSpinner={false}
        zIndex={45}
        speed={200}
      />
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session.user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
        <GovernanceCommandPalette />

        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </div>
    </NextIntlClientProvider>
  );
}
