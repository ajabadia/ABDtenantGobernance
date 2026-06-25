/**
 * @purpose Renders a grid of action cards for the admin dashboard, each card representing different administrative actions or settings.

Se renderiza una grilla de tarjetas de acción para el panel administrativo, cada tarjeta representando diferentes acciones o configuraciones administrativas.
 * @purpose_en Renders a grid of action cards for the admin dashboard, each card representing different administrative actions or settings.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:i8dep6
 * @lastUpdated 2026-06-23T21:44:51.271Z
 */

import { Palette, Layers, Building2, ShieldCheck, Shield, ShoppingBag, GraduationCap, Cloud, Terminal, ShieldAlert } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';

interface DashboardCardsGridProps {
  locale: string;
  tenantQuery: string;
  adminT: (key: string) => string;
  portalT: (key: string) => string;
}

export function DashboardCardsGrid({ locale, tenantQuery, adminT, portalT }: DashboardCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
      <DashboardActionCard
        icon={Building2}
        category={adminT('organizaciones')}
        title={adminT('tenantCardTitle')}
        description={adminT('tenantCardDesc')}
        footerLabel={adminT('multiTenancy')}
        footerValue={portalT('activo')}
        buttonText={adminT('tenantCardBtn')}
        href={`/${locale}/admin/tenants${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Palette}
        category={adminT('visual')}
        title={adminT('brandCardTitle')}
        description={adminT('brandCardDesc')}
        footerLabel={adminT('yiqContrast')}
        footerValue={portalT('activo')}
        buttonText={adminT('brandCardBtn')}
        href={`/${locale}/admin/branding${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Layers}
        category={adminT('estructura')}
        title={adminT('spaceCardTitle')}
        description={adminT('spaceCardDesc')}
        footerLabel={adminT('materializedPaths')}
        footerValue={portalT('activo')}
        buttonText={adminT('spaceCardBtn')}
        href={`/${locale}/admin/spaces${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShieldCheck}
        category={adminT('certification')}
        title={adminT('auditTitle')}
        description={adminT('auditDesc')}
        footerLabel={adminT('prodReady')}
        footerValue={portalT('activo')}
        buttonText={adminT('auditTitle')}
        href={`/${locale}/admin/audit${tenantQuery}`}
      />
      <DashboardActionCard
        icon={GraduationCap}
        category="Roles Contextuales"
        title="Roles Contextuales (Quiz)"
        description="Gestiona los roles contextuales del ecosistema de aprendizaje (CREATOR / AUDITOR) por ámbito (Space, Course, ExamConfig)."
        footerLabel="Roles CREATOR/AUDITOR"
        footerValue="Activo"
        buttonText="Gestionar Roles"
        href={`/${locale}/admin/quiz-roles${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Shield}
        category={adminT('iamGovernance')}
        title={adminT('permissionsCardTitle')}
        description={adminT('permissionsCardDesc')}
        footerLabel={adminT('abacPolicies')}
        footerValue={portalT('activo')}
        buttonText={adminT('permissionsCardBtn')}
        href={`/${locale}/admin/permissions${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShoppingBag}
        category={adminT('marketplace.title')}
        title={adminT('marketplace.title')}
        description={adminT('marketplace.subtitle')}
        footerLabel={adminT('marketplace.title')}
        footerValue={portalT('activo')}
        buttonText={adminT('marketplace.title')}
        href={`/${locale}/admin/marketplace${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Cloud}
        category={locale === 'es' ? 'Almacenamiento' : 'Storage'}
        title={locale === 'es' ? 'Proveedores de Almacenamiento' : 'Storage Providers'}
        description={locale === 'es' ? 'Configura credenciales S3, Cloudinary o Drive para la gestión documental de tu organización.' : 'Configure S3, Cloudinary or Drive credentials for document management.'}
        footerLabel={locale === 'es' ? 'Motores de Persistencia' : 'Persistence Engines'}
        footerValue={portalT('activo')}
        buttonText={locale === 'es' ? 'Configurar Proveedores' : 'Configure Providers'}
        href={`/${locale}/admin/connectors${tenantQuery}`}
      />
      <DashboardActionCard
        icon={Terminal}
        category={locale === 'es' ? 'Desarrollo / QA' : 'Development / QA'}
        title={locale === 'es' ? 'Simulador Sandbox' : 'Sandbox Simulator'}
        description={locale === 'es' ? 'Consola local para inyectar JWTs de prueba, simular desconexión de licencias y saltos de rol instantáneos.' : 'Local console to inject test JWTs, simulate license disconnection, and perform instant role shifts.'}
        footerLabel={locale === 'es' ? 'Modo Depuración' : 'Debug Mode'}
        footerValue="Activo"
        buttonText={locale === 'es' ? 'Abrir Sandbox' : 'Open Sandbox'}
        href={`/${locale}/admin/sandbox${tenantQuery}`}
      />
      <DashboardActionCard
        icon={ShieldAlert}
        category={locale === 'es' ? 'Seguridad / Privacidad' : 'Security / Privacy'}
        title={locale === 'es' ? 'GDPR y Portabilidad' : 'GDPR & Portability'}
        description={locale === 'es' ? 'Descargas cifradas en ZIP de datos de inquilinos y solicitudes de derecho al olvido (purga física).' : 'Encrypted ZIP downloads of tenant data and requests for right to be forgotten (physical purge).'}
        footerLabel={locale === 'es' ? 'Cumplimiento' : 'Compliance'}
        footerValue="Activo"
        buttonText={locale === 'es' ? 'Abrir Panel GDPR' : 'Open GDPR Panel'}
        href={`/${locale}/admin/gdpr${tenantQuery}`}
      />
    </div>
  );
}
