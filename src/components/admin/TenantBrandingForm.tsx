"use client";

/**
 * @purpose Renderiza una forma para personalizar el branding del inquilino, incluyendo logo, favicon, colores y literalidades de rol.
 * @purpose_en Renders a form for customizing tenant branding, including logo, favicon, colors, and role literals.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:11,sig:1glmfqh
 * @lastUpdated 2026-06-23T21:45:37.536Z
 */

import React from 'react';
import { Check, RefreshCw, Sparkles } from 'lucide-react';
import { generateTenantCss } from "@ajabadia/styles";
import { useTranslations } from 'next-intl';
import { useBrandingForm } from './branding/useBrandingForm';
import { ColorPickerGroup } from './branding/ColorPickerGroup';
import { ImageUploadGroup } from './branding/ImageUploadGroup';
import { EmailFromNameInput } from './branding/EmailFromNameInput';
import { TenantBrandingPreview } from './branding/TenantBrandingPreview';
import { BorderRadiusSelector } from './branding/BorderRadiusSelector';
import { RoleLiteralsFieldset } from './branding/RoleLiteralsFieldset';

interface TenantBrandingFormProps {
  tenantId: string;
  initialBranding?: {
    logo?: { url?: string | null; publicId?: string; };
    favicon?: { url?: string | null; publicId?: string; };
    fromName?: string;
    colors?: { primary: string; secondary?: string; accent?: string; };
    rounded?: boolean;
    radius?: string;
  };
  initialRoleCustomization?: {
    roleLiterals: {
      CREATOR: { es: string; en: string };
      RECIPIENT: { es: string; en: string };
      AUDITOR: { es: string; en: string };
    };
  };
  allTenants?: { tenantId: string; name: string; }[];
}

export function TenantBrandingForm({ tenantId, initialBranding, initialRoleCustomization }: TenantBrandingFormProps) {
  const t = useTranslations('admin');

  const {
    isPending, primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    accentColor, setAccentColor,
    isRounded, setIsRounded,
    radiusValue, setRadiusValue,
    fromName, setFromName,
    logoPreview, setLogoPreview, logoFile, setLogoFile,
    faviconPreview, setFaviconPreview, faviconFile, setFaviconFile,
    saveStatus, statusMessage,
    roleLiterals, setRoleLiterals,
    handleSubmit,
  } = useBrandingForm(tenantId, initialBranding, initialRoleCustomization);

  const previewCss = generateTenantCss({
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    rounded: isRounded,
    radius: radiusValue,
    autoDarkMode: true
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 bg-card border border-border rounded-xl shadow-sm">
      <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles size={20} className="text-primary animate-pulse" />
            {t('title')}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('subtitle')}</p>
        </div>

        <ImageUploadGroup 
          logoPreview={logoPreview}
          setLogoPreview={setLogoPreview}
          setLogoFile={setLogoFile}
          faviconPreview={faviconPreview}
          setFaviconPreview={setFaviconPreview}
          setFaviconFile={setFaviconFile}
        />

        <ColorPickerGroup 
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
        />

        <EmailFromNameInput fromName={fromName} onChange={setFromName} />

        <RoleLiteralsFieldset roleLiterals={roleLiterals} onRoleLiteralsChange={setRoleLiterals} t={t} />

        <BorderRadiusSelector 
          isRounded={isRounded}
          radiusValue={radiusValue}
          onRoundedChange={setIsRounded}
          onRadiusChange={setRadiusValue}
        />

        <div className="flex items-center gap-4 mt-2">
          <button type="submit" disabled={isPending}
            aria-label={isPending ? 'Guardando marca blanca del tenant' : 'Propagar marca blanca del tenant'}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xs py-2.5 px-6 rounded transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {isPending ? 'Guardando...' : 'Propagar Marca Blanca'}
          </button>
          {saveStatus === 'success' && (
            <span className="text-xs text-emerald-500 font-medium animate-in slide-in-from-left-2 duration-200">
              {statusMessage || '¡Marca blanca propagada con éxito!'}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-destructive font-medium animate-in slide-in-from-left-2 duration-200">
              {statusMessage || 'Ocurrió un error al guardar la marca blanca.'}
            </span>
          )}
        </div>
      </form>

      <TenantBrandingPreview 
        tenantId={tenantId}
        logoPreview={logoPreview}
        faviconPreview={faviconPreview}
        previewCss={previewCss}
      />
    </div>
  );
}
