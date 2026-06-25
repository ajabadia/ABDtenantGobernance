/**
 * @purpose Gestiona acciones relacionadas con el mercado en la aplicación ABDtenantGobernance, incluyendo la recuperación de datos y la solicitud de licencias.
 * @purpose_en Manages actions related to the marketplace in the ABDtenantGobernance application, including fetching data and creating license requests.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:7,sig:iduo0e
 * @lastUpdated 2026-06-23T20:37:28.462Z
 */

'use server';

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import LicenseRequest from '@/models/LicenseRequest';
import { TenantService } from '@/services/tenant/tenant-service';
import { AuditService } from '@/services/tenant/audit-service';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function fetchMarketplaceData(tenantId: string) {
  await connectDB();
  const user = await ensureIndustrialAccess('ADMIN');
  
  if (user.tenantId !== tenantId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await TenantService.getConfig(tenantId);
  
  const rawRequests = await LicenseRequest.find({ tenantId }).sort({ createdAt: -1 }).lean();
  
  const pendingRequests = rawRequests.map(req => ({
    _id: req._id.toString(),
    appId: req.appId,
    status: req.status,
    createdAt: req.createdAt
  }));

  return {
    allowedApps: tenant.allowedApps || [],
    pendingRequests
  };
}

export async function createLicenseRequestAction(tenantId: string, appId: string, comments: string) {
  // 🚦 Rate limiting: max 20 license requests per tenant per hour
  const { rateLimitMongodb } = await import('@ajabadia/satellite-sdk');
  const isAllowed = await rateLimitMongodb.check(tenantId, 'api', 20, 3600);
  if (!isAllowed) {
    throw new Error('Demasiadas solicitudes. Intente más tarde.');
  }

  await connectDB();
  const user = await ensureIndustrialAccess('ADMIN');
  
  if (user.tenantId !== tenantId && user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const existingRequest = await LicenseRequest.findOne({ tenantId, appId, status: 'PENDING' });
  if (existingRequest) {
    throw new Error('Ya existe una solicitud pendiente para esta aplicación.');
  }

  await LicenseRequest.create({
    tenantId,
    appId,
    status: 'PENDING',
    requestedBy: user.email,
    comments
  });

  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  const userAgent = headersList.get('user-agent') || 'Unknown';

  AuditService.logEvent({
    tenantId,
    action: 'REQUEST_LICENSE',
    entityType: 'LICENSE_REQUEST',
    entityId: appId,
    userId: user.email,
    userEmail: user.email,
    changedFields: { appId, comments },
    ipAddress,
    userAgent
  });

  revalidatePath('/[locale]/admin/marketplace', 'page');
  return { success: true };
}

export async function fetchAllPendingRequests() {
  await connectDB();
  await ensureIndustrialAccess('SUPER_ADMIN');

  const rawRequests = await LicenseRequest.find({ status: 'PENDING' }).sort({ createdAt: -1 }).lean();
  
  return rawRequests.map(req => ({
    _id: req._id.toString(),
    tenantId: req.tenantId,
    appId: req.appId,
    requestedBy: req.requestedBy,
    comments: req.comments,
    createdAt: req.createdAt
  }));
}

export async function resolveLicenseRequestAction(requestId: string, action: 'APPROVE' | 'DENY', comments?: string) {
  await connectDB();
  const user = await ensureIndustrialAccess('SUPER_ADMIN');

  const request = await LicenseRequest.findById(requestId);
  if (!request || request.status !== 'PENDING') {
    throw new Error('Solicitud no encontrada o ya resuelta.');
  }

  if (action === 'APPROVE') {
    const tenant = await TenantService.getConfig(request.tenantId);
    const currentApps = tenant.allowedApps || [];
    
    if (!currentApps.includes(request.appId)) {
      const newApps = [...currentApps, request.appId];
      await TenantService.updateConfig(request.tenantId, { allowedApps: newApps }, user.email);
    }
  }

  request.status = action === 'APPROVE' ? 'APPROVED' : 'DENIED';
  request.resolvedBy = user.email;
  request.resolvedAt = new Date();
  request.comments = comments || request.comments;
  
  await request.save();

  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  const userAgent = headersList.get('user-agent') || 'Unknown';

  AuditService.logEvent({
    tenantId: request.tenantId,
    action: action === 'APPROVE' ? 'APPROVE_LICENSE_REQUEST' : 'DENY_LICENSE_REQUEST',
    entityType: 'LICENSE_REQUEST',
    entityId: request.appId,
    userId: user.email,
    userEmail: user.email,
    changedFields: { status: request.status, resolutionComments: request.comments },
    ipAddress,
    userAgent
  });

  revalidatePath('/[locale]/admin/marketplace', 'page');
  return { success: true };
}
