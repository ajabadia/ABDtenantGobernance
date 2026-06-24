/**
 * @purpose Gestiona el esquema y modelo para registros de auditoría en una base de datos MongoDB, incluyendo campos para contexto de aplicación, acciones del usuario, detalles de entidad y metadatos.
 * @purpose_en Defines the schema and model for audit logs in a MongoDB database, including fields for application context, user actions, entity details, and metadata.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:6,imports:1,sig:dphqas
 * @lastUpdated 2026-06-23T23:28:19.263Z
 */

import { Schema, Connection, Document } from 'mongoose';

export interface IAuditLog {
  appId?: string;                        // Aplicación origen: 'auth', 'quiz', 'gobernanza'
  tenantId: string;                     // ID de la organización o 'SYSTEM' para operaciones globales
  action: string;                       // Ej: 'USER_LOGIN', 'SSO_HANDSHAKE_GRANTED', 'EXAM_CREATED'
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM' | 'SPACE' | 'BRANDING' | 'PERMISSION_GROUP' | 'PERMISSION_POLICY' | 'LICENSE_REQUEST';
  entityId: string;                     // ID de la entidad afectada
  userId: string;                       // ID del operador (actor)
  userEmail: string;                    // Email del operador
  changedFields: Record<string, unknown>; // Metadatos dinámicos del evento
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

export const AuditLogSchema = new Schema<IAuditLog>({
  appId: { type: String, default: 'gobernanza', index: true },
  tenantId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  changedFields: { type: Schema.Types.Mixed, default: {} },
  previousState: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Índice compuesto para telemetría rápida por organización y tiempo
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export function getAuditLogModel(connection: Connection) {
  return connection.models.AuditLog || connection.model<IAuditLog>('AuditLog', AuditLogSchema, 'central_audit_logs');
}

/**
 * Obtiene el modelo Mongoose para Marca Blanca, apuntando a la colección 'central_audit_logs'
 */
export function getBrandingAuditModel(connection: Connection) {
  return getAuditLogModel(connection);
}

/**
 * Obtiene el modelo Mongoose para Espacios, apuntando a la colección 'central_audit_logs'
 */
export function getSpaceAuditModel(connection: Connection) {
  return getAuditLogModel(connection);
}
