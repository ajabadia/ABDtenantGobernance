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
