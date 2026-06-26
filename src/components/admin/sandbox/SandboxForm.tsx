'use client';

/**
 * @purpose Formulario de control Sandbox para inyectar JWTs de prueba, simular desconexión de licencias y saltos de rol instantáneos.
 * @purpose_en Sandbox control form to inject test JWTs, simulate license disconnects, and perform instant role shifting.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1nqxtsd
 * @lastUpdated 2026-06-26T10:21:01.040Z
 */

import React, { useState } from 'react';
import { 
  Terminal, ShieldAlert, Key, RefreshCw, UserCheck, 
  Copy, Check, Shield, User, Eye, AlertTriangle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Tenant {
  tenantId: string;
  name: string;
  dbPrefix: string;
  isolationStrategy: string;
  allowedApps?: string[];
}

interface SandboxFormProps {
  tenants: Tenant[];
  currentUserId: string;
  locale: string;
}

export function SandboxForm({ tenants, currentUserId, locale }: SandboxFormProps) {
  const router = useRouter();
  
  // Form states
  const [sub, setSub] = useState(currentUserId || 'usr_sandbox_123');
  const [email, setEmail] = useState('qa.tester@abdia.es');
  const [name, setName] = useState('QA');
  const [surname, setSurname] = useState('Tester');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [tenantId, setTenantId] = useState(tenants[0]?.tenantId || 'global');
  const [permissions, setPermissions] = useState<string>('read:all,write:all');
  const [dbPrefix, setDbPrefix] = useState(tenants[0]?.dbPrefix || 'abd_global');
  const [isolationStrategy, setIsolationStrategy] = useState(tenants[0]?.isolationStrategy || 'COLLECTION_PREFIX');
  const [allowedApps, setAllowedApps] = useState<string[]>(['quiz', 'analytics', 'logs', 'files']);
  const [expiresIn, setExpiresIn] = useState('2h');
  
  // Status states
  const [generatedToken, setGeneratedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle preset application
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'super_admin':
        setRole('SUPER_ADMIN');
        setPermissions('read:all,write:all,bypass:all');
        setAllowedApps(['quiz', 'analytics', 'logs', 'files']);
        break;
      case 'tenant_admin':
        setRole('ADMIN');
        setPermissions('tenant:read,tenant:write,user:manage');
        setAllowedApps(['quiz', 'analytics', 'logs']);
        break;
      case 'creator':
        setRole('CREATOR');
        setPermissions('quiz:create,quiz:edit,question:write');
        setAllowedApps(['quiz']);
        break;
      case 'auditor':
        setRole('AUDITOR');
        setPermissions('audit:view,logs:read');
        setAllowedApps(['logs', 'analytics']);
        break;
      case 'student':
        setRole('USER');
        setPermissions('quiz:attempt,profile:read');
        setAllowedApps(['quiz']);
        break;
      case 'no_licenses':
        setRole('USER');
        setPermissions('profile:read');
        setAllowedApps([]); // Empty allowed apps = "Desconexión de licencias"
        break;
      default:
        break;
    }
  };

  // Handle tenant change to auto-fill prefix & isolation
  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setTenantId(selectedId);
    const tenant = tenants.find(t => t.tenantId === selectedId);
    if (tenant) {
      setDbPrefix(tenant.dbPrefix || `abd_${selectedId}`);
      setIsolationStrategy(tenant.isolationStrategy || 'COLLECTION_PREFIX');
      if (tenant.allowedApps) {
        setAllowedApps(tenant.allowedApps);
      }
    }
  };

  // Toggle allowed app
  const toggleApp = (app: string) => {
    if (allowedApps.includes(app)) {
      setAllowedApps(allowedApps.filter(a => a !== app));
    } else {
      setAllowedApps([...allowedApps, app]);
    }
  };

  // Generate and optionally apply token
  const handleGenerate = async (apply: boolean) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    const payload = {
      sub,
      email,
      name,
      surname,
      role,
      tenantId,
      permissions: permissions.split(',').map(p => p.trim()).filter(Boolean),
      dbPrefix,
      isolationStrategy,
      allowedApps,
      groups: [],
      expiresIn
    };

    try {
      const response = await fetch('/api/sandbox/generate-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token');
      }

      setGeneratedToken(data.token);
      
      if (apply) {
        setSuccessMessage(locale === 'es' ? '¡Identidad inyectada con éxito! Redirigiendo...' : 'Identity injected successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = `/${locale}`;
        }, 1200);
      } else {
        setSuccessMessage(locale === 'es' ? 'Token generado' : 'Token generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error in sandbox API');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
      {/* Configuration Panel */}
      <div className="lg:col-span-8 flex flex-col gap-6 bg-muted/5 border border-border/80 p-6 md:p-8 rounded-none backdrop-blur-sm relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col gap-2">
          <h2 className="text-sm uppercase font-mono tracking-widest text-primary flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            {locale === 'es' ? 'Configurar Identidad Simulada' : 'Configure Simulated Identity'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {locale === 'es' 
              ? 'Define los claims que se inyectarán en la cookie de sesión cifrada.' 
              : 'Define the claims that will be injected into the encrypted session cookie.'}
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {locale === 'es' ? 'Preajustes Rápidos (Presets)' : 'Quick Presets'}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'super_admin', label: 'Super Admin', color: 'border-rose-500/30 hover:bg-rose-500/10 text-rose-400' },
              { id: 'tenant_admin', label: 'Tenant Admin', color: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400' },
              { id: 'creator', label: 'Creator (Profesor)', color: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400' },
              { id: 'auditor', label: 'Auditor', color: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-400' },
              { id: 'student', label: 'User (Estudiante)', color: 'border-purple-500/30 hover:bg-purple-500/10 text-purple-400' },
              { id: 'no_licenses', label: 'Sin Licencias', color: 'border-red-500/30 hover:bg-red-500/10 text-red-400' },
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 border text-xs font-mono transition-all duration-200 cursor-pointer ${preset.color}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border/40" />

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">User ID (sub)</label>
            <input
              type="text"
              value={sub}
              onChange={e => setSub(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">{locale === 'es' ? 'Nombre' : 'Name'}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">{locale === 'es' ? 'Apellido' : 'Surname'}</label>
            <input
              type="text"
              value={surname}
              onChange={e => setSurname(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CREATOR">CREATOR</option>
              <option value="AUDITOR">AUDITOR</option>
              <option value="USER">USER</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Tenant</label>
            <select
              value={tenantId}
              onChange={handleTenantChange}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            >
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.name} ({t.tenantId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">DB Prefix</label>
            <input
              type="text"
              value={dbPrefix}
              onChange={e => setDbPrefix(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Isolation Strategy</label>
            <input
              type="text"
              value={isolationStrategy}
              onChange={e => setIsolationStrategy(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">
              {locale === 'es' ? 'Permisos ABAC (separados por comas)' : 'ABAC Permissions (comma separated)'}
            </label>
            <input
              type="text"
              value={permissions}
              onChange={e => setPermissions(e.target.value)}
              className="bg-background border border-border p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <hr className="border-border/40" />

        {/* Allowed Apps (Licensing Sim) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              {locale === 'es' ? 'Aplicaciones Contratadas (Licencias Activas)' : 'Contracted Applications (Active Licenses)'}
            </label>
            <p className="text-[10px] text-muted-foreground">
              {locale === 'es' 
                ? 'Desmarca aplicaciones para simular la desconexión de licencias (Sandbox QA).' 
                : 'Uncheck applications to simulate license disconnection (QA Sandbox).'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            {['quiz', 'analytics', 'logs', 'files'].map(app => (
              <label 
                key={app} 
                className={`flex items-center gap-3 px-3 py-2 border transition-all duration-200 cursor-pointer text-xs font-mono select-none ${
                  allowedApps.includes(app) 
                    ? 'border-primary/40 bg-primary/5 text-primary' 
                    : 'border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowedApps.includes(app)}
                  onChange={() => toggleApp(app)}
                  className="accent-primary w-3.5 h-3.5"
                />
                {app.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(false)}
            className="flex-1 py-3 px-4 bg-transparent border border-border hover:border-foreground hover:bg-muted/10 text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer text-center disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : (locale === 'es' ? 'Generar Token' : 'Generate Token')}
          </button>
          
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(true)}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer font-bold text-center disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {locale === 'es' ? 'Aplicar Identidad (Saltar a Rol)' : 'Apply Identity (Instant Shift)'}
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2 mt-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Terminal Output / JWT Inspect */}
      <div className="lg:col-span-4 flex flex-col gap-5 bg-background border border-border p-6 rounded-none relative">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>JWT INSPECTOR</span>
          </div>
          {generatedToken && (
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/80 px-2 py-1 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {locale === 'es' 
              ? 'El token generado se cifra localmente usando la clave compartida de desarrollo.' 
              : 'The generated token is encrypted locally using the shared development key.'}
          </p>

          <textarea
            readOnly
            value={generatedToken}
            placeholder={locale === 'es' ? 'El JWT aparecerá aquí...' : 'JWT will appear here...'}
            className="flex-1 w-full min-h-[220px] bg-muted/10 border border-border/60 p-3 text-[10px] font-mono leading-relaxed resize-none focus:outline-none text-muted-foreground select-all"
          />

          <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-amber-400/90 text-[10px] leading-relaxed flex gap-3">
            <Shield className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block uppercase tracking-wider mb-1">
                {locale === 'es' ? 'Aviso del Sandbox' : 'Sandbox Notice'}
              </strong>
              {locale === 'es'
                ? 'El salto de rol reescribe tu cookie abd_session local. Esto cambiará tu identidad en todos los satélites locales bajo .abdia.es o localhost.'
                : 'Instant shifting rewrites your local abd_session cookie. This will switch your identity across all local satellites running under .abdia.es or localhost.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
