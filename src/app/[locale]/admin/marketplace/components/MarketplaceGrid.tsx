'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Activity, Shield, BrainCircuit, Sparkles, CheckCircle2, Clock, Lock } from 'lucide-react';
import { RequestLicenseModal } from './RequestLicenseModal';

interface MarketplaceGridProps {
  tenantId: string;
  allowedApps: string[];
  pendingRequests: { appId: string; status: string; createdAt: Date }[];
  locale: string;
}

export function MarketplaceGrid({ tenantId, allowedApps, pendingRequests, locale }: MarketplaceGridProps) {
  const t = useTranslations('admin.marketplace');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const isPending = (appId: string) => pendingRequests.some(req => req.appId === appId && req.status === 'PENDING');
  const isLicensed = (appId: string) => allowedApps.includes(appId);

  const modules = [
    {
      id: 'logs',
      icon: Activity,
      name: t('modules.logs.name'),
      desc: t('modules.logs.desc'),
      status: 'LICENSED', // Core is always licensed
      isCore: true
    },
    {
      id: 'gobernanza',
      icon: Shield,
      name: t('modules.gobernanza.name'),
      desc: t('modules.gobernanza.desc'),
      status: 'LICENSED', // Core is always licensed
      isCore: true
    },
    {
      id: 'quiz',
      icon: BrainCircuit,
      name: t('modules.quiz.name'),
      desc: t('modules.quiz.desc'),
      status: isLicensed('quiz') ? 'LICENSED' : (isPending('quiz') ? 'PENDING' : 'AVAILABLE'),
      isCore: false
    },
    {
      id: 'rag',
      icon: Sparkles,
      name: t('modules.rag.name'),
      desc: t('modules.rag.desc'),
      status: 'COMING_SOON',
      isCore: false
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.id} 
              className={`relative flex flex-col p-6 rounded-xl border transition-all duration-300
                ${mod.status === 'LICENSED' ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:border-primary/30'}
                ${mod.status === 'COMING_SOON' ? 'opacity-70 grayscale' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${mod.status === 'LICENSED' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {mod.status === 'LICENSED' && (
                  <span className="flex items-center text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('statusLicensed')}
                  </span>
                )}
                {mod.status === 'PENDING' && (
                  <span className="flex items-center text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 mr-1" />
                    {t('statusPending')}
                  </span>
                )}
                {mod.status === 'COMING_SOON' && (
                  <span className="flex items-center text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3 mr-1" />
                    {t('statusComingSoon')}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold mb-2">{mod.name}</h3>
              <p className="text-sm text-muted-foreground flex-grow mb-6">{mod.desc}</p>

              {!mod.isCore && mod.status === 'AVAILABLE' && (
                <button aria-label={t('requestTitle')}
                  onClick={() => setSelectedApp(mod.id)}
                  className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  {t('requestTitle')}
                </button>
              )}
              {!mod.isCore && mod.status === 'PENDING' && (
                <button disabled className="w-full py-2 px-4 rounded-md bg-yellow-500/20 text-yellow-600 font-semibold cursor-not-allowed text-sm">
                  {t('statusPending')}
                </button>
              )}
              {mod.isCore && (
                <div className="w-full py-2 px-4 rounded-md bg-muted/50 text-muted-foreground text-center font-medium text-sm">
                  Core Module
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedApp && (
        <RequestLicenseModal 
          appId={selectedApp} 
          tenantId={tenantId}
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </>
  );
}
