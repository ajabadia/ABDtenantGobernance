import { z } from 'zod';
import { TenantIdSchema } from './tenant';

export const PermissionPolicySchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  name: z.string().min(2, "El nombre de la política debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  effect: z.enum(['ALLOW', 'DENY']).default('ALLOW'),
  resources: z.array(z.string().min(1, "El recurso no puede estar vacío")).min(1, "Debe especificar al menos un recurso"),
  actions: z.array(z.string().min(1, "La acción no puede estar vacía")).min(1, "Debe especificar al menos una acción"),
  conditions: z.object({
    ipRange: z.array(z.string()).optional(),
    timeWindow: z.object({
      start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)").optional(),
      end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)").optional(),
      days: z.array(z.number().min(1).max(7)).optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
});

export const PermissionGroupSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  name: z.string().min(2, "El nombre del grupo debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es obligatorio").regex(/^[a-z0-9-_]+$/, "Solo se permiten minúsculas, números, guiones y guiones bajos"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  policyIds: z.array(z.string()).default([]),
  allowedApps: z.array(z.string()).default([]),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
});

export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
export type PermissionGroup = z.infer<typeof PermissionGroupSchema>;
