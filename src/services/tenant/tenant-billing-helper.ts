/**
 * @purpose Gestiona el cifrado y des cifrado de campos de facturación sensibles, así como los mascara para registro de auditoria.
 * @purpose_en Manages the encryption and decryption of sensitive billing fields, as well as masking them for audit logging.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:vs2yyi
 * @lastUpdated 2026-06-23T23:29:14.542Z
 */

import { SecurityService } from '@ajabadia/satellite-sdk/core';

/**
 * Encrypts sensitive billing fields (taxId) for storage
 */
export function encryptBillingFields<T extends { billing?: { taxId?: string } | null }>(
  data: T
): T {
  if (!data.billing?.taxId) return data;
  return {
    ...data,
    billing: {
      ...data.billing,
      taxId: SecurityService.encrypt(data.billing.taxId),
    },
  };
}

/**
 * Decrypts sensitive billing fields (taxId) for presentation
 */
export function decryptBillingFields<T extends { billing?: { taxId?: string } | null }>(
  data: T
): T {
  if (!data.billing?.taxId) return data;
  return {
    ...data,
    billing: {
      ...data.billing,
      taxId: SecurityService.decrypt(data.billing.taxId),
    },
  };
}

/**
 * Masks billing fields for audit logging (hides taxId)
 */
export function maskBillingForAudit(obj: { billing?: { taxId?: string } | null } | undefined): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const masked = { ...obj };
  if (masked.billing?.taxId) {
    masked.billing = { ...masked.billing, taxId: '[ENCRYPTED_DATA]' };
  }
  return masked as unknown as Record<string, unknown>;
}
