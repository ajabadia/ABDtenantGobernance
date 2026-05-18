# 🎨 Consola de Personalización Dinámica Multi-Tenant: TenantBrandingForm

Esta especificación detalla el diseño e implementación técnica del componente **`TenantBrandingForm.tsx`** y su controlador de persistencia y carga de archivos en la nube utilizando **Vercel Blob Storage**.

---

## 🏛️ 1. Arquitectura de Carga y Previsualización

Para lograr una experiencia interactiva fluida sin retardo de red, la consola utiliza un **flujo de doble canal**:
1.  **Canal Cliente (Live Preview)**: A medida que el administrador arrastra los selectores de color o modifica las esquinas, un estado reactivo local recalcula las variables HSL y las inyecta en línea en una caja de simulación lateral (*Live Preview Box*).
2.  **Canal Servidor (Upload & Persist)**: Al guardar, la imagen del logotipo es transmitida directamente a **Vercel Blob Storage** mediante una Server Action segura, la cual retorna la URL de CDN e inicia la persistencia en MongoDB aplicando la sanitización estricta de `TenantSchema`.

---

## 💻 2. El Componente React: `TenantBrandingForm.tsx`

Este componente está diseñado bajo estándares de la **Era 11** (TypeScript estricto, Tailwind CSS v4, interactividad fluida y micro-animaciones).

```tsx
"use client";

import React, { useState, useTransition, useRef } from 'react';
import { Upload, Check, RefreshCw, Eye, Sparkles, Layout, Database } from 'lucide-react';
import { generateTenantCss } from '@abd/styles';
import { updateTenantBrandingAction } from '@/actions/branding';

interface TenantBrandingFormProps {
  tenantId: string;
  initialBranding?: {
    logoUrl?: string | null;
    theme?: {
      primary: string;
      secondary?: string;
      background?: string;
      rounded?: boolean;
      radius?: string;
    };
  };
}

export function TenantBrandingForm({ tenantId, initialBranding }: TenantBrandingFormProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Estados locales del formulario ---
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.theme?.primary || '#06b6d4');
  const [secondaryColor, setSecondaryColor] = useState(initialBranding?.theme?.secondary || '#1e293b');
  const [backgroundColor, setBackgroundColor] = useState(initialBranding?.theme?.background || '#0b0f19');
  const [isRounded, setIsRounded] = useState(initialBranding?.theme?.rounded ?? true);
  const [radiusValue, setRadiusValue] = useState(initialBranding?.theme?.radius || '0.75rem');
  
  // --- Estados de archivo e imagen de logo ---
  const [logoPreview, setLogoPreview] = useState<string | null>(initialBranding?.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- Controlador de cambio de logo ---
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Crear preview local en memoria
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Generar el CSS inyectado para el simulador lateral en tiempo real ---
  const previewCss = generateTenantCss({
    primary: primaryColor,
    secondary: secondaryColor,
    background: backgroundColor,
    rounded: isRounded,
    radius: radiusValue
  });

  // --- Acción de guardado ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('idle');

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('tenantId', tenantId);
        formData.append('primary', primaryColor);
        formData.append('secondary', secondaryColor);
        formData.append('background', backgroundColor);
        formData.append('rounded', String(isRounded));
        formData.append('radius', radiusValue);
        
        if (logoFile) {
          formData.append('logo', logoFile);
        }

        const result = await updateTenantBrandingAction(formData);

        if (result.success) {
          setSaveStatus('success');
          if (result.logoUrl) {
            setLogoPreview(result.logoUrl);
            setLogoFile(null);
          }
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('[BRANDING_SAVE_ERROR]', error);
        setSaveStatus('error');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 bg-[#0b0f19] border border-white/5 rounded-xl shadow-2xl">
      {/* Estilo inyectado dinámicamente que TIÑE ÚNICAMENTE la caja de previsualización (usando scoping de clase) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #simulated-satellite-preview {
            ${previewCss.replace(/:root/g, '#simulated-satellite-preview')}
          }
        `
      }} />

      {/* 🛠️ Panel de Formulario e Inputs (8 Columnas en LG) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-[#06b6d4]" />
            Personalización de Identidad Visual
          </h2>
          <p className="text-xs text-gray-400">
            Define la paleta de colores corporativos, bordes y logotipo oficial para tu academia/organización.
          </p>
        </div>

        {/* 🏞️ Carga de Logotipo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Logotipo Oficial</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-[#06b6d4]/50 rounded-lg p-6 bg-white/[0.02] cursor-pointer transition-all duration-200"
          >
            {logoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img src={logoPreview} alt="Logo Preview" className="h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
                <span className="text-[10px] text-gray-400 group-hover:text-[#06b6d4]">Haga clic para cambiar</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-white">
                <Upload size={24} className="group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs">Cargar logotipo (PNG/SVG, Max 2MB)</span>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleLogoChange} 
              className="hidden" 
            />
          </div>
        </div>

        {/* 🎨 Selectores de Color */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-lg">
            <label className="text-[10px] font-semibold uppercase text-gray-400">Color Primario</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)} 
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white">{primaryColor.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-lg">
            <label className="text-[10px] font-semibold uppercase text-gray-400">Color Secundario</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={secondaryColor} 
                onChange={(e) => setSecondaryColor(e.target.value)} 
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white">{secondaryColor.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-lg">
            <label className="text-[10px] font-semibold uppercase text-gray-400">Fondo Simulador</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)} 
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white">{backgroundColor.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* 📐 Estilo de Esquinas */}
        <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-white">Bordes Redondeados</span>
              <span className="text-[10px] text-gray-400">Habilita esquinas suaves en tarjetas y botones.</span>
            </div>
            <input 
              type="checkbox" 
              checked={isRounded} 
              onChange={(e) => setIsRounded(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#06b6d4] focus:ring-[#06b6d4] cursor-pointer"
            />
          </div>

          {isRounded && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Radio de Bordes</label>
              <select 
                value={radiusValue} 
                onChange={(e) => setRadiusValue(e.target.value)}
                className="bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white focus:border-[#06b6d4] focus:outline-none"
              >
                <option value="0.15rem">Ciber-Industrial Fino (0.15rem)</option>
                <option value="0.375rem">Suave Estándar (0.375rem)</option>
                <option value="0.5rem">Orgánico Intermedio (0.5rem)</option>
                <option value="0.75rem">Redondeado Premium (0.75rem)</option>
                <option value="1rem">Circular Redondo (1.0rem)</option>
              </select>
            </div>
          )}
        </div>

        {/* 💾 Botón de Envío y Mensajes de Estado */}
        <div className="flex items-center gap-4 mt-2">
          <button 
            type="submit" 
            disabled={isPending}
            className="flex items-center justify-center gap-2 bg-[#06b6d4] hover:bg-[#0891b2] text-black font-semibold text-xs py-2.5 px-5 rounded transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {saveStatus === 'success' && (
            <span className="text-xs text-emerald-500 font-medium animate-in slide-in-from-left-2 duration-200">
              ¡Branding guardado y propagado con éxito!
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-rose-500 font-medium animate-in slide-in-from-left-2 duration-200">
              Ocurrió un error al persistir la marca.
            </span>
          )}
        </div>
      </form>

      {/* 👁️ Previsualizador en Vivo (5 Columnas en LG) */}
      <div className="lg:col-span-5 flex flex-col gap-4 border-l border-white/5 pl-0 lg:pl-8 pt-6 lg:pt-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Eye size={14} className="text-gray-400" />
          Previsualizador en Tiempo Real
        </h3>

        {/* Caja del Simulador Satélite Virtual */}
        <div 
          id="simulated-satellite-preview"
          className="relative flex flex-col justify-between aspect-video rounded-xl p-5 border border-white/10 transition-colors duration-300 overflow-hidden"
          style={{ backgroundColor: backgroundColor }}
        >
          {/* Header del Simulador */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              {logoPreview ? (
                <img src={logoPreview} alt="Simulated Logo" className="h-6 object-contain" />
              ) : (
                <Layout size={18} className="text-[var(--primary)]" />
              )}
              <span className="text-[10px] font-bold text-white tracking-widest">ABD SATÉLITE</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Cuerpo del Simulador */}
          <div className="flex flex-col gap-2 my-4">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-[var(--radius)]">
              <span className="text-[10px] text-gray-400 block mb-0.5">Control de Aula</span>
              <span className="text-xs font-semibold text-white">Introducción al Ecosistema</span>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                className="flex-1 py-1.5 px-3 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold uppercase rounded-[var(--radius)] cursor-default transition-all duration-200"
              >
                Iniciar Examen
              </button>
              <button 
                type="button"
                className="flex-1 py-1.5 px-3 border border-white/10 text-white text-[10px] rounded-[var(--radius)] cursor-default"
              >
                Volver
              </button>
            </div>
          </div>

          {/* Footer del Simulador */}
          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-gray-500">
            <span className="flex items-center gap-1">
              <Database size={10} />
              Prefijo: active-db
            </span>
            <span>v1.0.0</span>
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg text-[10px] text-gray-400 flex flex-col gap-1.5">
          <span className="font-semibold text-white">Accesibilidad en Vivo:</span>
          <span>El botón "Iniciar Examen" recalcula automáticamente su contraste de color de primer plano (**YIQ Contrast**) para asegurar legibilidad WCAG nativa si arrastras el color a tonalidades muy claras u oscuras.</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔌 3. La Server Action: `updateBrandingAction.ts`

Ubicación recomendada: `src/actions/branding.ts`

Controlador que intercepta la transmisión, sube el archivo a **Vercel Blob Storage** de forma segura, y actualiza los metadatos en MongoDB.

```typescript
"use server";

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { TenantSchema } from '@/lib/schemas/auth';

interface SaveBrandingResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

export async function updateTenantBrandingAction(formData: FormData): Promise<SaveBrandingResult> {
  try {
    const tenantId = formData.get('tenantId') as string;
    const primary = formData.get('primary') as string;
    const secondary = formData.get('secondary') as string;
    const background = formData.get('background') as string;
    const rounded = formData.get('rounded') === 'true';
    const radius = formData.get('radius') as string;
    const logoFile = formData.get('logo') as File | null;

    if (!tenantId) {
      return { success: false, error: "Missing tenantId" };
    }

    // 1. Recuperar el tenant existente en base de datos
    const existingTenant = await tenantRepository.findByTenantId(tenantId);
    if (!existingTenant) {
      return { success: false, error: "Tenant not found" };
    }

    // 2. Cargar imagen a Vercel Blob si se proporciona
    let logoUrl = existingTenant.branding?.logoUrl || null;
    if (logoFile && logoFile.size > 0) {
      // Subir archivo al CDN con nombres controlados para evitar colisiones
      const filename = `logos/${tenantId}-${Date.now()}-${logoFile.name}`;
      const blob = await put(filename, logoFile, {
        access: 'public',
        contentType: logoFile.type
      });
      logoUrl = blob.url;
    }

    // 3. Compilar el nuevo objeto branding
    const updatedBranding = {
      logoUrl,
      theme: {
        primary,
        secondary,
        background,
        rounded,
        radius
      }
    };

    // 4. Validar y sanitizar la estructura parcial utilizando el Zod Schema central
    const validatedBranding = TenantSchema.shape.branding.parse(updatedBranding);

    // 5. Persistir en la base de datos a nivel de repositorio
    const updateResult = await tenantRepository.update(String(existingTenant._id), {
      branding: validatedBranding,
      updatedAt: new Date()
    });

    if (!updateResult) {
      return { success: false, error: "Failed to persist database update" };
    }

    // Limpiar caché de Next.js en la consola
    revalidatePath('/dashboard/tenants');
    
    return { 
      success: true, 
      logoUrl: logoUrl || undefined 
    };

  } catch (error: any) {
    console.error('[SERVER_ACTION_BRANDING_ERROR]', error);
    return { success: false, error: error.message || "Internal Server Error" };
  }
}
```

---

## 📦 4. Guía de Integración de Vercel Blob Storage

Para conectar de forma exitosa la subida a la nube en tu servidor local y de producción:

### 1. Instalación de Dependencia
Ejecuta en la terminal del proyecto `ABDtenantGobernance`:
```bash
npm install @vercel/blob
```

### 2. Variables de Entorno (.env)
Añade el Token de acceso de Vercel Blob en tu archivo `.env` local:
```env
# Token del bucket de Vercel Blob Storage (Obtenido desde el panel de Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx..."
```
*(Nota: El SDK de `@vercel/blob` busca e integra esta variable de entorno de forma automática al invocar la función `put()` en el lado del servidor).*
