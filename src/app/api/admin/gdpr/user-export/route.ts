import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { orchestrateGdprExport } from '@/actions/gdpr-export';

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess('ADMIN');

    const { tenantId, userId, email } = await request.json();
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'tenantId and userId are required' }, { status: 400 });
    }

    const { results, combinedZip } = await orchestrateGdprExport(tenantId, userId, email);

    if (!combinedZip) {
      const errors = results.filter(r => !r.success).map(r => `[${r.satellite}] ${r.error}`).join('; ');
      return NextResponse.json({ error: `No satellite returned data: ${errors}` }, { status: 502 });
    }

    const buffer = Buffer.from(combinedZip, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="gdpr-export-${tenantId}-${userId}.zip"`,
      },
    });
  } catch (error) {
    console.error('[USER_GDPR_EXPORT_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
