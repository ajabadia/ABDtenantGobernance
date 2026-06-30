'use client';

/**
 * @purpose Gestiona un componente de configuración del sistema que permite a los usuarios cambiar la ubicación, el tema y manejar la autenticación.
 * @purpose_en Renders a system settings component that allows users to change locale, theme, and handle authentication.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1l4v9sy
 * @lastUpdated 2026-06-30T05:49:50.901Z
 */

import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SystemSettings as SharedSystemSettings } from '@ajabadia/ecosystem-widgets';
import { setLocaleCookie } from '@ajabadia/i18n';

interface SystemSettingsProps {
  isAuthenticated?: boolean;
}

export function SystemSettings({ isAuthenticated = false }: SystemSettingsProps) {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLoc: string) => {
    setLocaleCookie(newLoc);
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: newLoc });
  };

  const authUrl = process.env.NEXT_PUBLIC_AUTH_PROVIDER_URL || 'http://localhost:5001';

  const handleLogin = () => {
    window.location.href = `${authUrl}/login`;
  };

  const handleLogout = () => {
    window.location.href = authUrl;
  };

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={handleLocaleChange}
      theme={theme}
      onThemeChange={setTheme}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
      versionSignature="ABD_GOBERNANZA_V0.1"
    />
  );
}
