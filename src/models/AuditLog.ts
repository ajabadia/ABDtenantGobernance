import { Schema, Connection, Document } from 'mongoose';

export interface IAuditLog {
  tenantId: string;
  action: 
    | 'CREATE_SPACE' 
    | 'UPDATE_SPACE' 
    | 'DELETE_SPACE' 
    | 'MOVE_SPACE' 
    | 'UPDATE_BRANDING' 
    | 'CREATE_TENANT' 
    | 'DELETE_TENANT' 
    | 'HERITAGE_VISIBILITY';
  entityType: 'SPACE' | 'TENANT';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

export const AuditLogSchema = new Schema<IAuditLog>({
  tenantId: { type: String, required: true, index: true },
  action: { 
    type: String, 
    required: true,
    index: true 
  },
  entityType: { type: String, required: true, enum: ['SPACE', 'TENANT'] },
  entityId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  changedFields: { type: Schema.Types.Mixed, default: {} },
  previousState: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Índice compuesto para feeds de actividad fluidos ordenados por fecha
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

/**
 * Obtiene el modelo Mongoose para Marca Blanca, apuntando a la colección 'audit_config_changes'
 */
export function getBrandingAuditModel(connection: Connection) {
  return connection.models.BrandingAudit || connection.model<IAuditLog>('BrandingAudit', AuditLogSchema, 'audit_config_changes');
}

/**
 * Obtiene el modelo Mongoose para Espacios, apuntando a la colección 'audit_admin_ops'
 */
export function getSpaceAuditModel(connection: Connection) {
  return connection.models.SpaceAudit || connection.model<IAuditLog>('SpaceAudit', AuditLogSchema, 'audit_admin_ops');
}
