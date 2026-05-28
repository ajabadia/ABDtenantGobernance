# 🏛️ Plano de Gobernanza Multi-Tenant y Guía de Portabilidad

Este documento consolida la especificación arquitectónica, el catálogo completo de código desarrollado en la suite **ABD (ABDAuth & ABDQuiz)** y el plan de transferencia técnica para desplegar la nueva aplicación dedicada a la **Gobernanza de Tenants (`ABDtenantGobernance`)**.

---

## 🧭 1. El Modelo de Gobernanza Multi-Tenant

En el ecosistema federado ABD, la gobernanza de organizaciones (Tenants) se rige por tres pilares inviolables:
1.  **Aislamiento Autónomo (Isolation Strategy)**: Soporte nativo para segmentar datos por prefijos de colección (`COLLECTION_PREFIX` para entornos de bajo coste compartidos) o por bases de datos independientes (`DATABASE_PER_TENANT` para clientes corporativos de alto cumplimiento).
2.  **Identidad Consistente**: El contexto del tenant y el rol del usuario se inyectan en los claims JWT (`tid`, `role`, `branding`) en el momento de la autenticación federada, propagándose sin estado a todos los satélites.
3.  **Branding Adaptivo (White Label)**: Inyección dinámica de variables de color HSL y bordes de esquina en el lado del servidor (SSR) para eliminar parpadeos de estilo visual (*FOUC - Flash of Unstyled Content*).

---

## 📂 2. Catálogo de Código Desarrollado (Módulos a Traspasar)

Para acelerar el desarrollo en la aplicación `ABDtenantGobernance`, se ha identificado y catalogado el 100% de las piezas desarrolladas en **ABDAuth** y **ABDQuiz** que gobiernan tenants. Estos módulos pueden traspasarse directamente:

### 📐 A. Definición de Esquemas de Datos (Zod)
Ubicación original: `abd-auth-web/src/lib/schemas/auth.ts` y `common.ts`

El `TenantSchema` define las directrices físicas de la base de datos, políticas de aislamiento y variables visuales de marca blanca:

```typescript
import { z } from 'zod';

export const TenantIdSchema = z.string().regex(/^[a-z0-9-_]+$/, "Only lowercase, numbers, hyphens and underscores allowed");

export const TenantSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  name: z.string(),
  industry: z.string().optional().default('Industrial'),
  dbPrefix: z.string().min(2, "Database prefix must be at least 2 chars"),
  isolationStrategy: z.enum(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT']).default('COLLECTION_PREFIX'),
  active: z.boolean().default(true),
  branding: z.object({
    logoUrl: z.string().url().optional().or(z.null()).or(z.literal('')),
    theme: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      rounded: z.boolean().optional().default(true),
      radius: z.string().regex(/^[0-9.]+(rem|px|em|%)$/).optional()
    }).optional()
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;
```

---

### 🗄️ B. Capa de Aislamiento de Datos (Repository Pattern)
Ubicación original: `abd-auth-web/src/lib/repositories/TenantAwareRepository.ts`

Clase abstracta de grado industrial que intercepta consultas y adjunta automáticamente el filtro `tenantId` según los privilegios del usuario (SUPER_ADMIN tiene bypass libre):

```typescript
import { type Document, type Filter } from 'mongodb';
import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🏢 TenantAwareRepository
 * Enforces strict tenant isolation based on session claims.
 */
export abstract class TenantAwareRepository<T extends Document> extends BaseRepository<T> {
  
  protected applySecurityFilter(session: IndustrialSession, filter: SafeFilter<T> = {}): Filter<T> {
    if (session.role === 'SUPER_ADMIN') {
      return filter;
    }
    return {
      ...filter,
      tenantId: session.tenantId
    } as Filter<T>;
  }

  async listForSession(session: IndustrialSession, filter: SafeFilter<T> = {}): Promise<T[]> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.list(securityFilter);
  }

  async findOneForSession(session: IndustrialSession, filter: SafeFilter<T>): Promise<T | null> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.findOne(securityFilter);
  }
}
```

---

### 🎨 C. Motor de Estilos Dinámicos (White Label Engine)
Ubicación original: `@ajabadia/styles` (`dist/utils/color-utils.js` y `dist/engine/css-generator.js`)

#### I. Utilidades Matemáticas de Color (`color-utils.js`):
Calcula contrastes YIQ accesibles y manipulación bitwise en hexadecimal para el modo oscuro:

```javascript
/**
 * YIQ contrast formula (WCAG compliance)
 */
export function getContrastColor(hexcolor) {
    if (!hexcolor || !hexcolor.startsWith('#')) return '#ffffff';
    try {
        const r = parseInt(hexcolor.substring(1, 3), 16);
        const g = parseInt(hexcolor.substring(3, 5), 16);
        const b = parseInt(hexcolor.substring(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    } catch (e) {
        return '#ffffff';
    }
}

/**
 * Bitwise Hexadecimal shifts for Deep Dark adaptation
 */
export function adjustColor(hex, percent) {
    if (!hex || !hex.startsWith('#')) return hex;
    try {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        const rVal = R < 255 ? (R < 0 ? 0 : R) : 255;
        const gVal = G < 255 ? (G < 0 ? 0 : G) : 255;
        const bVal = B < 255 ? (B < 0 ? 0 : B) : 255;
        return "#" + (0x1000000 + rVal * 0x10000 + gVal * 0x100 + bVal).toString(16).slice(1);
    } catch (e) {
        return hex;
    }
}

/**
 * Converts Hex to space-separated HSL components for Tailwind CSS v4 dynamic opacity support
 */
export function hexToHslComponents(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
```

#### II. Generador CSS Dinámico (`css-generator.js`):
Compila las variables en bloques atómicos inyectables:

```javascript
import { hexToHslComponents, getContrastColor, adjustColor } from './color-utils.js';

export function generateTenantCss(config) {
    const primaryHex = config.primary || '#06b6d4';
    const primaryHsl = hexToHslComponents(primaryHex);
    const primaryFgHex = getContrastColor(primaryHex);
    const primaryFgHsl = hexToHslComponents(primaryFgHex);

    const primaryDarkHex = adjustColor(primaryHex, 15);
    const primaryDarkHsl = hexToHslComponents(primaryDarkHex);
    const primaryDarkFgHex = getContrastColor(primaryDarkHex);
    const primaryDarkFgHsl = hexToHslComponents(primaryDarkFgHex);

    const radiusValue = config.rounded ? (config.radius || '0.75rem') : '0px';

    return `/* ABDStyles Dynamic Multi-Tenant Injection Gateway */
:root {
  --primary: ${primaryHsl} !important;
  --primary-foreground: ${primaryFgHsl} !important;
  --ring: ${primaryHsl} !important;
  --radius: ${radiusValue} !important;
}
.dark {
  --primary: ${primaryDarkHsl} !important;
  --primary-foreground: ${primaryDarkFgHsl} !important;
  --ring: ${primaryDarkHsl} !important;
}`;
}
```

---

### 🖥️ D. Componentes de Interfaz de Gobernanza (White Label CRUD)
Ubicación original: `abd-auth-web/src/components/admin/tenants/`

*   **`TenantManagementContainer.tsx`**: Contenedor principal que maneja los estados de modal de adición/edición de tenants y realiza fetch a las APIs REST.
*   **`TenantCard.tsx`**: Muestra información del tenant, color de marca seleccionado, prefijo de base de datos asignado y atajos de edición.
*   **`TenantForm.tsx`**: Formulario interactivo con vista previa en tiempo real del color primario HSL de la organización.
*   **`TenantDialog.tsx`**: Envoltura accesible mediante Radix UI para pantallas flotantes de edición.

---

### 🔌 E. Endpoints de API REST
Ubicación original: `abd-auth-web/src/app/api/admin/tenants/`

*   **`GET / POST` (`route.ts`)**: Lista las organizaciones asociadas al contexto de la sesión o inserta nuevos tenants validando unicidad de `tenantId` e inicializando dbPrefixes.
*   **`PATCH / DELETE` (`[id]/route.ts`)**: Permite actualizaciones parciales o eliminaciones atómicas del tenant.

---

## 🗺️ 3. Plan de Transferencia y Portabilidad

Para desplegar la aplicación de gobernanza `ABDtenantGobernance` con éxito a partir de estos activos, sigue este checklist secuencial:

### 🟩 Paso 1: Configurar la Base de Datos
*   Conecta `ABDtenantGobernance` al cluster de MongoDB Atlas de la suite.
*   Asegúrate de registrar en el `.env` la URI a la base de datos `ABDElevators-Auth`.

### 🟩 Paso 2: Importar la Capa de Datos e IAM
*   Copia los esquemas Zod (`auth.ts` / `common.ts`) a la nueva aplicación.
*   Crea la clase `TenantRepository` heredando de `TenantAwareRepository` para encapsular la persistencia física.

### 🟩 Paso 3: Clonar el Módulo de Controladores API
*   Copia los Route Handlers de `src/app/api/admin/tenants` a la carpeta `/api/tenants` en la nueva aplicación de gobernanza.
*   Valida que las llamadas comprueben la sesión del administrador federado llamando a `ABDAuth` para asegurar consistencia perimetral.

### 🟩 Paso 4: Desplegar el Dashboard Visual
*   Migra los componentes de UI (`TenantManagementContainer.tsx`, `TenantForm.tsx`, etc.).
*   Asegura que el formulario cargue el selector de color dinámico, permitiendo a los administradores modificar el logotipo y colores de la academia cómodamente.
