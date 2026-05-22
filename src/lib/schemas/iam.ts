import { z } from 'zod';
import { TenantIdSchema } from './tenant';

export const UserGroupMembershipSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  userId: z.string().min(1, "El ID de usuario es requerido"),
  groupId: z.string().min(1, "El ID de grupo es requerido"),
  assignedBy: z.string().optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
});

export const DelegatedRoleSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  delegatorId: z.string().min(1, "El delegador es requerido"),
  delegateeId: z.string().min(1, "El delegado es requerido"),
  groupIds: z.array(z.string()).default([]),
  policyIds: z.array(z.string()).default([]),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  isActive: z.boolean().default(true),
  reason: z.string().optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().optional(),
}).refine(data => data.startsAt < data.expiresAt, {
  message: "La fecha de inicio debe ser anterior a la fecha de fin",
  path: ["expiresAt"],
});

export type UserGroupMembershipType = z.infer<typeof UserGroupMembershipSchema>;
export type DelegatedRoleType = z.infer<typeof DelegatedRoleSchema>;
