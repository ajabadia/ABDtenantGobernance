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
    userId: z.string(),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
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
