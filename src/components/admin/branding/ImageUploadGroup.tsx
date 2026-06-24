'use client';

/**
 * @purpose Gestiona el subido y previsualización de un logo y favicon para fines de marca.
 * @purpose_en Manages the upload and preview of a logo and favicon for branding purposes.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:n2h98i
 * @lastUpdated 2026-06-23T21:44:25.717Z
 */

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
interface ImageUploadGroupProps {
  logoPreview: string | null;
  setLogoPreview: (preview: string | null) => void;
  setLogoFile: (file: File | null) => void;
  faviconPreview: string | null;
  setFaviconPreview: (preview: string | null) => void;
  setFaviconFile: (file: File | null) => void;
}

export function ImageUploadGroup({
  logoPreview,
  setLogoPreview,
  setLogoFile,
  faviconPreview,
  setFaviconPreview,
  setFaviconFile,
}: ImageUploadGroupProps) {
  const t = useTranslations('admin');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('invalidFileType', { defaultMessage: 'Invalid file format. Use JPG, PNG, WEBP, SVG or ICO' }));
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('fileTooLarge', { defaultMessage: 'File size must be under 2MB' }));
      return false;
    }
    return true;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateFile(file)) return;
      setLogoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateFile(file)) return;
      setFaviconFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Carga de Logotipo */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('logoLabel')}</label>
        <div 
          onClick={() => logoInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 rounded-lg p-5 bg-secondary/10 cursor-pointer transition-all duration-200 aspect-[16/9]"
        >
          {logoPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={logoPreview} alt="Logo Preview" className="h-10 max-w-full object-contain filter drop-shadow-sm" />
              <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors">{t('clickToChange')}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground">
              <Upload size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px]">{t('uploadLogo')}</span>
            </div>
          )}
          <input 
            ref={logoInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleLogoChange} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Carga de Favicon */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('faviconLabel')}</label>
        <div 
          onClick={() => faviconInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 rounded-lg p-5 bg-secondary/10 cursor-pointer transition-all duration-200 aspect-[16/9]"
        >
          {faviconPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={faviconPreview} alt="Favicon Preview" className="h-8 w-8 object-contain filter drop-shadow-sm" />
              <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors">{t('clickToChange')}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground">
              <Upload size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px]">{t('uploadFavicon')}</span>
            </div>
          )}
          <input 
            ref={faviconInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFaviconChange} 
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
}
