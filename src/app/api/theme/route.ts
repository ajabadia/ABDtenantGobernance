/**
 * @purpose Gestiona la generación dinámica del CSS para whitelabeling según las configuraciones de los inquilinos.
 * @purpose_en Handles dynamic CSS generation for whitelabeling based on tenant configurations.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:1vuyl2s
 * @lastUpdated 2026-06-24T10:34:08.385Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';
import { generateTenantCss } from '@ajabadia/styles';
import { AuditService } from '@/services/tenant/audit-service';

export const revalidate = 0; // Dynamic route

/**
 * 🎨 GET /api/theme?tenantId=...
 * Serves dynamic CSS Custom Properties for whitelabeling with zero FOUC and edge-caching headers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return new NextResponse('/* Missing tenantId parameter */', {
        status: 400,
        headers: { 'Content-Type': 'text/css' }
      });
    }

    await connectDB();

    let css = '';
    try {
      const config = await TenantService.getConfig(tenantId);
      
      const themeConfig = {
        primary: config.branding?.colors?.primary,
        secondary: config.branding?.colors?.secondary,
        accent: config.branding?.colors?.accent,
        rounded: config.branding?.rounded,
        radius: config.branding?.radius
      };

      // strict validation and HSL translation
      css = generateTenantCss(themeConfig);
    } catch (err) {
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'THEME_CONFIG_FETCH_ERROR',
        entityType: 'CONFIG',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err instanceof Error ? err.message : String(err) },
      });
      console.warn(`[EdgeCSSThemeGateway] Failed to retrieve config for tenant ${tenantId}. Falling back to default CSS.`, err);
      css = generateTenantCss({}); // tech-noir default cyan
    }

    return new NextResponse(css, {
      status: 200,
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'THEME_GATEWAY_ERROR',
      entityType: 'CONFIG',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: error instanceof Error ? error.message : String(error) },
    });
    console.error('[API_THEME_GATEWAY_ERROR]', error);
    const fallbackCss = generateTenantCss({});
    return new NextResponse(fallbackCss, {
      status: 200,
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=10',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}
