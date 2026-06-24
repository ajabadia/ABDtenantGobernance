/**
 * @purpose Gestiona tipos y traducciones para acciones de gestión de inquilinos y componentes de interfaz de usuario.
 * @purpose_en Defines types and translations for tenant management actions and UI components.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:1i8ygcp
 * @lastUpdated 2026-06-23T21:46:01.029Z
 */

import type { Tenant } from "@/lib/schemas/tenant";

export type SaveTenantAction = (data: Partial<Tenant>) => Promise<void>;
export type SubmitTenantAction = (data: Partial<Tenant>) => void;

export interface TenantManagementTranslations {
  title: string;
  subtitle: string;
  new_tenant: string;
  edit_tenant: string;
  register_tenant: string;
  industry: string;
  database: string;
  spaces: string;
  confirm_delete: string;
  edit_action: string;
  delete_action: string;
  orchestrator_version: string;
  name_label: string;
  id_label: string;
  isolation_label: string;
  status_label: string;
  industries: {
    industrial: string;
    energy: string;
    logistics: string;
    security: string;
  };
  actions: {
    edit: string;
    delete: string;
    save: string;
    cancel: string;
  };
}
