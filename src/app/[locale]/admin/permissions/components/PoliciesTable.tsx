'use client';

/**
 * @purpose Renderiza una tabla que muestra las políticas con sus efectos, recursos, acciones y estado.
 * @purpose_en Renders a table displaying policies with their effects, resources, actions, and status.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:zgfx8r
 * @lastUpdated 2026-06-23T20:38:39.655Z
 */

import { useTranslations } from 'next-intl';

interface Policy {
  _id: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive: boolean;
}

export function PoliciesTable({ policies, loading }: { policies: Policy[]; loading: boolean; }) {
  const t = useTranslations('admin.permissions.table');

  return (
    <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
      <table className="w-full text-left divide-y divide-border/60">
        <thead className="bg-secondary/40">
        <tr>
          <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('policy')}</th>
          <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('effect')}</th>
          <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('resources')}</th>
          <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('actions')}</th>
          <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('status')}</th>
        </tr>
      </thead>
        <tbody className="divide-y divide-border/60">
          {loading ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {t('loading')}
              </td>
            </tr>
          ) : policies.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {t('noPolicies')}
              </td>
            </tr>
          ) : (
            policies.map(p => (
              <tr key={p._id} className="hover:bg-primary/[0.02] transition-colors duration-150">
                <td className="px-6 py-4">
                  <span className="text-xs font-sans text-foreground/90 font-bold block">{p.name}</span>
                  {p.description && (
                    <span className="font-mono text-[9px] text-muted-foreground">{p.description}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`font-mono text-[10px] font-black uppercase px-2 py-1 border ${
                    p.effect === 'ALLOW'
                      ? 'border-green-500/30 text-green-400 bg-green-500/5'
                      : 'border-red-500/30 text-red-400 bg-red-500/5'
                  }`}>
                    {p.effect}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    {p.resources.slice(0, 2).map((r, i) => (
                      <span key={i} className="font-mono text-[9px] text-muted-foreground">{r}</span>
                    ))}
                    {p.resources.length > 2 && (
                      <span className="font-mono text-[9px] text-muted-foreground/50">{t('more', { count: p.resources.length - 2 })}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase">
                    {p.actions.join(', ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-mono text-[9px] uppercase font-black px-2 py-1 border ${
                    p.isActive
                      ? 'border-green-500/30 text-green-400 bg-green-500/5'
                      : 'border-border text-muted-foreground'
                  }`}>
                    {p.isActive ? t('active') : t('inactive')}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
