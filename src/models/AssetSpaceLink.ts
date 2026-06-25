/**
 * @purpose Gestiona un modelo de Mongoose para el ente `AssetSpaceLink`, que representa la relación entre activos y espacios dentro de un inquilino.
 * @purpose_en Defines a Mongoose model for the `AssetSpaceLink` entity, which represents the relationship between assets and spaces within a tenant.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:13hk2ty
 * @lastUpdated 2026-06-23T21:48:03.774Z
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';;

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
