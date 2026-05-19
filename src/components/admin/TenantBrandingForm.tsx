"use client";

import React, { useState, useTransition } from 'react';
import { Check, RefreshCw, Sparkles, Database } from 'lucide-react';
import { generateTenantCss } from "@abd/styles";
import { updateTenantBrandingAction } from '@/actions/branding';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ColorPickerGroup } from './branding/ColorPickerGroup';
import { ImageUploadGroup } from './branding/ImageUploadGroup';
import { TenantBrandingPreview } from './branding/TenantBrandingPreview';
import { BorderRadiusSelector } from './branding/BorderRadiusSelector';

interface TenantBrandingFormProps {
  tenantId: string;
  initialBranding?: {
    logo?: {
      url?: string | null;
      publicId?: string;
    };
    favicon?: {
      url?: string | null;
      publicId?: string;
    };
    colors?: {
      primary: string;
      secondary?: string;
      accent?: string;
    };
    rounded?: boolean;
    radius?: string;
  };
  allTenants?: {
    tenantId: string;
    name: string;
  }[];
}

export function TenantBrandingForm({ tenantId, initialBranding, allTenants }: TenantBrandingFormProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('admin');

  // --- Estados reactivos locales de marca ---
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.colors?.primary || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(initialBranding?.colors?.secondary || '#1e293b');
  const [accentColor, setAccentColor] = useState(initialBranding?.colors?.accent || '#3b82f6');
  const [isRounded, setIsRounded] = useState(initialBranding?.rounded ?? true);
  const [radiusValue, setRadiusValue] = useState(initialBranding?.radius || '0.75rem');

  // --- Cajas de previsualización en vivo (Live previews) ---
  const [logoPreview, setLogoPreview] = useState<string | null>(initialBranding?.logo?.url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [faviconPreview, setFaviconPreview] = useState<string | null>(initialBranding?.favicon?.url || null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // --- Compilar el CSS en tiempo real únicamente para la caja de simulación ---
  const previewCss = generateTenantCss({
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    rounded: isRounded,
    radius: radiusValue,
    autoDarkMode: true
  });

  // --- Envío del formulario con Server Action ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('idle');
    setStatusMessage('');

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('tenantId', tenantId);
        formData.append('primary', primaryColor);
        formData.append('secondary', secondaryColor);
        formData.append('accent', accentColor);
        formData.append('rounded', String(isRounded));
        formData.append('radius', radiusValue);

        if (logoFile) {
          formData.append('logo', logoFile);
        }
        if (faviconFile) {
          formData.append('favicon', faviconFile);
        }

        const response = await updateTenantBrandingAction(null, formData);

        if (response.success) {
          setSaveStatus('success');
          setStatusMessage(response.message);
          setLogoFile(null);
          setFaviconFile(null);
          toast.success(response.message || '¡Marca blanca propagada con éxito!');
        } else {
          setSaveStatus('error');
          setStatusMessage(response.message);
          toast.error(response.message || 'Ocurrió un error al guardar la marca blanca.');
        }
      } catch (err) {
        const error = err as Error;
        console.error('[BRANDING_SAVE_ERROR]', error);
        setSaveStatus('error');
        const errorMsg = error?.message || 'Error al conectar con el servidor.';
        setStatusMessage(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 bg-card border border-border rounded-xl shadow-sm">
      {/* 🛠️ Panel de Formulario (7 Columnas en LG) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles size={20} className="text-primary animate-pulse" />
            {t('title')}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* 🏢 Selector de Tenant Activo (para SuperAdmins con múltiples tenants) */}
        {allTenants && allTenants.length > 1 && (
          <div className="flex flex-col gap-2 p-4 bg-secondary/20 border border-border rounded-xl max-w-md">
            <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <Database size={12} aria-hidden="true" />
              Organización Seleccionada
            </label>
            <select
              value={tenantId}
              onChange={(e) => router.push(`/${locale}/admin/branding?tenantId=${e.target.value}`)}
              className="w-full bg-background border border-border hover:border-primary/40 text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-bold"
            >
              {allTenants.map(ten => (
                <option key={ten.tenantId} value={ten.tenantId}>{ten.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 🏞️ Cargas de Imagen */}
        <ImageUploadGroup 
          logoPreview={logoPreview}
          setLogoPreview={setLogoPreview}
          setLogoFile={setLogoFile}
          faviconPreview={faviconPreview}
          setFaviconPreview={setFaviconPreview}
          setFaviconFile={setFaviconFile}
        />

        {/* 🎨 Selectores Cromáticos */}
        <ColorPickerGroup 
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
        />

        {/* 📐 Estilo de Esquinas */}
        <BorderRadiusSelector 
          isRounded={isRounded}
          radiusValue={radiusValue}
          onRoundedChange={setIsRounded}
          onRadiusChange={setRadiusValue}
        />

        {/* 💾 Botones de Guardar */}
        <div className="flex items-center gap-4 mt-2">
          <button aria-label="Propagar Marca Blanca"
            type="submit" 
            disabled={isPending}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xs py-2.5 px-6 rounded transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
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

      {/* 👁️ Previsualizador en Vivo (5 Columnas en LG) */}
      <TenantBrandingPreview 
        tenantId={tenantId}
        logoPreview={logoPreview}
        faviconPreview={faviconPreview}
        previewCss={previewCss}
      />
    </div>
  );
}
