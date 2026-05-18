'use server';

import { revalidatePath } from 'next/cache';
import { ensureIndustrialAccess } from '@/lib/session';
import { TenantService } from '@/services/tenant/tenant-service';
import { uploadBrandingAsset, deleteFromCloudinary } from '@/lib/cloudinary';

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
        await deleteFromCloudinary(logo.publicId);
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
        await deleteFromCloudinary(favicon.publicId);
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
    await TenantService.updateConfig(tenantId, brandingUpdate, user.id);

    // 8. Revalidar el cache global de layouts en Next.js (Zero-FOUC en caliente)
    revalidatePath('/', 'layout');
    revalidatePath('/[locale]', 'layout');

    return {
      success: true,
      message: 'Marca blanca del tenant actualizada con éxito'
    };
  } catch (error) {
    const err = error as Error;
    console.error('❌ [UPDATE_BRANDING_ACTION_ERROR] Failed to save white-label customizer config:', err);
    return {
      success: false,
      message: err.message || 'Error interno al actualizar la marca blanca'
    };
  }
}
