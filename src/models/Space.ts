/**
 * @purpose Gestiona un esquema de Mongoose y modelo para el ente "Space" en el proyecto ABDSuite, representando espacios organizativos con diversas características como nombre, slug, tipo, ID del inquilino, propietario, colaboradores, visibilidad y estado de actividad.
 * @purpose_en Defines a Mongoose schema and model for the "Space" entity in the ABDSuite project, representing organizational spaces with various attributes like name, slug, type, tenant ID, owner, collaborators, visibility, and activity status.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:dxbbih
 * @lastUpdated 2026-06-23T21:51:49.301Z
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export interface ISpaceCollaborator {
  subjectId: string;
  subjectType: 'USER' | 'GROUP';
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  propagates: boolean;
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
    subjectId: { type: String, required: true },
    subjectType: { type: String, enum: ['USER', 'GROUP'], default: 'USER' },
    role: { type: String, enum: ['VIEWER', 'EDITOR', 'ADMIN'], default: 'VIEWER' },
    propagates: { type: Boolean, default: true },
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

const Space: Model<ISpace> = mongoose.models.Space || getTenantModel<ISpace>('Space', SpaceMongooseSchema);

export default Space;
