/**
 * @purpose Gestiona un modelo de Mongoose para el ente `DelegatedRole`, que representa roles delegados dentro de un inquilino con políticas y restricciones temporales asociadas.
 * @purpose_en Defines a Mongoose model for the `DelegatedRole` entity, which represents roles delegated within a tenant with associated policies and time constraints.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:qgg1nb
 * @lastUpdated 2026-06-23T21:51:24.924Z
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';;

export interface IDelegatedRole extends Document {
  tenantId: string;
  delegatorId: string;
  delegateeId: string;
  groupIds: mongoose.Types.ObjectId[];
  policyIds: mongoose.Types.ObjectId[];
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DelegatedRoleSchema = new Schema<IDelegatedRole>(
  {
    tenantId: { type: String, required: true, index: true },
    delegatorId: { type: String, required: true, index: true },
    delegateeId: { type: String, required: true, index: true },
    groupIds: [{ type: Schema.Types.ObjectId, ref: 'PermissionGroup' }],
    policyIds: [{ type: Schema.Types.ObjectId, ref: 'PermissionPolicy' }],
    startsAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    reason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Helper para consultas rápidas de delegaciones temporales activas
DelegatedRoleSchema.index({ tenantId: 1, delegateeId: 1, isActive: 1, startsAt: 1, expiresAt: 1 });

const DelegatedRole: Model<IDelegatedRole> =
  mongoose.models.DelegatedRole ||
  getTenantModel<IDelegatedRole>('DelegatedRole', DelegatedRoleSchema);

export default DelegatedRole;
