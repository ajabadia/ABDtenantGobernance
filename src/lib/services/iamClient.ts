/**
 * @purpose Gestiona datos del usuario y operaciones dentro del sistema IAM, incluyendo listar usuarios, invitar nuevos usuarios y actualizar usuarios existentes.
 * @purpose_en Manages user data and operations within the IAM system, including listing users, inviting new users, and updating existing users.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:5,imports:0,sig:kk9ayi
 * @lastUpdated 2026-06-23T21:47:53.466Z
 */

export interface IamUser {
  _id: string;
  email: string;
  name: string;
  surname: string;
  active: boolean;
  tenantId: string;
  role: string;
  tenants: Record<string, unknown>[];
}

export interface InviteUserPayload {
  email: string;
  name: string;
  surname?: string;
  tenantId: string;
  role: string;
  allowedApps: string[];
  groupIds?: string[];
}

export interface UpdateUserPayload {
  userId: string;
  tenantId: string;
  updates: {
    status?: 'active' | 'suspended';
    role?: 'admin' | 'student';
    allowedApps?: string[];
  };
}

export class IamClient {
  private get baseUrl() {
    return process.env.AUTH_PROVIDER_URL || 'http://localhost:5001';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-internal-iam-key': process.env.INTERNAL_IAM_API_KEY as string,
    };
  }

  async listUsers(tenantId: string): Promise<IamUser[]> {
    const res = await fetch(`${this.baseUrl}/api/internal/users?tenantId=${tenantId}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to list users: ${await res.text()}`);
    }
    const { data } = await res.json();
    return data;
  }

  async inviteUser(payload: InviteUserPayload): Promise<IamUser> {
    const res = await fetch(`${this.baseUrl}/api/internal/users`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to invite user: ${await res.text()}`);
    }
    const { data } = await res.json();
    return data;
  }

  async updateUser(payload: UpdateUserPayload): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/internal/users`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to update user: ${await res.text()}`);
    }
  }
}

export const iamClient = new IamClient();
