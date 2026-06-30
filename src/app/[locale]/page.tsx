/**
 * @purpose Renderiza la página principal del ABDtenantGobernance, incluyendo un encabezado heroico, botón de inicio de sesión y sección de capacidades del sistema.
 * @purpose_en Renders the home page for the ABDtenantGobernance application, including a hero header, login button, and system capabilities section.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:bam2hu
 * @lastUpdated 2026-06-30T11:18:21.969Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, ShieldCheck, Palette, Layers } from 'lucide-react';
import { HeroHeader, LandingPageLayout, SubtleLoginButton } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { redirect } from 'next/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getIndustrialSession();

  if (session.authenticated && session.user) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations('common');
  const h = await getTranslations('home');

  return (
    <LandingPageLayout>
      <HeroHeader
        statusText={h('status')}
        title={
          <>{h('abdTitle')} <span className="text-primary">{'Governance'}</span></>
        }
        description={h('tagline')}
      />

      <main className="flex flex-col gap-16">
        <SubtleLoginButton
          href={`/${locale}/admin`}
          label={h('accessControlPlane')}
          hint={locale === 'es'
            ? 'Inicie sesión con sus credenciales federadas de ABDAuth'
            : 'Sign in utilizing your federated credentials from ABDAuth'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Marca Blanca en Caliente' : 'Hot White-Labeling'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Generación dinámica de variables HSL y YIQ Contrast en el servidor de Next.js, logrando inyección directa instantánea.'
                : 'Dynamic generation of HSL and YIQ Contrast custom tokens rendered during server-side SSR loops to secure zero visual flicker.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Jerarquías de Espacio' : 'Space Hierarchies'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Aislamiento lógico perimetral a nivel de repositorio y materialized paths recursivos para aulas y organizaciones.'
                : 'Logic boundaries and role isolation calculated inside data repositories with recursive materialized subdivisions.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Seguridad Criptográfica' : 'Cryptographic Security'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Cifrado simétrico AES-256-CBC nativo de credenciales, tokens y configuraciones de cobro persistidos en base de datos.'
                : 'Symmetric AES-256-CBC envelope encryption protecting customer configuration and sensitive billing fields in the database.'}
            </p>
          </div>

        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: 'Control Plane', value: h('version') },
          { label: 'Estilo', value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
