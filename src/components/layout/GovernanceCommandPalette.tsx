'use client';

/**
 * @purpose Renderiza una pestaña de comandos con diversas acciones relacionadas con la gobernanza, incluyendo acciones de navegación y configuración.
 * @purpose_en Renders a command palette with various governance-related commands, including navigation and settings actions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:gowu44
 * @lastUpdated 2026-06-23T21:46:05.396Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { Home, Palette, Folder, Terminal, ShieldCheck } from 'lucide-react';

export function GovernanceCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const commands: Command[] = [
    // Navigation Category
    {
      id: 'nav-welcome',
      title: locale === 'es' ? 'Ir a Bienvenida' : 'Go to Welcome',
      description: locale === 'es' ? 'Volver a la página de bienvenida' : 'Return to the welcome page',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'h'],
      icon: <Home className="w-4 h-4" />,
      action: () => {
        router.push('/');
      }
    },
    {
      id: 'nav-tenants',
      title: locale === 'es' ? 'Administrar Tenants' : 'Manage Tenants',
      description: locale === 'es' ? 'Ver y gestionar todos los inquilinos' : 'View and manage all tenants',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 't'],
      icon: <Terminal className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-branding',
      title: locale === 'es' ? 'Marca Blanca' : 'White-Labeling',
      description: locale === 'es' ? 'Configurar logotipos y colores de marca' : 'Configure branding logos and colors',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'b'],
      icon: <Palette className="w-4 h-4" />,
      action: () => {
        router.push('/admin/branding');
      }
    },
    {
      id: 'nav-spaces',
      title: locale === 'es' ? 'Jerarquía de Espacios' : 'Spaces Hierarchy',
      description: locale === 'es' ? 'Gestionar organigrama y áreas de visibilidad' : 'Manage spaces and visibility areas',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 's'],
      icon: <Folder className="w-4 h-4" />,
      action: () => {
        router.push('/admin/spaces');
      }
    },
    {
      id: 'nav-audit',
      title: locale === 'es' ? 'Auditoría en Cadena' : 'Chain Auditing',
      description: locale === 'es' ? 'Explorar el registro de logs criptográficos' : 'Explore the cryptographic audit logs',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'a'],
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => {
        router.push('/admin/audit');
      }
    },
    // Configuration / Action Category
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca...' : 'Type a command or search...'}
    />
  );
}
