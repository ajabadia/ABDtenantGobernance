import { z } from 'zod';
import { TenantIdSchema } from './tenant';

export const SpaceTypeSchema = z.enum(['TENANT', 'TEAM', 'PERSONAL']);
export type SpaceType = z.infer<typeof SpaceTypeSchema>;

export const SpaceVisibilitySchema = z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE']);
export type SpaceVisibility = z.infer<typeof SpaceVisibilitySchema>;

export const SpaceSchema = z.object({
  _id: z.any().optional(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().min(1, 'El slug es obligatorio').regex(/^[a-z0-9-_]+$/, "Solo se permiten minúsculas, números, guiones y guiones bajos"),
  description: z.string().optional(),
  type: SpaceTypeSchema.default('TENANT'),
  tenantId: TenantIdSchema,
  ownerUserId: z.string().optional(),
  collaborators: z.array(z.object({
    subjectId: z.string(), // ID del usuario o del grupo
    subjectType: z.enum(['USER', 'GROUP']).default('USER'),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
    propagates: z.boolean().default(true), // Propagación jerárquica hacia los hijos
    joinedAt: z.coerce.date().default(() => new Date()),
  })).default([]),
  parentSpaceId: z.string().nullable().optional(),
  materializedPath: z.string().optional(), // ej. "/mates/algebra"
  visibility: SpaceVisibilitySchema.default('INTERNAL'),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
});

export type Space = z.infer<typeof SpaceSchema>;

export const AssetSpaceLinkSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  assetId: z.string(),
  spaceId: z.string(),
  spacePath: z.string(), // Denormalizado para búsqueda rápida por jerarquía
  isPrimary: z.boolean().default(true),
  createdAt: z.coerce.date().default(() => new Date()),
  createdBy: z.string().optional(),
});

export type AssetSpaceLink = z.infer<typeof AssetSpaceLinkSchema>;
