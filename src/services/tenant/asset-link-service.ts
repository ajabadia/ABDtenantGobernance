import mongoose from 'mongoose';
import AssetSpaceLink, { type IAssetSpaceLink } from '@/models/AssetSpaceLink';
import { AssetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';
import { SpaceRepository } from '@/lib/repositories/SpaceRepository';
import { AuditService } from './audit-service';
import { AssetSpaceLinkSchema, type AssetSpaceLink as AssetSpaceLinkSchemaType } from '@/lib/schemas/spaces';

const assetSpaceLinkRepository = new AssetSpaceLinkRepository();
const spaceRepository = new SpaceRepository();

/**
 * 🔒 Valida la existencia y pertenencia del activo en su satélite origen
 */
export async function verifyAssetSovereignty(tenantId: string, assetId: string): Promise<boolean> {
  let url = '';
  // Mapeo dinámico según prefijo del ID para simular red inter-servicio
  if (assetId.startsWith('quiz-')) {
    url = `http://localhost:3300/api/internal/assets/verify?tenantId=${tenantId}&assetId=${assetId}`;
  } else if (assetId.startsWith('doc-') || assetId.startsWith('corpus-')) {
    url = `http://localhost:3800/api/internal/assets/verify?tenantId=${tenantId}&assetId=${assetId}`;
  } else {
    // Modo de desarrollo: permitir prefijos de prueba locales
    if (process.env.NODE_ENV !== 'production') {
      return assetId.startsWith('test-') || assetId.startsWith('demo-') || assetId.length > 5;
    }
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos de timeout estricto

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'x-internal-api-secret': process.env.INTERNAL_API_SECRET || 'dev-secret-secure-123456'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.belongsToTenant;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[SOVEREIGNTY_VERIFICATION_FAILED] Failed to verify asset ${assetId} via inter-service API:`, err);
    
    // Si falla la red en local en desarrollo, permitimos de forma controlada
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SOVEREIGNTY_DEV_BYPASS] Allowing asset ${assetId} on tenant ${tenantId} in local dev.`);
      return true;
    }
    return false;
  }
}

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
    // 1. Verificar existencia del espacio destino
    const space = await spaceRepository.findById(spaceId);
    if (!space || !space.isActive || space.tenantId !== tenantId) {
      throw new Error('El espacio destino no existe, está inactivo o pertenece a otro tenant');
    }

    // 2. Verificar soberanía del activo
    const hasSovereignty = await verifyAssetSovereignty(tenantId, assetId);
    if (!hasSovereignty) {
      throw new Error('No se pudo verificar la propiedad del activo en el satélite de origen');
    }

    // 3. Iniciar sesión transaccional para cambios de isPrimary
    const session = await mongoose.startSession().catch(() => null);
    let useTransaction = false;
    if (session) {
      session.startTransaction();
      useTransaction = true;
    }

    try {
      // Si se marca como primario, degradamos cualquier otro enlace primario de este asset
      if (isPrimary) {
        const filter = { tenantId, assetId, isPrimary: true };
        const update = { $set: { isPrimary: false } };
        const options = useTransaction && session ? { session } : {};
        await assetSpaceLinkRepository.model.updateMany(filter, update, options).exec();
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

      let doc;
      if (useTransaction && session) {
        const res = await AssetSpaceLink.create([linkData], { session });
        doc = res[0];
        await session.commitTransaction();
        session.endSession();
      } else {
        doc = await AssetSpaceLink.create(linkData);
      }

      // 4. Auditoría remota
      AuditService.logEvent({
        tenantId,
        action: 'LINK_ASSET',
        entityType: 'SPACE',
        entityId: spaceId,
        userId,
        userEmail,
        changedFields: {
          assetId,
          spaceId,
          spacePath: doc.spacePath,
          isPrimary
        }
      });

      const obj = doc.toObject();
      const parseable = { ...obj, _id: obj._id?.toString() ?? obj._id };
      return AssetSpaceLinkSchema.parse(parseable);
    } catch (error) {
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
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
