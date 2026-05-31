"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { updateTenantBrandingAction } from '@/actions/branding';

interface RoleLiteralsData {
  CREATOR: { es: string; en: string };
  RECIPIENT: { es: string; en: string };
  AUDITOR: { es: string; en: string };
}

interface BrandingInitialData {
  logo?: { url?: string | null; publicId?: string };
  favicon?: { url?: string | null; publicId?: string };
  fromName?: string;
  colors?: { primary: string; secondary?: string; accent?: string };
  rounded?: boolean;
  radius?: string;
}

export function useBrandingForm(
  tenantId: string,
  initial?: BrandingInitialData,
  initialRoleLiterals?: { roleLiterals: RoleLiteralsData }
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [primaryColor, setPrimaryColor] = useState(initial?.colors?.primary || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(initial?.colors?.secondary || '#1e293b');
  const [accentColor, setAccentColor] = useState(initial?.colors?.accent || '#3b82f6');
  const [isRounded, setIsRounded] = useState(initial?.rounded ?? true);
  const [radiusValue, setRadiusValue] = useState(initial?.radius || '0.75rem');
  const [fromName, setFromName] = useState(initial?.fromName || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logo?.url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(initial?.favicon?.url || null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [roleLiterals, setRoleLiterals] = useState<RoleLiteralsData>(
    initialRoleLiterals?.roleLiterals ?? {
      CREATOR: { es: 'Creador', en: 'Creator' },
      RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
      AUDITOR: { es: 'Auditor', en: 'Auditor' },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('idle');
    setStatusMessage('');

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('fromName', fromName);
        formData.append('tenantId', tenantId);
        formData.append('primary', primaryColor);
        formData.append('secondary', secondaryColor);
        formData.append('accent', accentColor);
        formData.append('rounded', String(isRounded));
        formData.append('radius', radiusValue);
        if (logoFile) formData.append('logo', logoFile);
        if (faviconFile) formData.append('favicon', faviconFile);
        formData.append('roleLiteral_CREATOR_es', roleLiterals.CREATOR.es);
        formData.append('roleLiteral_CREATOR_en', roleLiterals.CREATOR.en);
        formData.append('roleLiteral_RECIPIENT_es', roleLiterals.RECIPIENT.es);
        formData.append('roleLiteral_RECIPIENT_en', roleLiterals.RECIPIENT.en);
        formData.append('roleLiteral_AUDITOR_es', roleLiterals.AUDITOR.es);
        formData.append('roleLiteral_AUDITOR_en', roleLiterals.AUDITOR.en);

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
        setSaveStatus('error');
        const errorMsg = error?.message || 'Error al conectar con el servidor.';
        setStatusMessage(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  return {
    isPending, primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    accentColor, setAccentColor,
    isRounded, setIsRounded,
    radiusValue, setRadiusValue,
    fromName, setFromName,
    logoPreview, setLogoPreview,
    logoFile, setLogoFile,
    faviconPreview, setFaviconPreview,
    faviconFile, setFaviconFile,
    saveStatus, statusMessage,
    roleLiterals, setRoleLiterals,
    handleSubmit,
  };
}
