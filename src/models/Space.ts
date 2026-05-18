import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISpaceCollaborator {
  userId: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  joinedAt: Date;
}

export interface ISpace extends Document {
  name: string;
  slug: string;
  description?: string;
  type: 'TENANT' | 'TEAM' | 'PERSONAL';
  tenantId: string;
  ownerUserId?: string;
  collaborators: ISpaceCollaborator[];
  parentSpaceId?: string;
  materializedPath?: string;
  visibility: 'PUBLIC' | 'INTERNAL' | 'PRIVATE';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceMongooseSchema = new Schema<ISpace>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['TENANT', 'TEAM', 'PERSONAL'], default: 'TENANT' },
  tenantId: { type: String, required: true, index: true },
  ownerUserId: { type: String },
  collaborators: [{
    userId: { type: String, required: true },
    role: { type: String, enum: ['VIEWER', 'EDITOR', 'ADMIN'], default: 'VIEWER' },
    joinedAt: { type: Date, default: Date.now }
  }],
  parentSpaceId: { type: String, index: true },
  materializedPath: { type: String, index: true },
  visibility: { type: String, enum: ['PUBLIC', 'INTERNAL', 'PRIVATE'], default: 'INTERNAL' },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

// Índice compuesto para garantizar slugs únicos dentro de una jerarquía del mismo tenant
SpaceMongooseSchema.index({ tenantId: 1, parentSpaceId: 1, slug: 1 }, { unique: true });

const Space: Model<ISpace> = mongoose.models.Space || mongoose.model<ISpace>('Space', SpaceMongooseSchema);

export default Space;
