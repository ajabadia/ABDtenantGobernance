'use server';

import { ensureIndustrialAccess } from '@/lib/session';
import connectDB from '@/lib/database/mongodb';
import LicenseRequest from '@/models/LicenseRequest';
import { TenantService } from '@/services/tenant/tenant-service';
import { revalidatePath } from 'next/cache';

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

  revalidatePath('/[locale]/admin/marketplace', 'page');
  return { success: true };
}
