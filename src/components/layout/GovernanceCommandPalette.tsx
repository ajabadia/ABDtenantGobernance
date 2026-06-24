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
import { CommandPalette, Command } from '@ajabadia/ecosystem-widgets';
import { Home, Palette, Folder, Terminal, ShieldCheck, Globe, LogOut, Settings } from 'lucide-react';

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
    {
      id: 'action-language',
      title: locale === 'es' ? 'Switch to English' : 'Cambiar a Español',
      description: locale === 'es' ? 'Change layout language to English' : 'Cambiar el idioma a Español',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
      }
    },
    {
      id: 'action-settings',
      title: locale === 'es' ? 'Abrir Panel de Configuración' : 'Open System Settings',
      description: locale === 'es' ? 'Ajustar temas visuales e idioma' : 'Adjust theme modes and language',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        const settingsBtn = document.querySelector('#system-settings-wrapper button') as HTMLButtonElement;
        if (settingsBtn) {
          settingsBtn.click();
        }
      }
    },
    {
      id: 'action-logout',
      title: locale === 'es' ? 'Cerrar Sesión' : 'Sign Out',
      description: locale === 'es' ? 'Finalizar sesión de forma segura' : 'Securely end your session',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        window.location.href = '/api/auth/logout';
      }
    }
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca...' : 'Type a command or search...'}
    />
  );
}
