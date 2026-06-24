/**
 * @purpose Gestiona la estructura para registros de auditoría en la aplicación ABDtenantGobernance.
 * @purpose_en Defines the structure for audit log entries in the ABDtenantGobernance application.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:15158nc
 * @lastUpdated 2026-06-23T21:44:12.061Z
 */

export interface AuditLog {
  _id?: string;
  // 🌐 Origen de la aplicación que emitió el evento (multi-app stream)
  appId?: 'auth' | 'quiz' | 'gobernanza' | 'governance' | 'logs' | string;
  tenantId: string;
  action:
    | 'CREATE_SPACE'
    | 'UPDATE_SPACE'
    | 'DELETE_SPACE'
    | 'MOVE_SPACE'
    | 'UPDATE_BRANDING'
    | 'CREATE_TENANT'
    | 'DELETE_TENANT'
    | 'HERITAGE_VISIBILITY'
    // ABDAuth events
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'USER_REGISTER'
    | 'USER_UPDATE'
    | 'ROLE_CHANGE'
    | 'PASSWORD_RESET'
    // ABDQuiz events
    | 'EXAM_START'
    | 'EXAM_SUBMIT'
    | 'QUESTION_IMPORT'
    | 'CONFIG_CHANGE'
    // Open union para eventos futuros
    | string;
  entityType: 'SPACE' | 'TENANT' | 'USER' | 'EXAM' | 'QUESTION' | 'SESSION' | string;
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  createdAt?: string;
  // 🔐 Cryptographic chain fields (SOC2)
  hash?: string;
  previousHash?: string;
}
