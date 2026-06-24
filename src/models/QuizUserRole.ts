/**
 * @purpose Gestiona un esquema de mongoose y modelo para administrar roles de usuarios en preguntas dentro de una suscripción.
 * @purpose_en Defines a Mongoose schema and model for managing user roles in quizzes within a tenant.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:jvp8j7
 * @lastUpdated 2026-06-23T21:51:41.070Z
 */

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
