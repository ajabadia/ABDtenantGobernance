import { Palette, Layers, Building2, ShieldCheck, Shield, ShoppingBag, GraduationCap } from 'lucide-react';
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
    </div>
  )
}
