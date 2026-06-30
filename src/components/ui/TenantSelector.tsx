'use client';

/**
 * @purpose Renderiza un componente selector de inquilino que se conecta con el TenantSelectorConnector mediante las propiedades usuario de sesión, variante y abierta.
 * @purpose_en Renders a tenant selector component that connects to the TenantSelectorConnector with session user, variant, and isOpen props.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:8jawj2
 * @lastUpdated 2026-06-30T05:49:52.717Z
 */

import { DefaultTenantSelector } from "@ajabadia/ecosystem-widgets";

interface SessionUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

interface TenantSelectorProps {
  sessionUser?: SessionUser;
  variant?: 'dropdown' | 'trigger' | 'content';
  isOpen?: boolean;
}

export function TenantSelector({ sessionUser, variant, isOpen }: TenantSelectorProps) {
  return <DefaultTenantSelector sessionUser={sessionUser} variant={variant} isOpen={isOpen} />;
}
