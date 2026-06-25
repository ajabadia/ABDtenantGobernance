/**
 * @purpose Gestiona el exportación de datos de inquilinos y registros para cumplir con la normativa GDPR.
 * @purpose_en Handles the export of tenant data and logs for GDPR compliance.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:19fczqf
 * @lastUpdated 2026-06-25T09:22:40.631Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, connectLogsDB, getTenantConnection } from '@ajabadia/satellite-sdk/db';
import { TenantService } from '@/services/tenant/tenant-service';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user (ADMIN minimum requirement)
    const user = await ensureIndustrialAccess('ADMIN');
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return new NextResponse('Missing tenantId', { status: 400 });
    }

    await connectDB();
    const tenantConfig = await TenantService.getConfig(tenantId);
    if (!tenantConfig) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    const dbPrefix = tenantConfig.dbPrefix || tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isolationStrategy = tenantConfig.isolationStrategy || 'COLLECTION_PREFIX';

    const zip = new JSZip();
    zip.file('metadata.json', JSON.stringify({
      tenantId,
      name: tenantConfig.name,
      dbPrefix,
      isolationStrategy,
      exportedAt: new Date().toISOString(),
      exportedBy: user.email
    }, null, 2));

    // 2. Fetch tenant database/collection data
    const tenantConn = getTenantConnection(dbPrefix, isolationStrategy);
    if (!tenantConn.db) {
      return new NextResponse('Database connection not initialized', { status: 500 });
    }
    const collections = await tenantConn.db.listCollections().toArray();
    
    for (const coll of collections) {
      const collName = coll.name;
      
      // If COLLECTION_PREFIX strategy, only export this tenant's prefixed collections
      if (isolationStrategy === 'COLLECTION_PREFIX') {
        if (collName.startsWith(`${dbPrefix}_`)) {
          const docs = await tenantConn.db.collection(collName).find({}).toArray();
          const cleanName = collName.substring(dbPrefix.length + 1);
          zip.file(`data/${cleanName}.json`, JSON.stringify(docs, null, 2));
        }
      } else {
        // DATABASE_PER_TENANT exports all collections
        const docs = await tenantConn.db.collection(collName).find({}).toArray();
        zip.file(`data/${collName}.json`, JSON.stringify(docs, null, 2));
      }
    }

    // 3. Fetch logs from central_audit_logs if connection is available
    try {
      const logsConn = await connectLogsDB();
      if (logsConn && logsConn.db) {
        const auditLogs = await logsConn.db.collection('central_audit_logs').find({ tenantId }).toArray();
        zip.file('logs/central_audit_logs.json', JSON.stringify(auditLogs, null, 2));

        const alertEvents = await logsConn.db.collection('alertevents').find({ tenantId }).toArray();
        zip.file('logs/alertevents.json', JSON.stringify(alertEvents, null, 2));

        const anomalies = await logsConn.db.collection('anomalyrecords').find({ tenantId }).toArray();
        zip.file('logs/anomalyrecords.json', JSON.stringify(anomalies, null, 2));
      }
    } catch (logErr) {
      console.warn('[GDPR_EXPORT] Failed to fetch logs, continuing with database export:', logErr);
    }

    // 4. Generate zip file and return
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="tenant_${tenantId}_export.zip"`,
      },
    });
  } catch (error) {
    console.error('[GDPR_EXPORT_ERROR]', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
}
