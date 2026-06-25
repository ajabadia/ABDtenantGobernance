/**
 * @purpose Gestiona un esquema de mongoose y modelo para administrar grupos de permisos dentro de un inquilino en el proyecto ABDSuite.
 * @purpose_en Defines a Mongoose schema and model for managing permission groups within a tenant in the ABDSuite project.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:pkfk7y
 * @lastUpdated 2026-06-23T21:51:34.646Z
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';;

export interface IPermissionGroup extends Document {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  policyIds: mongoose.Types.ObjectId[];
  allowedApps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionGroupSchema = new Schema<IPermissionGroup>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'PermissionGroup', index: true },
    policyIds: [{ type: Schema.Types.ObjectId, ref: 'PermissionPolicy' }],
    allowedApps: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Slugs must be unique per tenant
PermissionGroupSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const PermissionGroup: Model<IPermissionGroup> =
  mongoose.models.PermissionGroup ||
  getTenantModel<IPermissionGroup>('PermissionGroup', PermissionGroupSchema);

export default PermissionGroup;
