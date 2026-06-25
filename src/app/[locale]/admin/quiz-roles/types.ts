/**
 * @purpose Gestiona el modelo de datos para registros de roles de quiz.
 * @purpose_en Defines the data structure for quiz role records.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:1dy1e3p
 * @lastUpdated 2026-06-25T09:23:45.802Z
 */

export interface QuizRoleRecord {
  _id: string;
  tenantId: string;
  userId: string;
  scopeType: 'space' | 'course' | 'exam_config';
  scopeId: string;
  roleType: 'CREATOR' | 'AUDITOR';
  assignedBy: string;
  createdAt?: string;
  updatedAt?: string;
}
