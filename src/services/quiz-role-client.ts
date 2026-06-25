/**
 * @purpose Gestiona roles de quiz para inquilinos mediante la recopilación, asignación y bulk-assignación de roles.
 * @purpose_en Manages quiz roles for tenants by fetching, assigning, and bulk-assigning roles.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:0,sig:13uknri
 * @lastUpdated 2026-06-25T09:24:03.063Z
 */

interface QuizRoleRecord {
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

const QUIZ_URL = process.env.QUIZ_SERVICE_URL || 'http://localhost:5020';
const INTERNAL_SECRET = process.env.ABD_INTERNAL_SECRET;

async function request(path: string, options?: RequestInit): Promise<Response> {
  const url = `${QUIZ_URL}/api/internal${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_SECRET ? { 'Authorization': `Bearer ${INTERNAL_SECRET}` } : {}),
      ...(options?.headers || {}),
    },
  });
}

export const QuizRoleClient = {
  async fetchRoles(tenantId: string, filters?: { scopeType?: string; scopeId?: string }): Promise<{ data?: QuizRoleRecord[]; error?: string }> {
    try {
      const params = new URLSearchParams({ tenantId });
      if (filters?.scopeType) params.set('scopeType', filters.scopeType);
      if (filters?.scopeId) params.set('scopeId', filters.scopeId);
      const res = await request(`/quiz-roles?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) return { error: json.error || `HTTP ${res.status}` };
      return { data: json.data };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async assignRole(tenantId: string, data: { userId: string; scopeType: 'space' | 'course' | 'exam_config'; scopeId: string; roleType: 'CREATOR' | 'AUDITOR'; assignedBy: string }): Promise<{ data?: QuizRoleRecord; error?: string }> {
    try {
      const res = await request('/quiz-roles', {
        method: 'POST',
        body: JSON.stringify({ tenantId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) return { error: 'DUPLICATE_ROLE: El usuario ya tiene un rol asignado en este ámbito' };
        return { error: json.error || `HTTP ${res.status}` };
      }
      return { data: json.data };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async revokeRole(roleId: string, tenantId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await request(`/quiz-roles?roleId=${encodeURIComponent(roleId)}&tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) return { error: 'ROLE_NOT_FOUND: No se encontró el rol especificado' };
        return { error: json.error || `HTTP ${res.status}` };
      }
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async bulkAssignRoles(tenantId: string, data: { userIds: string[]; scopeType: 'space' | 'course' | 'exam_config'; scopeId: string; roleType: 'CREATOR' | 'AUDITOR'; assignedBy: string }): Promise<{ data?: { assigned: number; skipped: number }; error?: string }> {
    try {
      const res = await request('/quiz-roles', {
        method: 'PATCH',
        body: JSON.stringify({ tenantId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.data) return { data: json.data, error: json.error };
        return { error: json.error || `HTTP ${res.status}` };
      }
      return { data: json.data };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
