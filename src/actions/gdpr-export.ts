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

export async function orchestrateGdprExport(
  tenantId: string,
  userId: string,
  email?: string
): Promise<{ results: SatelliteExportResult[]; combinedZip?: string }> {
  const user = await ensureIndustrialAccess('ADMIN');
  const results: SatelliteExportResult[] = [];

  // 1. ABDQuiz export
  const quizUrl = getSatelliteUrl('quiz');
  if (quizUrl) {
    try {
      const res = await fetch(`${quizUrl}/api/internal/gdpr/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET || ''}` },
        body: JSON.stringify({ tenantId, userId, email }),
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        results.push({ satellite: 'quiz', success: true, data: base64 });
      } else {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        results.push({ satellite: 'quiz', success: false, error: errData.error || `HTTP ${res.status}` });
      }
    } catch (err) {
      results.push({ satellite: 'quiz', success: false, error: String(err) });
    }
  }

  // Aggregate all successful ZIPs into one (future: cross-satellite merge)
  const combinedZip = results.find(r => r.success)?.data;

  // Log the export
  console.log(`[GDPR_EXPORT] User ${userId} from tenant ${tenantId}: ${results.filter(r => r.success).length}/${results.length} satellites succeeded`);

  return { results, combinedZip };
}
