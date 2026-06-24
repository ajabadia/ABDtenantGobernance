/**
 * @purpose Gestiona pertenencias de grupo de usuarios dentro de un inquilino utilizando la esquema de Mongoose.
 * @purpose_en Manages user group memberships within a tenant using Mongoose schema.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:14ziykm
 * @lastUpdated 2026-06-23T21:52:02.542Z
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk';

export interface IUserGroupMembership extends Document {
  tenantId: string;
  userId: string;
  groupId: mongoose.Types.ObjectId;
  assignedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserGroupMembershipSchema = new Schema<IUserGroupMembership>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'PermissionGroup', required: true, index: true },
    assignedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Un usuario no puede estar asignado al mismo grupo más de una vez en el mismo tenant
UserGroupMembershipSchema.index({ tenantId: 1, userId: 1, groupId: 1 }, { unique: true });

const UserGroupMembership: Model<IUserGroupMembership> =
  mongoose.models.UserGroupMembership ||
  getTenantModel<IUserGroupMembership>('UserGroupMembership', UserGroupMembershipSchema);

export default UserGroupMembership;
