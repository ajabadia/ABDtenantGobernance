import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk';

export interface IAssetSpaceLink extends Document {
  tenantId: string;
  assetId: string;
  spaceId: string;
  spacePath: string; // Denormalizado para velocidad jerárquica
  isPrimary: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSpaceLinkSchema = new Schema<IAssetSpaceLink>(
  {
    tenantId: { type: String, required: true, index: true },
    assetId: { type: String, required: true, index: true },
    spaceId: { type: String, required: true, index: true },
    spacePath: { type: String, required: true },
    isPrimary: { type: Boolean, default: true, index: true },
    createdBy: { type: String }
  },
  {
    timestamps: true
  }
);

// Índice compuesto único para evitar duplicidades de asociación
AssetSpaceLinkSchema.index({ tenantId: 1, assetId: 1, spaceId: 1 }, { unique: true });

const AssetSpaceLink: Model<IAssetSpaceLink> =
  mongoose.models.AssetSpaceLink || getTenantModel<IAssetSpaceLink>('AssetSpaceLink', AssetSpaceLinkSchema);

export default AssetSpaceLink;
