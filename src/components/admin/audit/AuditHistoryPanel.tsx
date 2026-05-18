'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { 
  Activity, 
  Calendar, 
  User, 
  Settings, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Eye,
  Shield,
  FileCode,
  Tag
} from 'lucide-react';

interface AuditLog {
  _id?: string;
  tenantId: string;
  action: 
    | 'CREATE_SPACE' 
    | 'UPDATE_SPACE' 
    | 'DELETE_SPACE' 
    | 'MOVE_SPACE' 
    | 'UPDATE_BRANDING' 
    | 'CREATE_TENANT' 
    | 'DELETE_TENANT' 
    | 'HERITAGE_VISIBILITY';
  entityType: 'SPACE' | 'TENANT';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  createdAt?: string;
}

interface AuditHistoryPanelProps {
  tenantId: string;
}

export function AuditHistoryPanel({ tenantId }: AuditHistoryPanelProps) {
  const t = useTranslations('admin'); // Reutilizar el hook de traducción
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&limit=50`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        setLogs(data);
      } catch (err: unknown) {
        console.error(err);
        toast.error(t('audit_error_load', { defaultMessage: 'Error al conectar con el servidor.' }));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [tenantId]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE_SPACE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Layers className="w-3 h-3" />
            {t('audit_action_create_space', { defaultMessage: 'Creación Espacio' })}
          </span>
        );
      case 'UPDATE_SPACE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Layers className="w-3 h-3" />
            {t('audit_action_update_space', { defaultMessage: 'Edición Espacio' })}
          </span>
        );
      case 'MOVE_SPACE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Activity className="w-3 h-3" />
            {t('audit_action_move_space', { defaultMessage: 'Traslado Espacio' })}
          </span>
        );
      case 'HERITAGE_VISIBILITY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Shield className="w-3 h-3" />
            {t('audit_action_heritage_visibility', { defaultMessage: 'Herencia Permisos' })}
          </span>
        );
      case 'UPDATE_BRANDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Settings className="w-3 h-3" />
            {t('audit_action_update_branding', { defaultMessage: 'Marca Blanca' })}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'BRANDING') return log.action === 'UPDATE_BRANDING';
    if (filter === 'SPACES') {
      return ['CREATE_SPACE', 'UPDATE_SPACE', 'DELETE_SPACE', 'MOVE_SPACE', 'HERITAGE_VISIBILITY'].includes(log.action);
    }
    return true;
  });

  const renderDelta = (log: AuditLog) => {
    const changes = log.changedFields || {};
    const previous = log.previousState || {};

    const formatValue = (val: unknown): string => {
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    return (
      <div className="grid gap-3 p-4 rounded-lg bg-secondary/15 border border-border font-mono text-xs text-foreground/90 max-h-72 overflow-y-auto">
        <div className="flex items-center gap-1.5 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-primary font-bold">
          <FileCode className="w-3.5 h-3.5 text-primary" />
          {t('audit_delta_title', { defaultMessage: 'Comparación de Estados (Delta)' })}
        </div>
        
        {Object.keys(changes).length === 0 ? (
          <span className="text-muted-foreground italic">
            {t('audit_no_details', { defaultMessage: 'No hay detalles adicionales.' })}
          </span>
        ) : (
          Object.keys(changes).map(key => {
            if (key === 'updatedAt' || key === 'createdAt' || key === '_id') return null;
            
            const prevValue = previous[key];
            const newValue = changes[key];

            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-border/10 last:border-b-0 items-start">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 opacity-60 text-primary" />
                  {key}
                </div>
                <div className="md:col-span-2 grid gap-1.5">
                  {prevValue !== undefined && (
                    <div className="flex items-center gap-2 text-rose-500 bg-rose-500/5 px-2.5 py-0.5 rounded border border-rose-500/10 w-fit">
                      <span className="text-[9px] uppercase font-semibold tracking-wider opacity-60">
                        {t('audit_previous', { defaultMessage: 'Previo:' })}
                      </span>
                      <span className="break-all font-bold">{formatValue(prevValue)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10 w-fit">
                    <span className="text-[9px] uppercase font-semibold tracking-wider opacity-60">
                      {t('audit_new', { defaultMessage: 'Nuevo:' })}
                    </span>
                    <span className="break-all font-bold">{formatValue(newValue)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros Interactivos (Chips del Ecosistema) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button aria-label={t('audit_filter_all_label', { defaultMessage: 'Filtrar todos los logs' })}
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          {t('audit_filter_all', { defaultMessage: 'Todos los Logs' })}
        </button>
        <button aria-label={t('audit_filter_spaces_label', { defaultMessage: 'Filtrar por estructura y espacios' })}
          onClick={() => setFilter('SPACES')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'SPACES'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          {t('audit_filter_spaces', { defaultMessage: 'Estructura & Espacios' })}
        </button>
        <button aria-label={t('audit_filter_branding_label', { defaultMessage: 'Filtrar por marca blanca y branding' })}
          onClick={() => setFilter('BRANDING')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'BRANDING'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          {t('audit_filter_branding', { defaultMessage: 'Marca Blanca & Branding' })}
        </button>
      </div>

      {/* Cuerpo del Feed Cronológico */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full rounded-xl bg-secondary/10 border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-secondary/5 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
            {t('audit_no_activity', { defaultMessage: 'Sin Actividad Auditable' })}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            {t('audit_no_activity_desc', { defaultMessage: 'Los cambios de marca y organización se verán auditados aquí.' })}
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredLogs.map(log => {
            const isExpanded = expandedLogId === log._id;
            const logDate = log.createdAt ? new Date(log.createdAt) : null;
            const timeStr = logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            const dateStr = logDate ? logDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

            return (
              <div
                key={log._id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? 'bg-secondary/15 border-primary/50 shadow-sm'
                    : 'bg-card border-border hover:bg-secondary/10'
                }`}
              >
                {/* Cabecera del Item */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded border border-border bg-background text-primary">
                      {log.entityType === 'SPACE' ? <Layers className="w-4 h-4 text-primary" /> : <Settings className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="grid gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <span className="font-mono text-[10px] font-bold text-foreground/80 bg-background border border-border px-2 py-0.5 rounded">
                          ID: {log.entityId.slice(-6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <User className="w-3.5 h-3.5 text-primary opacity-60" />
                        <span className="font-medium text-foreground/75 truncate max-w-[200px]" title={log.userEmail}>
                          {log.userEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetría y Controles */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-border/25 pt-2.5 md:pt-0">
                    <div className="flex flex-col text-left md:text-right font-mono text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 md:justify-end font-bold text-foreground/85">
                        <Calendar className="w-3 h-3 text-primary opacity-70" />
                        {dateStr}
                      </span>
                      <span className="mt-0.5 opacity-80">{timeStr}</span>
                    </div>

                    <button aria-label={t('audit_toggle_details', { defaultMessage: 'Expandir detalles del log' })}
                      onClick={() => log._id && toggleExpand(log._id)}
                      className="p-1.5 rounded border border-border bg-background hover:bg-secondary hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalles y Delta Expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in duration-200">
                    {renderDelta(log)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
