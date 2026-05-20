import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPermissionPolicy extends Document {
  tenantId: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  conditions?: {
    ipRange?: string[];
    timeWindow?: {
      start: string; // "HH:MM"
      end: string;   // "HH:MM"
      days?: number[]; // [1,2,3,4,5] (Monday=1, Sunday=7)
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionPolicySchema = new Schema<IPermissionPolicy>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    effect: { type: String, enum: ['ALLOW', 'DENY'], default: 'ALLOW', required: true },
    resources: [{ type: String, required: true }],
    actions: [{ type: String, required: true }],
    conditions: {
      ipRange: [{ type: String }],
      timeWindow: {
        start: { type: String },
        end: { type: String },
        days: [{ type: Number }],
      },
    },
    isActive: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound index to speed up policy resolutions per tenant
PermissionPolicySchema.index({ tenantId: 1, isActive: 1 });

const PermissionPolicy: Model<IPermissionPolicy> =
  mongoose.models.PermissionPolicy ||
  mongoose.model<IPermissionPolicy>('PermissionPolicy', PermissionPolicySchema);

export default PermissionPolicy;
