# 📜 Santuario de Lecciones Aprendidas - ABD Gobernanza

Este documento reúne las lecciones críticas de ingeniería de software, resoluciones de fallas silenciosas y estándares arquitectónicos establecidos durante el desarrollo e integración del sistema de Gobernanza de Tenants en **ABD Gobernanza**.

---

## 🎨 1. Interpolación de Colores en Tailwind CSS v4

### El Síntoma
Al inyectar dinámicamente colores de marca blanca desde la base de datos mediante variables CSS locales en `layout.tsx`, los estilos del cliente se rompían o se renderizaban de color negro inerte, a pesar de que el código hexadecimal (`#06b6d4`) estuviese correctamente definido.

### La Causa Raíz
Tailwind CSS v4 utiliza un nuevo motor de procesamiento que requiere que las variables de color del tema (ej: `--primary`, `--secondary`) inyectadas dinámicamente contengan valores en **formato HSL separados por espacios** (ej: `188 85% 48%`), en lugar de cadenas hexadecimales estándar o formatos `hsl(x, y, z)`. Si no se respeta esto, la función interna `hsl(var(--primary))` no se resuelve y el navegador ignora la regla.

### La Solución Industrial
Utilizar siempre la función `generateTenantCss` provista por el paquete centralizado `@abd/styles`. Dicha función procesa el hexadecimal en tiempo de ejecución, realiza la conversión bit a bit y emite las variables HSL compatibles:
```typescript
import { generateTenantCss } from '@abd/styles';

const cssVariables = generateTenantCss(tenantConfig);
// Emite: --primary: 188 85% 48%; --secondary: 200 40% 12%;
```

---

## ⚙️ 2. Coexistencia de Webpack y Turbopack (`next.config.mjs`)

### El Síntoma
Next.js arrojaba errores en tiempo de ejecución al buscar dependencias y módulos del compilador en caliente:
`Cannot find module '../chunks/ssr/[turbopack]_runtime.js' Require stack: _document.js`

### La Causa Raíz
La presencia de la clave `turbopack: {}` (incluso vacía) en `next.config.mjs` forzaba a Next.js a intentar resolver rutas de compilación específicas de Turbopack aun cuando el servidor de desarrollo se estaba ejecutando con el motor Webpack tradicional (sin la bandera `--turbo`), rompiendo el enlazado interno del framework.

### La Solución Industrial
Eliminar completamente la clave `turbopack` del archivo de configuración global `next.config.mjs` si el entorno local corre Webpack de manera estándar. Esto garantiza que Next.js detecte y configure automáticamente el runtime del motor activo sin generar colisiones de caché de compilación:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantener solo configuraciones puras e independientes del compilador
  reactStrictMode: true,
};
export default nextConfig;
```

---

## 🗃️ 3. Transición de Tipados en Mongoose 9.x (`QueryFilter<T>`)

### El Síntoma
Errores estáticos del compilador de TypeScript al intentar pasar objetos de filtro (como `{ tenantId }`) a métodos de consulta como `Model.find()` o `Model.findOne()` heredados en repositorios base.

### La Causa Raíz
En Mongoose 9.x, el tipo genérico tradicional `FilterQuery<T>` ha sido deprecado/reemplazado en sus firmas de método internas por **`QueryFilter<T>`** para garantizar la pureza y la prevención de inyección NoSQL.

### La Solución Industrial
Actualizar todos los repositorios genéricos y operaciones manuales para importar y firmar los filtros estrictamente con `QueryFilter<T>` desde `'mongoose'`:
```typescript
import type { QueryFilter } from 'mongoose';

async findOne(filter: QueryFilter<T>): Promise<T | null> {
  return await this.model.findOne(filter).exec();
}
```

---

## 🛡️ 4. Serialización Segura Server-to-Client en Next.js 16 (React 19)

### El Síntoma
Hydration mismatches y errores de paso de propiedades en tiempo de ejecución al intentar inyectar documentos Mongoose recuperados en Server Components (como `page.tsx`) directamente a Client Components interactivos.

### La Causa Raíz
React 19 y Next.js 16 imponen una política estricta de paso de datos entre capas. Los documentos de Mongoose contienen objetos complejos (como `_id` de tipo `ObjectId` o fechas `Date`) que no son directamente serializables, lo que provoca que el cliente y el servidor difieran en su estructura JSON inicial.

### La Solución Industrial
Aplicar una serialización profunda y atómica en el Server Component antes del pasaje de props:
```typescript
const initialTenants = await TenantService.getAllTenants();
const serialized = JSON.parse(JSON.stringify(initialTenants));
// Ahora serialized es un JSON puro compatible con Client Components.
```

---

## 🛡️ 5. Resiliencia de Datos Heredados y Preprocesamiento en Zod

### El Síntoma
Lanzamiento de excepciones `Runtime ZodError` (ej: `Expected string, received undefined` o `received null` para campos obligatorios como `dbPrefix` u `isolationStrategy`) al cargar listas de tenants de la base de datos federada de producción en el servidor de Next.js.

### La Causa Raíz
En bases de datos compartidas o entornos que han evolucionado históricamente, existen documentos antiguos (legacy) creados antes de la adición de campos requeridos por esquemas modernos. Aunque Mongoose no bloquea la lectura de dichos registros, al intentar parsear la consulta mediante Zod (`TenantSchema.parse`), el objeto falla la validación estática al carecer de los atributos requeridos o poseer valores nulos obsoletos.

### La Solución Industrial
Utilizar `z.preprocess()` en el esquema Zod para interceptar de forma transparente los valores nulos, vacíos u omitidos y transformarlos en valores seguros por defecto antes de aplicar la regla de validación final. Esto blinda al backend ante datos sucios sin comprometer la pureza de los tipos TypeScript inferidos:
```typescript
dbPrefix: z.preprocess(
  (val) => val === null || val === undefined || val === "" ? 'abd_' : val,
  z.string().min(2).default('abd_')
),
isolationStrategy: z.preprocess(
  (val) => val === null || val === undefined ? 'COLLECTION_PREFIX' : val,
  z.enum(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT']).default('COLLECTION_PREFIX')
)
```

---

## 🎨 6. Arquitectura UX Multi-Tenant: Selector de Contexto (*Context Switcher*) Dinámico

### El Síntoma
Dificultad de usabilidad o fricción operativa para un administrador global (SuperAdmin) al gestionar múltiples marcas blancas de forma independiente. Si el menú lateral ofrece un enlace estático a "White-Labeling", el usuario se ve obligado a volver a la lista general de tenants para entrar en el contexto de otra organización, o bien la vista se mantiene rígida para el tenant asignado al inicio de sesión.

### La Causa Raíz
Los enlaces estáticos de la barra lateral asumen que el contexto de tenant está acoplado de forma rígida a la sesión del usuario autenticado (`user.tenantId`). Aunque este comportamiento es perfecto para clientes estándar de un solo tenant (TenantAdmin), rompe el flujo de trabajo ágil y productivo de los operadores del ecosistema (SuperAdmins), quienes requieren gestionar y comparar identidades visuales fluidamente.

### La Solución Industrial
Implementar un enrutamiento basado en parámetros de consulta (`searchParams`) acoplado a un selector de contexto interactivo en caliente (*Context Switcher*):
1. **Navegación Dinámica Scoped**: La página administrativa recibe de forma asíncrona un `tenantId` opcional en la consulta (`?tenantId=ID`).
2. **Context Switcher en el Formulario**: Si el usuario autenticado tiene permisos globales (SuperAdmin), el backend le inyecta la lista completa de organizaciones activas. La interfaz del formulario renderiza un dropdown de selección dinámico de alta fidelidad.
3. **Redirección Fluida**: El evento `onChange` del selector interactúa reactivamente con el router del framework (`router.push`) para refrescar la marca y el simulador en vivo instantáneamente sin perder el estado de la aplicación.

---

## 🧩 7. Validación Estricta de Nodos Raíz (Zod null vs undefined)

### El Síntoma
Error en tiempo de ejecución: `Invalid input: expected string, received null` al intentar crear un espacio principal u organización de nivel raíz (sin padre estructural).

### La Causa Raíz
Definir `parentSpaceId: z.string().optional()` permite que el campo sea omitido (`undefined`), pero fallará silenciosamente si el front-end o un control de formulario envía un `null` explícito para indicar "sin padre". Mongoose admite la nulabilidad, pero Zod corta el circuito al detectar un tipo de dato ajeno a string.

### La Solución Industrial
Usar `.nullable().optional()` para garantizar un contrato inquebrantable entre front-end y back-end, autorizando formalmente el paso de `null` como representación de nivel cero:
```typescript
parentSpaceId: z.string().nullable().optional(),
```

---

## ♿ 8. Falsos Negativos de Accesibilidad (A11y) en Motores Regex

### El Síntoma
Escáneres de código estático y auditorías a medida fallan con el error `Button missing label`, aunque el botón posea el atributo dinámico `aria-label={t('new_space')}` perfectamente colocado.

### La Causa Raíz
Herramientas de parseo basadas en Regex (como el script nativo de guardias de arquitectura) suelen detectar prematuramente el cierre de etiqueta cuando el manejador de eventos contiene una arrow function (ej. `onClick={() => ...}`). El carácter `>` del closure se interpreta como el cierre de `<button>`, truncando la lectura antes de alcanzar los metadatos de accesibilidad subyacentes.

### La Solución Industrial
Para blindarse ante AST/Regex limitados sin sacrificar funcionalidad, los identificadores vitales (`aria-label`, `key`, `id`, `data-testid`) deben declararse siempre en la primera línea de apertura o antes de pasar callbacks complejos:
```tsx
<button aria-label={t.actions.edit}
  onClick={() => onEdit(tenant)}
  className="..."
>
```


