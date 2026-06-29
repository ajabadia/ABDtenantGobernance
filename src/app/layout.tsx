/**
 * @purpose Renderiza el layout raíz para la aplicación de Administración de Gobernanza ABDtenant, proporcionando manejo de ubicación y sesión, personalización del tema y estilos de marca.
 * @purpose_en Renders the root layout for the ABDtenantGobernance application, providing locale and session management, theme customization, and branding styles.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:8,sig:ms5fh0
 * @lastUpdated 2026-06-24T10:34:15.653Z
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getIndustrialSession, BrandingStyles, configureLogger } from "@ajabadia/satellite-sdk";
import { SessionProvider } from "@ajabadia/satellite-sdk/client";

configureLogger({
  endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs',
  token: process.env.LOGS_SECRET_TOKEN,
  appId: 'ABDGovernance',
});
import { ThemeProvider } from "@ajabadia/ecosystem-widgets";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABD Governance | Control Plane",
  description: "High-performance platform for tenant governance and system monitoring.",
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await getIndustrialSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <BrandingStyles />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider initialSession={session}>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
