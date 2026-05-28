import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { AssetLinkService } from '@/services/tenant/asset-link-service';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

/**
 * 🔗 GET /api/admin/spaces/links
 * Obtiene los assets de un espacio (?spaceId=...) o los espacios de un asset (?assetId=...)
 */
export async function GET(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;
      const spaceId = searchParams.get('spaceId');
      const assetId = searchParams.get('assetId');
      
      if (spaceId) {
        const links = await AssetLinkService.getSpaceAssets(tenantId, spaceId);
        return NextResponse.json(links);
      } else if (assetId) {
        const links = await AssetLinkService.getAssetLinks(tenantId, assetId);
        return NextResponse.json(links);
      } else {
        return NextResponse.json({ error: 'Falta parámetro spaceId o assetId' }, { status: 400 });
      }
    } catch (error: unknown) {
      console.error('[API_GET_ASSET_LINKS_ERROR]', error);
      const err = error as Error;
      const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
    }
  });
}

/**
 * 🔗 POST /api/admin/spaces/links
 * Vincula un activo a un espacio
 */
export async function POST(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const body = await request.json();
      const tenantId = body.tenantId || user.tenantId;
      const { assetId, spaceId, isPrimary } = body;
      
      if (!assetId || !spaceId) {
        return NextResponse.json({ error: 'Campos assetId y spaceId obligatorios' }, { status: 400 });
      }
      
      const link = await AssetLinkService.linkAsset(
        tenantId,
        user.id,
        assetId,
        spaceId,
        isPrimary !== false,
        user.email
      );
      
      return NextResponse.json(link, { status: 201 });
    } catch (error: unknown) {
      console.error('[API_POST_ASSET_LINKS_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Error vinculando asset' }, { status: 400 });
    }
  });
}

/**
 * 🔗 DELETE /api/admin/spaces/links
 * Elimina la vinculación de un activo
 */
export async function DELETE(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;
      const assetId = searchParams.get('assetId');
      const spaceId = searchParams.get('spaceId');
      
      if (!assetId || !spaceId) {
        return NextResponse.json({ error: 'Campos assetId y spaceId obligatorios' }, { status: 400 });
      }
      
      await AssetLinkService.unlinkAsset(tenantId, user.id, assetId, spaceId, user.email);
      
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error('[API_DELETE_ASSET_LINKS_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Error desvinculando asset' }, { status: 400 });
    }
  });
}
