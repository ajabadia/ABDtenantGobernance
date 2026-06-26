'use server';

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';

function getSatelliteUrl(name: string): string | undefined {
  const envMap: Record<string, string> = {
    auth: 'AUTH_PROVIDER_URL',
    quiz: 'QUIZ_SERVICE_URL',
    files: 'FILES_SERVICE_URL',
    logs: 'LOGS_SERVICE_URL',
  };
  return process.env[envMap[name]];
}

interface SatelliteExportResult {
  satellite: string;
  success: boolean;
  data?: string;
  error?: string;
}

async function callSatelliteExport(
  satellite: string,
  tenantId: string,
  userId: string,
  email?: string
): Promise<SatelliteExportResult> {
  const url = getSatelliteUrl(satellite);
  if (!url) {
    return { satellite, success: false, error: `No URL configured for ${satellite}` };
  }
  try {
    const res = await fetch(`${url}/api/internal/gdpr/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET || ''}` },
      body: JSON.stringify({ tenantId, userId, email }),
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return { satellite, success: true, data: base64 };
    }
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    return { satellite, success: false, error: errData.error || `HTTP ${res.status}` };
  } catch (err) {
    return { satellite, success: false, error: String(err) };
  }
}

export async function orchestrateGdprExport(
  tenantId: string,
  userId: string,
  email?: string
): Promise<{ results: SatelliteExportResult[]; combinedZip?: string }> {
  await ensureIndustrialAccess('ADMIN');

  const satellites = ['auth', 'quiz', 'files', 'logs'];
  const results = await Promise.all(
    satellites.map(s => callSatelliteExport(s, tenantId, userId, email))
  );

  const combinedZip = results.find(r => r.success)?.data;

  console.log(`[GDPR_EXPORT] User ${userId} from tenant ${tenantId}: ${results.filter(r => r.success).length}/${results.length} satellites succeeded`);

  return { results, combinedZip };
}
