'use client';

/**
 * @purpose Gestiona componentes de UI para manejar conectores, incluyendo acciones como guardar, eliminar y probar conectores.
 * @purpose_en Renders a UI component for managing connectors, including actions like saving, deleting, and testing connectors.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:01l1rd
 * @lastUpdated 2026-06-23T21:44:39.893Z
 */

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Server, Check, Trash2, Shield, Play, HelpCircle, AlertTriangle, Cloud } from 'lucide-react';
import { saveConnectorAction, deleteConnectorAction, testConnectorAction } from '@/actions/connector-actions';

interface Connector {
  connectorId: string;
  tenantId: string;
  providerType: 'cloudinary' | 's3Compatible' | 'googleDrive' | 'oneDrive';
  status: 'active' | 'inactive';
  credentialsRef: string;
  allowedScopes: string[];
  retentionPolicy: Record<string, unknown>;
  auditMode: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectorsClientProps {
  tenantId: string;
  initialConnectors: Connector[];
}

const CREDENTIALS_TEMPLATES = {
  cloudinary: JSON.stringify({
    cloudName: 'your-cloud-name',
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret'
  }, null, 2),
  s3Compatible: JSON.stringify({
    endpoint: 'https://play.min.io',
    region: 'us-east-1',
    accessKeyId: 'your-access-key-id',
    secretAccessKey: 'your-secret-access-key',
    bucket: 'your-bucket-name'
  }, null, 2),
  googleDrive: JSON.stringify({
    type: 'service_account',
    project_id: 'your-gcp-project-id',
    private_key_id: 'your-private-key-id',
    private_key: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n',
    client_email: 'your-sa@your-project.iam.gserviceaccount.com',
    client_id: 'your-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    folderId: 'optional-target-folder-id'
  }, null, 2),
  oneDrive: JSON.stringify({
    clientId: 'your-azure-app-client-id',
    clientSecret: 'your-azure-app-client-secret',
    tenantId: 'your-azure-ad-tenant-id',
    driveId: 'optional-specific-drive-id'
  }, null, 2)
};

export function ConnectorsClient({ tenantId, initialConnectors }: ConnectorsClientProps) {
  const t = useTranslations('connectors');
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  
  // Form state
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<'cloudinary' | 's3Compatible' | 'googleDrive' | 'oneDrive'>('s3Compatible');
  const [status, setStatus] = useState<'active' | 'inactive'>('inactive');
  const [credentialsRef, setCredentialsRef] = useState<string>(CREDENTIALS_TEMPLATES.s3Compatible);
  const [auditMode, setAuditMode] = useState<string>('standard');
  
  // Feedback states
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleProviderChange = (type: 'cloudinary' | 's3Compatible' | 'googleDrive' | 'oneDrive') => {
    setProviderType(type);
    setCredentialsRef(CREDENTIALS_TEMPLATES[type]);
  };

  const handleSelectConnector = (conn: Connector) => {
    setConnectorId(conn.connectorId);
    setProviderType(conn.providerType);
    setStatus(conn.status);
    setCredentialsRef(conn.credentialsRef);
    setAuditMode(conn.auditMode || 'standard');
    setFeedback({ type: null, message: '' });
  };

  const handleResetForm = () => {
    setConnectorId(null);
    setProviderType('s3Compatible');
    setStatus('inactive');
    setCredentialsRef(CREDENTIALS_TEMPLATES.s3Compatible);
    setAuditMode('standard');
    setFeedback({ type: null, message: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: null, message: '' });

    startTransition(async () => {
      const formData = new FormData();
      formData.append('tenantId', tenantId);
      if (connectorId) formData.append('connectorId', connectorId);
      formData.append('providerType', providerType);
      formData.append('status', status);
      formData.append('credentialsRef', credentialsRef);
      formData.append('auditMode', auditMode);

      const res = await saveConnectorAction(null, formData);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        
        // Refresh local list
        const updated = await fetchConnectorsList();
        setConnectors(updated);
        
        if (!connectorId) {
          handleResetForm();
        }
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    });
  };

  const fetchConnectorsList = async (): Promise<Connector[]> => {
    // We can list via a server action call directly
    const { listConnectorsAction } = await import('@/actions/connector-actions');
    return await listConnectorsAction(tenantId) as unknown as Connector[];
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete'))) return;

    const res = await deleteConnectorAction(id, tenantId);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      const updated = await fetchConnectorsList();
      setConnectors(updated);
      if (connectorId === id) {
        handleResetForm();
      }
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const res = await testConnectorAction(id);
      setTestResults(prev => ({
        ...prev,
        [id]: { success: res.success, message: res.message }
      }));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Network error';
      setTestResults(prev => ({
        ...prev,
        [id]: { success: false, message: errorMessage }
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Area */}
      <div className="lg:col-span-5 bg-card border border-border p-6 rounded-none flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary flex items-center gap-2">
            <Server size={14} />
            {connectorId ? t('edit_connector') : t('new_connector')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Provider Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">{t('provider_type')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['s3Compatible', 'cloudinary', 'googleDrive', 'oneDrive'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleProviderChange(type)}
                  aria-label={t('provider_' + type)}
                  className={`p-3 border text-left flex flex-col gap-1 transition-all rounded-none ${
                    providerType === type
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-transparent text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <span className="text-[11px] font-bold capitalize">
                    {t('provider_' + type)}
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {t('provider_badge_' + type)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status and Audit Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">{t('status')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-background border border-border text-xs p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
              >
                <option value="inactive">{t('inactive')}</option>
                <option value="active">{t('active')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit_mode')}</label>
              <select
                value={auditMode}
                onChange={e => setAuditMode(e.target.value)}
                className="w-full bg-background border border-border text-xs p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
              >
                <option value="standard">{t('audit_standard')}</option>
                <option value="detailed">{t('audit_detailed')}</option>
              </select>
            </div>
          </div>

          {/* Credentials JSON */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">{t('credentials')}</label>
            <textarea
              value={credentialsRef}
              onChange={e => setCredentialsRef(e.target.value)}
              placeholder={t('credentials_placeholder')}
              rows={8}
              className="w-full bg-background border border-border text-xs font-mono p-3 rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={isPending}
              aria-label={t('save')}
              className="bg-primary hover:bg-primary/80 text-primary-foreground text-xs font-mono py-2.5 px-6 rounded-none cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              {isPending ? t('testing') : t('save')}
            </button>

            {connectorId && (
              <button
                type="button"
                onClick={handleResetForm}
                aria-label={t('cancel')}
                className="bg-transparent hover:bg-muted text-muted-foreground border border-border text-xs font-mono py-2.5 px-4 rounded-none cursor-pointer active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
            )}
          </div>

          {/* Form Feedback */}
          {feedback.type && (
            <div className={`p-3 border text-xs flex gap-2 items-start rounded-none ${
              feedback.type === 'success' 
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' 
                : 'border-destructive/30 bg-destructive/5 text-destructive'
            }`}>
              {feedback.type === 'success' ? <Check size={14} className="mt-0.5" /> : <AlertTriangle size={14} className="mt-0.5" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Connectors List Area */}
      <div className="lg:col-span-7 bg-card border border-border p-6 rounded-none flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary flex items-center gap-2">
            <Cloud size={14} />
            {t('active_connectors_heading')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('active_connectors_subtitle')}
          </p>
        </div>

        {connectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border text-center">
            <HelpCircle size={24} className="text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{t('no_connectors')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {connectors.map(conn => {
              const test = testResults[conn.connectorId];
              const isTesting = testingId === conn.connectorId;

              return (
                <div
                  key={conn.connectorId}
                  className={`border p-4 flex flex-col gap-3 transition-all ${
                    conn.status === 'active'
                      ? 'border-primary/50 bg-primary/[0.02]'
                      : 'border-border bg-transparent hover:border-border/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground capitalize">
                          {t('provider_' + conn.providerType)}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider rounded-none ${
                          conn.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {conn.status === 'active' ? t('active') : t('inactive')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ID: {conn.connectorId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectConnector(conn)}
                        className="bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground p-1.5 border border-border rounded-none cursor-pointer active:scale-95 transition-all text-[10px] font-mono uppercase"
                        aria-label="Edit connector"
                      >
                        {t('edit')}
                      </button>

                      <button
                        onClick={() => handleTestConnection(conn.connectorId)}
                        disabled={isTesting}
                        className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 border border-primary/20 rounded-none cursor-pointer active:scale-95 transition-all text-[10px] font-mono uppercase disabled:opacity-50"
                        aria-label="Test connection"
                      >
                        <Play size={10} className={isTesting ? 'animate-spin' : ''} />
                        {isTesting ? t('testing') : t('test')}
                      </button>

                      <button
                        onClick={() => handleDelete(conn.connectorId)}
                        className="bg-transparent hover:bg-destructive/10 text-muted-foreground hover:text-destructive p-1.5 border border-border hover:border-destructive/20 rounded-none cursor-pointer active:scale-95 transition-all"
                        aria-label="Delete connector"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Connection Test Results */}
                  {test && (
                    <div className={`p-2.5 border text-[11px] flex gap-2 items-start rounded-none ${
                      test.success
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500'
                        : 'border-destructive/30 bg-destructive/5 text-destructive'
                    }`}>
                      {test.success ? <Check size={12} className="mt-0.5" /> : <AlertTriangle size={12} className="mt-0.5" />}
                      <span className="leading-normal">{test.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


