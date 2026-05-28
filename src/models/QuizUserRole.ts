import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizUserRole extends Document {
  tenantId: string;
  userId: string;
  scopeType: 'space' | 'course' | 'exam_config';
  scopeId: string;
  roleType: 'CREATOR' | 'AUDITOR';
  assignedBy: string;
}

const QuizUserRoleSchema = new Schema<IQuizUserRole>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    scopeType: {
      type: String,
      required: true,
      enum: ['space', 'course', 'exam_config'],
    },
    scopeId: { type: String, required: true },
    roleType: {
      type: String,
      required: true,
      enum: ['CREATOR', 'AUDITOR'],
    },
    assignedBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'QuizUserRole',
  }
);

QuizUserRoleSchema.index({ userId: 1, scopeType: 1, scopeId: 1 }, { unique: true });
QuizUserRoleSchema.index({ tenantId: 1, userId: 1, scopeId: 1 });

import { getTenantModel } from '@ajabadia/satellite-sdk';

const QuizUserRole: Model<IQuizUserRole> = getTenantModel<IQuizUserRole>('QuizUserRole', QuizUserRoleSchema);

export default QuizUserRole;
