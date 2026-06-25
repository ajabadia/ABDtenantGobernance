'use client';

/**
 * @purpose Gestiona un formulario para crear o administrar entornos sandbox, incluyendo campos para detalles del usuario, configuración del inquilino y permisos.
 * @purpose_en Renders a form for creating or managing sandbox environments, including fields for user details, tenant settings, and permissions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1xlwufa
 * @lastUpdated 2026-06-25T09:23:55.445Z
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FormData {
  sub: string;
  email: string;
  name: string;
  surname: string;
  tenantId: string;
  role: string;
  permissions: string;
  dbPrefix: string;
  isolationStrategy: 'COLLECTION_PREFIX' | 'DATABASE_PER_TENANT';
  allowedApps: string;
  groups: string;
  sessionId: string;
}

const DEFAULT_FORM: FormData = {
  sub: 'sandbox-user',
  email: 'sandbox@test.com',
  name: 'Sandbox',
  surname: 'User',
  tenantId: 'tenant-1',
  role: 'SUPER_ADMIN',
  permissions: '',
  dbPrefix: '',
  isolationStrategy: 'COLLECTION_PREFIX',
  allowedApps: '',
  groups: '',
  sessionId: '',
};

export function SandboxForm() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setToken('');
    setLoading(true);

    try {
      const body = {
        sub: form.sub,
        email: form.email,
        name: form.name || undefined,
        surname: form.surname || undefined,
        tenantId: form.tenantId,
        role: form.role,
        permissions: form.permissions ? form.permissions.split(',').map(s => s.trim()).filter(Boolean) : [],
        dbPrefix: form.dbPrefix || undefined,
        isolationStrategy: form.isolationStrategy,
        allowedApps: form.allowedApps ? form.allowedApps.split(',').map(s => s.trim()).filter(Boolean) : [],
        groups: form.groups ? form.groups.split(',').map(s => s.trim()).filter(Boolean) : [],
        sessionId: form.sessionId || undefined,
      };

      const res = await fetch('/api/sandbox/generate-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error generating JWT');
        return;
      }

      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = "w-full bg-muted/10 border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-none";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="sub" value={form.sub} onChange={updateField('sub')} inputClass={inputClass} />
          <Field label="email" value={form.email} onChange={updateField('email')} inputClass={inputClass} />
          <Field label="name" value={form.name} onChange={updateField('name')} inputClass={inputClass} />
          <Field label="surname" value={form.surname} onChange={updateField('surname')} inputClass={inputClass} />
        </div>
        <Field label="tenantId" value={form.tenantId} onChange={updateField('tenantId')} inputClass={inputClass} />
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">role</label>
          <select value={form.role} onChange={updateField('role')} className={inputClass}>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PROFESSOR">PROFESSOR</option>
            <option value="USER">USER</option>
          </select>
        </div>
        <Field label="permissions (comma-separated)" value={form.permissions} onChange={updateField('permissions')} inputClass={inputClass} />
        <Field label="dbPrefix" value={form.dbPrefix} onChange={updateField('dbPrefix')} inputClass={inputClass} />
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">isolationStrategy</label>
          <select value={form.isolationStrategy} onChange={updateField('isolationStrategy')} className={inputClass}>
            <option value="COLLECTION_PREFIX">COLLECTION_PREFIX</option>
            <option value="DATABASE_PER_TENANT">DATABASE_PER_TENANT</option>
          </select>
        </div>
        <Field label="allowedApps (comma-separated)" value={form.allowedApps} onChange={updateField('allowedApps')} inputClass={inputClass} />
        <Field label="groups (comma-separated)" value={form.groups} onChange={updateField('groups')} inputClass={inputClass} />
        <Field label="sessionId" value={form.sessionId} onChange={updateField('sessionId')} inputClass={inputClass} />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 rounded-none"
        >
          {loading ? 'Generating...' : 'Generate JWT'}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Generated Token</label>
          {token && (
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-primary hover:underline">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        <textarea
          readOnly
          value={token}
          placeholder="Click 'Generate JWT' to create a token..."
          className="w-full h-[400px] bg-muted/10 border border-border p-3 text-xs font-mono text-foreground resize-none focus:outline-none rounded-none"
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, inputClass }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; inputClass: string }) {
  return (
    <div>
      <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={onChange} className={inputClass} />
    </div>
  );
}
