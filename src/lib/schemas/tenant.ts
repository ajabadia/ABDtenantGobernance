import { z } from 'zod';

export const TenantIdSchema = z.string().regex(/^[a-z0-9-_]+$/, "Solo se permiten minúsculas, números, guiones y guiones bajos");

export const TenantSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  name: z.string().min(2, "El nombre del tenant debe tener al menos 2 caracteres"),
  industry: z.string().optional().default('Industrial'),
  dbPrefix: z.preprocess(
    (val) => val === null || val === undefined || val === "" ? 'abd_' : val,
    z.string().min(2, "El prefijo de la base de datos debe tener al menos 2 caracteres").default('abd_')
  ),
  isolationStrategy: z.preprocess(
    (val) => val === null || val === undefined ? 'COLLECTION_PREFIX' : val,
    z.enum(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT']).default('COLLECTION_PREFIX')
  ),
  active: z.preprocess(
    (val) => typeof val === 'boolean' ? val : true,
    z.boolean().default(true)
  ),
  branding: z.object({
    logo: z.object({
      url: z.string().url().optional().or(z.null()).or(z.literal('')),
      publicId: z.string().optional(),
    }).optional(),
    favicon: z.object({
      url: z.string().url().optional().or(z.null()).or(z.literal('')),
      publicId: z.string().optional(),
    }).optional(),
    colors: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal válido"),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal válido").optional(),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal válido").optional(),
      primaryDark: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal válido").optional(),
      accentDark: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal válido").optional(),
    }).optional(),
    autoDarkMode: z.boolean().default(true).optional(),
    rounded: z.boolean().optional().default(true),
    radius: z.string().regex(/^[0-9.]+(rem|px|em|%)$/, "Formato de radio inválido (ej. 0.5rem o 8px)").optional().default('0.75rem'),
  }).optional(),
  billing: z.object({
    fiscalName: z.string().optional(),
    taxId: z.string().optional(),
    shippingAddress: z.object({
      line1: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
  customSpaceLabels: z.array(z.string()).default(['Workspace', 'Espacio', 'Carpeta']),
  spaceCount: z.number().optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;
