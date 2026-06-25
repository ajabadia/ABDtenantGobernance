'use client';

/**
 * @purpose Consola interactiva de GDPR y Portabilidad para exportar datos en ZIP y ejecutar purgas físicas en cascada (derecho al olvido).
 * @purpose_en Interactive GDPR and Portability console to export data in ZIP and perform cascading physical purges.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 */

import React, { useState } from 'react';
import { 
  Download, Trash2, ShieldAlert, Check, 
  RefreshCw, AlertTriangle, FileArchive, ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';

interface Tenant {
  _id?: string;
  tenantId: string;
  name: string;
  industry: string;
  dbPrefix: string;
  isolationStrategy: string;
  active: boolean;
}

interface GdprConsoleProps {
  tenants: Tenant[];
  userRole: string;
  locale: string;
}

export function GdprConsole({ tenants, userRole, locale }: GdprConsoleProps) {
  const router = useRouter();
  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  
  // Dialog state for purge confirmation
  const purgeDialog = useConfirmDialog<{ id: string; tenantId: string }>({
    onConfirm: async (payload) => {
      if (!payload) return;
      setLoadingTenantId(payload.id);
      
      try {
        const response = await fetch(`/api/admin/tenants/${payload.id}?purge=true`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error during tenant purge');
        }
        
        toast.success(
          locale === 'es' 
            ? `Organización ${payload.tenantId} purgada completamente en cascada.` 
            : `Tenant ${payload.tenantId} completely purged in cascade.`
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error purging tenant');
      } finally {
        setLoadingTenantId(null);
      }
    }
  });

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handlePurgeClick = (id: string, tenantId: string) => {
    if (!isSuperAdmin) {
      toast.error(
        locale === 'es' 
          ? 'Solo el rol SUPER_ADMIN está autorizado a purgar físicamente organizaciones.' 
          : 'Only SUPER_ADMIN role is authorized to physically purge organizations.'
      );
      return;
    }
    purgeDialog.trigger({ id, tenantId });
  };

  return (
    <div className="flex flex-col gap-8 mt-2">
      {/* Intro info box */}
      <div className="bg-muted/5 border border-border p-6 rounded-none flex flex-col md:flex-row gap-5 items-start">
        <ShieldAlert className="w-10 h-10 text-primary shrink-0" />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {locale === 'es' ? 'Cumplimiento del Reglamento GDPR' : 'GDPR Compliance Portal'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {locale === 'es' 
              ? 'Este panel proporciona herramientas centralizadas de soberanía de datos y portabilidad. Los administradores pueden descargar instantáneamente un volcado completo de datos en formato ZIP (Portabilidad), y los Super Administradores pueden purgar de forma definitiva e irreversible la información de un inquilino en toda la red de microservicios (Derecho al Olvido).'
              : 'This panel provides centralized tools for data sovereignty and portability. Administrators can instantly download a complete dump of tenant data in ZIP format (Portability), and Super Administrators can definitively and irreversibly purge all tenant information across the microservices network (Right to be Forgotten).'}
          </p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/10 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{locale === 'es' ? 'Organización' : 'Organization'}</th>
              <th className="p-4">Tenant ID</th>
              <th className="p-4">{locale === 'es' ? 'Prefijo BD' : 'DB Prefix'}</th>
              <th className="p-4">{locale === 'es' ? 'Estado' : 'Status'}</th>
              <th className="p-4 text-right">{locale === 'es' ? 'Acciones GDPR' : 'GDPR Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {tenants.map((t) => (
              <tr key={t.tenantId} className="hover:bg-muted/5 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-foreground block">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.industry}</span>
                </td>
                <td className="p-4 font-mono text-primary font-semibold">{t.tenantId}</td>
                <td className="p-4 font-mono text-muted-foreground">{t.dbPrefix}</td>
                <td className="p-4">
                  {t.active ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] uppercase font-mono">
                      {locale === 'es' ? 'Activo' : 'Active'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[10px] uppercase font-mono">
                      {locale === 'es' ? 'Inactivo' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {/* Export ZIP */}
                  <a
                    href={`/api/admin/gdpr/export?tenantId=${t.tenantId}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-border hover:border-foreground hover:bg-muted/10 text-[10px] font-mono uppercase tracking-wider transition-all duration-200"
                    title={locale === 'es' ? 'Descargar datos ZIP' : 'Download data ZIP'}
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>{locale === 'es' ? 'Exportar ZIP' : 'Export ZIP'}</span>
                  </a>

                  {/* Purge Tenant */}
                  <button
                    onClick={() => handlePurgeClick(t._id?.toString() || '', t.tenantId)}
                    disabled={loadingTenantId !== null}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 border text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isSuperAdmin 
                        ? 'border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/5 text-rose-400 hover:text-rose-500' 
                        : 'border-border text-muted-foreground/40 cursor-not-allowed opacity-50'
                    }`}
                    title={locale === 'es' ? 'Purgar datos ( GDPR )' : 'Purge data ( GDPR )'}
                  >
                    {loadingTenantId === t._id?.toString() ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{locale === 'es' ? 'Derecho al olvido' : 'Right to forget'}</span>
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {locale === 'es' ? 'No se encontraron organizaciones.' : 'No organizations found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={purgeDialog.open}
        title="⚠️ ELIMINACIÓN DEFINITIVA GDPR"
        message={
          locale === 'es'
            ? `¿Estás seguro de que deseas purgar la organización '${purgeDialog.data?.tenantId}'? Esta acción es definitiva y eliminará físicamente las bases de datos de Quiz, Files, Logs y el registro central de Gobernanza. No se puede deshacer.`
            : `Are you sure you want to purge the organization '${purgeDialog.data?.tenantId}'? This action is definitive and will physically delete all Quiz, Files, Logs databases and the central Governance registry. It cannot be undone.`
        }
        confirmLabel={locale === 'es' ? 'PURGAR AHORA' : 'PURGE NOW'}
        cancelLabel={locale === 'es' ? 'CANCELAR' : 'CANCEL'}
        variant="danger"
        isLoading={purgeDialog.isLoading}
        onConfirm={purgeDialog.confirm}
        onCancel={purgeDialog.cancel}
      />
    </div>
  );
}
