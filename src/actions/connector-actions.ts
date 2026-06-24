/**
 * @purpose Gestiona conectores de almacenamiento para los inquilinos, listando y guardándolos, incluyendo pruebas de conexión física.
 * @purpose_en Manages storage connectors for tenants by listing and saving them, including physical connection tests.
 * @refactorable true (contains multiple actions and business logic)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:5,sig:x5nkpu
 * @lastUpdated 2026-06-23T20:35:12.652Z
 */

'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ensureIndustrialAccess, connectDB } from '@ajabadia/satellite-sdk';
import StorageConnector, { TStorageConnector } from '@/models/StorageConnector';
import crypto from 'crypto';

const FILES_SERVICE_URL = process.env.FILES_SERVICE_URL || 'http://localhost:5005';

export interface StorageConnectorResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * List all storage connectors for the active tenant
 */
export async function listConnectorsAction(tenantId: string): Promise<TStorageConnector[]> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const targetTenantId = tenantId || user.tenantId;

    await connectDB();
    const connectors = await StorageConnector.find({ tenantId: targetTenantId }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(connectors));
  } catch (error) {
    console.error('[LIST_CONNECTORS_ACTION_ERROR]', error);
    return [];
  }
}

/**
 * Create or update a storage connector
 */
export async function saveConnectorAction(
  prevState: unknown,
  formData: FormData
): Promise<StorageConnectorResponse> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (formData.get('tenantId') as string) || user.tenantId;
    const connectorId = formData.get('connectorId') as string | null;
    const providerType = formData.get('providerType') as 'cloudinary' | 's3Compatible' | 'googleDrive' | 'oneDrive';
    const status = (formData.get('status') as 'active' | 'inactive') || 'inactive';
    const credentialsRef = formData.get('credentialsRef') as string;
    const auditMode = (formData.get('auditMode') as string) || 'standard';

    if (!providerType || !credentialsRef) {
      return { success: false, message: 'Provider type and credentials configuration JSON are required.' };
    }

    // Validate credentials JSON
    try {
      JSON.parse(credentialsRef);
    } catch {
      return { success: false, message: 'Credentials must be a valid JSON string.' };
    }

    await connectDB();

    if (status === 'active') {
      // Deactivate all other connectors for this tenant
      await StorageConnector.updateMany({ tenantId, status: 'active' }, { status: 'inactive' });
    }

    if (connectorId) {
      // Update
      const connector = await StorageConnector.findOne({ tenantId, connectorId });
      if (!connector) {
        return { success: false, message: 'Connector not found.' };
      }
      connector.providerType = providerType;
      connector.status = status;
      connector.credentialsRef = credentialsRef;
      connector.auditMode = auditMode;
      await connector.save();
    } else {
      // Create
      const newId = `conn_${crypto.randomUUID()}`;
      const newConnector = new StorageConnector({
        connectorId: newId,
        tenantId,
        providerType,
        status,
        credentialsRef,
        allowedScopes: [],
        retentionPolicy: {},
        auditMode
      });
      await newConnector.save();
    }

    revalidatePath('/[locale]/admin/connectors', 'page');

    return {
      success: true,
      message: connectorId ? 'Storage provider updated successfully' : 'Storage provider registered successfully'
    };
  } catch (error) {
    const err = error as Error;
    console.error('[SAVE_CONNECTOR_ACTION_ERROR]', err);
    return {
      success: false,
      message: err.message || 'Error occurred while saving storage provider configuration.'
    };
  }
}

/**
 * Delete a storage connector
 */
export async function deleteConnectorAction(connectorId: string, tenantId: string): Promise<StorageConnectorResponse> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const targetTenantId = tenantId || user.tenantId;

    await connectDB();
    const result = await StorageConnector.deleteOne({ tenantId: targetTenantId, connectorId });
    
    if (result.deletedCount === 0) {
      return { success: false, message: 'Connector not found or already deleted.' };
    }

    revalidatePath('/[locale]/admin/connectors', 'page');
    return { success: true, message: 'Storage provider configuration deleted successfully' };
  } catch (error) {
    const err = error as Error;
    console.error('[DELETE_CONNECTOR_ACTION_ERROR]', err);
    return { success: false, message: err.message || 'Error occurred while deleting.' };
  }
}

/**
 * Trigger physical connection test in ABDFiles using the current administrator's credentials
 */
export async function testConnectorAction(connectorId: string): Promise<StorageConnectorResponse> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    
    // Read session cookie to authenticate the proxy request to ABDFiles
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('abd_session')?.value;

    if (!sessionCookie) {
      return { success: false, message: 'No active session found to execute physical test.' };
    }

    const testUrl = `${FILES_SERVICE_URL}/api/v1/connectors/${connectorId}/test`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `abd_session=${sessionCookie}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Physical test endpoint failed with status ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    if (result && result.success) {
      return { success: true, message: result.message || 'Physical connection test passed successfully!' };
    } else {
      return { success: false, message: result.message || 'Physical connection test failed.' };
    }
  } catch (error) {
    const err = error as Error;
    console.error('[TEST_CONNECTOR_ACTION_ERROR]', err);
    return { success: false, message: `Network error when calling storage engine: ${err.message}` };
  }
}
