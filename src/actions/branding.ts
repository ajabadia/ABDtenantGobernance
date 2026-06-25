/**
 * @purpose Gestiona actualizaciones de marca de inquilinos procesando subidas asíncronas de logos y favicons a Cloudinary y persistiendo cambios en la base de datos.
 * @purpose_en Handles the update of tenant branding by processing asynchronous logo/favicon uploads to Cloudinary and persisting changes in the database.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:yjt57o
 * @lastUpdated 2026-06-24T10:32:50.797Z
 */

'use server';

import { revalidatePath } from 'next/cache';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;
import { TenantService } from '@/services/tenant/tenant-service';
import { uploadBrandingAsset, deleteCloudinaryAsset } from '@ajabadia/satellite-sdk/utils';;
import { AuditService } from '@/services/tenant/audit-service';

export interface UpdateBrandingResponse {
  success: boolean;
  message: string;
}

/**
 * Server Action premium para actualizar la marca blanca del tenant.
 * Procesa la carga asíncrona de logos/favicons a Cloudinary y persiste los cambios.
 */
export async function updateTenantBrandingAction(
  prevState: unknown,
  formData: FormData
): Promise<UpdateBrandingResponse> {
  try {
    // 1. Validar autenticación de administrador del tenant
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (formData.get('tenantId') as string) || user.tenantId;

    // 2. Extraer datos visuales del formulario
    const primary = formData.get('primary') as string;
    const secondary = formData.get('secondary') as string || undefined;
    const accent = formData.get('accent') as string || undefined;
    const roundedStr = formData.get('rounded') as string;
    const rounded = roundedStr === 'true';
    const radius = formData.get('radius') as string || '0.75rem';

    // Extraer literales de roles contextuales
    const roleLiterals = {
      CREATOR: {
        es: formData.get('roleLiteral_CREATOR_es') as string || 'Creador',
        en: formData.get('roleLiteral_CREATOR_en') as string || 'Creator',
      },
      RECIPIENT: {
        es: formData.get('roleLiteral_RECIPIENT_es') as string || 'Destinatario',
        en: formData.get('roleLiteral_RECIPIENT_en') as string || 'Recipient',
      },
      AUDITOR: {
        es: formData.get('roleLiteral_AUDITOR_es') as string || 'Auditor',
        en: formData.get('roleLiteral_AUDITOR_en') as string || 'Auditor',
      },
    };
    
    const logoFile = formData.get('logo') as File | null;
    const faviconFile = formData.get('favicon') as File | null;

    // 3. Obtener configuración actual del tenant para validar activos previos
    const tenantConfig = await TenantService.getConfig(tenantId);
    let logo = tenantConfig.branding?.logo;
    let favicon = tenantConfig.branding?.favicon;

    // 4. Procesar carga de Logotipo si se proporciona uno nuevo
    if (logoFile && logoFile.size > 0 && logoFile.name !== 'undefined') {
      // Eliminar logotipo anterior en Cloudinary para mantener el CDN libre de basura
      if (logo?.publicId) {
        await deleteCloudinaryAsset(logo.publicId);
      }
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const upload = await uploadBrandingAsset(buffer, logoFile.name, tenantId, 'logo');
      logo = {
        url: upload.secureUrl,
        publicId: upload.publicId
      };
    }

    // 5. Procesar carga de Favicon si se proporciona uno nuevo
    if (faviconFile && faviconFile.size > 0 && faviconFile.name !== 'undefined') {
      // Eliminar favicon anterior en Cloudinary
      if (favicon?.publicId) {
        await deleteCloudinaryAsset(favicon.publicId);
      }
      const buffer = Buffer.from(await faviconFile.arrayBuffer());
      const upload = await uploadBrandingAsset(buffer, faviconFile.name, tenantId, 'favicon');
      favicon = {
        url: upload.secureUrl,
        publicId: upload.publicId
      };
    }

    // 6. Consolidar el payload de actualización visual
    const brandingUpdate = {
      branding: {
        logo,
        favicon,
        colors: {
          primary,
          secondary,
          accent,
          primaryDark: tenantConfig.branding?.colors?.primaryDark,
          accentDark: tenantConfig.branding?.colors?.accentDark,
        },
        autoDarkMode: tenantConfig.branding?.autoDarkMode ?? true,
        rounded,
        radius
      }
    };

    // 7. Persistir atómicamente en base de datos
    await TenantService.updateConfig(tenantId, {
      ...brandingUpdate,
      roleCustomization: { roleLiterals },
    }, user.id);

    await AuditService.logEvent({
      tenantId,
      action: 'BRANDING_UPDATE_SUCCESS',
      entityType: 'BRANDING',
      entityId: 'unknown',
      userId: user.email || 'system',
      userEmail: user.email || 'system',
      changedFields: { hasLogo: !!logoFile, hasFavicon: !!faviconFile },
    });

    // 8. Revalidar el cache global de layouts en Next.js (Zero-FOUC en caliente)
    revalidatePath('/', 'layout');
    revalidatePath('/[locale]', 'layout');

    return {
      success: true,
      message: 'Marca blanca del tenant actualizada con éxito'
    };
  } catch (error) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: (formData.get('tenantId') as string | null) || 'unknown',
      action: 'BRANDING_UPDATE_ERROR',
      entityType: 'BRANDING',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('❌ [UPDATE_BRANDING_ACTION_ERROR] Failed to save white-label customizer config:', err);
    return {
      success: false,
      message: err.message || 'Error interno al actualizar la marca blanca'
    };
  }
}
