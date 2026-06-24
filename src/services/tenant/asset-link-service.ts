/**
 * @purpose Gestiona el enlace y la recuperación de activos a espacios dentro de un inquilino, asegurando soberanía y integridad transaccional.
 * @purpose_en Manages the linking and retrieval of assets to spaces within a tenant, ensuring sovereignty and transactional integrity.
 * @refactorable true (contains multiple business logic functions)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:4mj3my
 * @lastUpdated 2026-06-23T23:28:36.040Z
 */

import AssetSpaceLink from '@/models/AssetSpaceLink';
import { AssetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import { AuditService } from './audit-service';
import { AssetSpaceLinkSchema, type AssetSpaceLink as AssetSpaceLinkSchemaType } from '@/lib/schemas/spaces';
import { verifyAssetSovereignty, withAssetTransaction } from './asset-verification';

const assetSpaceLinkRepository = new AssetSpaceLinkRepository();
const spaceRepository = new SpaceRepository();

export class AssetLinkService {
  
  /**
   * Vincula un asset a un espacio de manera atómica
   */
  static async linkAsset(
    tenantId: string,
    userId: string,
    assetId: string,
    spaceId: string,
    isPrimary = true,
    userEmail = 'SYSTEM'
  ): Promise<AssetSpaceLinkSchemaType> {
    const space = await spaceRepository.findById(spaceId);
    if (!space || !space.isActive || space.tenantId !== tenantId) {
      throw new Error('El espacio destino no existe, está inactivo o pertenece a otro tenant');
    }

    const hasSovereignty = await verifyAssetSovereignty(tenantId, assetId);
    if (!hasSovereignty) {
      throw new Error('No se pudo verificar la propiedad del activo en el satélite de origen');
    }

    const doc = await withAssetTransaction(async (session) => {
      if (isPrimary) {
        const filter = { tenantId, assetId, isPrimary: true };
        const update = { $set: { isPrimary: false } };
        const opts = session ? { session } : {};
        await assetSpaceLinkRepository.model.updateMany(filter, update, opts).exec();
      }

      const linkData = {
        tenantId,
        assetId,
        spaceId,
        spacePath: space.materializedPath || `/${space.slug}`,
        isPrimary,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (session) {
        const res = await AssetSpaceLink.create([linkData], { session });
        return res[0];
      }
      return AssetSpaceLink.create(linkData);
    });

    AuditService.logEvent({
      tenantId,
      action: 'LINK_ASSET',
      entityType: 'SPACE',
      entityId: spaceId,
      userId,
      userEmail,
      changedFields: { assetId, spaceId, spacePath: doc.spacePath, isPrimary }
    });

    const obj = doc.toObject();
    const parseable = { ...obj, _id: obj._id?.toString() ?? obj._id };
    return AssetSpaceLinkSchema.parse(parseable);
  }

  /**
   * Elimina la vinculación de un asset
   */
  static async unlinkAsset(
    tenantId: string,
    userId: string,
    assetId: string,
    spaceId: string,
    userEmail = 'SYSTEM'
  ): Promise<void> {
    const link = await assetSpaceLinkRepository.findOne({ tenantId, assetId, spaceId });
    if (!link) {
      throw new Error('Vinculación no encontrada');
    }

    await assetSpaceLinkRepository.delete(link._id.toString());

    // Auditoría remota
    AuditService.logEvent({
      tenantId,
      action: 'UNLINK_ASSET',
      entityType: 'SPACE',
      entityId: spaceId,
      userId,
      userEmail,
      changedFields: {
        assetId,
        spaceId,
        spacePath: link.spacePath
      }
    });
  }

  /**
   * Obtiene todos los assets vinculados a un espacio
   */
  static async getSpaceAssets(tenantId: string, spaceId: string): Promise<AssetSpaceLinkSchemaType[]> {
    const docs = await assetSpaceLinkRepository.findBySpaceId(tenantId, spaceId);
    return docs.map(doc => {
      const obj = doc.toObject();
      if (obj._id) obj._id = obj._id.toString();
      return AssetSpaceLinkSchema.parse(obj);
    });
  }

  /**
   * Obtiene todas las vinculaciones de un asset
   */
  static async getAssetLinks(tenantId: string, assetId: string): Promise<AssetSpaceLinkSchemaType[]> {
    const docs = await assetSpaceLinkRepository.findByAssetId(tenantId, assetId);
    return docs.map(doc => {
      const obj = doc.toObject();
      if (obj._id) obj._id = obj._id.toString();
      return AssetSpaceLinkSchema.parse(obj);
    });
  }
}
