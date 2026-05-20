import mongoose, { Schema, Document, Model } from 'mongoose';

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
  mongoose.model<IPermissionGroup>('PermissionGroup', PermissionGroupSchema);

export default PermissionGroup;
