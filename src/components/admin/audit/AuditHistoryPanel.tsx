/**
 * @purpose Rendiza un panel de historia de auditoría utilizando el componente `LiveLogViewer`, habilitando o deshabilitando la transmisión de datos en tiempo real según una bandera de característica.
 * @purpose_en Renders an audit history panel using the `LiveLogViewer` component, conditionally enabling live telemetry based on a feature flag.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:666f2j
 * @lastUpdated 2026-06-23T21:44:05.177Z
 */

// Live telemetry audit panel delegating to shared LiveLogViewer

'use client';

// Import shared components and feature flags via virtual package paths
import { LiveLogViewer } from '@ajabadia/ecosystem-widgets';

const featureFlags = {
  liveModeEnabled: true
};

interface AuditHistoryPanelProps {
  tenantId: string;
}

export function AuditHistoryPanel({ tenantId }: AuditHistoryPanelProps) {
  // Feature flag to enable/disable live mode globally
  if (!featureFlags.liveModeEnabled) {
    return <div className="p-4 text-sm text-muted-foreground" role="status">{'Live telemetry is currently disabled.'}</div>;
  }

  return (
    <div className="space-y-4">
      <LiveLogViewer tenantId={tenantId} />
    </div>
  );
}
