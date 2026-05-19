export interface AuditLog {
  _id?: string;
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
  createdAt?: string;
}
