/**
 * @purpose Renderiza una notificacion emergente para mostrar el estado del usuario, indicando si esta activo, suspendido o pendiente.
 * @purpose_en Renders a badge to display the status of a user, indicating whether they are active, suspended, or pending.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:eb4jup
 * @lastUpdated 2026-06-23T21:43:16.943Z
 */

import React from 'react';

export function UserStatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-amber-500 rounded-none">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
        </span>
        PENDIENTE
      </span>
    );
  }

  if (status === 'suspended') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-red-500 rounded-none">
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
        </span>
        SUSPENDIDO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-emerald-500 rounded-none">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      ACTIVO
    </span>
  );
}
