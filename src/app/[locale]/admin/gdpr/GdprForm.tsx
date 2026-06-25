'use client';

/**
 * @purpose Renderiza una forma para operaciones de purga de datos GDPR, maneja el ingreso del usuario y muestra los resultados.
 * @purpose_en Renders a form for GDPR data purge operations, handling user input and displaying results.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:ygc9p4
 * @lastUpdated 2026-06-25T09:23:27.316Z
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { orchestrateGdprPurge } from '@/actions/gdpr-purge';

interface SatelliteResult {
  satellite: string;
  success: boolean;
  details?: string;
  error?: string;
}

export function GdprForm() {
  const [userId, setUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SatelliteResult[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await orchestrateGdprPurge(userId.trim(), tenantId.trim(), email.trim() || undefined);
      setResults(res.satellites);
    } catch (err) {
      setResults([{ satellite: 'error', success: false, error: String(err) }]);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-muted/10 border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-none";

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">User ID *</label>
          <input type="text" value={userId} onChange={e => setUserId(e.target.value)} required className={inputClass} placeholder="user_abc123" />
        </div>
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Tenant ID *</label>
          <input type="text" value={tenantId} onChange={e => setTenantId(e.target.value)} required className={inputClass} placeholder="tenant-1" />
        </div>
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Email (optional, for better matching)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="user@example.com" />
        </div>
        <div className="flex items-center gap-2 p-3 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          <span>This action is irreversible. Personal data will be anonymized across all satellites.</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-red-600 text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 rounded-none"
        >
          {loading ? 'Purging...' : 'Orchestrate GDPR Purge'}
        </button>
      </form>

      {results && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm uppercase font-bold tracking-wider text-muted-foreground">Results</h3>
          <div className="grid gap-2">
            {results.map((r) => (
              <div key={r.satellite} className={`flex items-start gap-3 p-3 border text-sm ${r.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                {r.success ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" /> : <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <span className="font-bold uppercase text-xs tracking-wider">{r.satellite}</span>
                  {r.details && <p className="text-muted-foreground text-xs mt-1">{r.details}</p>}
                  {r.error && <p className="text-red-400 text-xs mt-1">{r.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
