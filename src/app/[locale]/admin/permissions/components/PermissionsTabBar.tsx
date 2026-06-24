'use client';

/**
 * @purpose Gestiona un tab bar para el manejo de permisos con tabs para grupos y políticas, incluyendo conteos y navegación por teclado.
 * @purpose_en Renders a tab bar for managing permissions with tabs for groups and policies, including counts and keyboard navigation.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1bgd7tw
 * @lastUpdated 2026-06-23T20:38:35.649Z
 */

import { useCallback, useRef } from 'react';
import { Shield, FileText } from 'lucide-react';

interface PermissionsTabBarProps {
  activeTab: 'groups' | 'policies';
  onTabChange: (tab: 'groups' | 'policies') => void;
  groupsCount: number;
  policiesCount: number;
}

const TAB_IDS: ('groups' | 'policies')[] = ['groups', 'policies'];

export function PermissionsTabBar({ activeTab, onTabChange, groupsCount, policiesCount }: PermissionsTabBarProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentTab: 'groups' | 'policies') => {
    let nextIndex: number;
    if (e.key === 'ArrowRight') {
      nextIndex = (TAB_IDS.indexOf(currentTab) + 1) % TAB_IDS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (TAB_IDS.indexOf(currentTab) - 1 + TAB_IDS.length) % TAB_IDS.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = TAB_IDS[nextIndex];
    onTabChange(nextTab);
    tabRefs.current[nextTab]?.focus();
  }, [onTabChange]);

  return (
    <div className="flex border-b border-border gap-0" role="tablist" aria-label="Permissions tabs">
      <button
        ref={(el) => { tabRefs.current['groups'] = el; }}
        role="tab"
        aria-selected={activeTab === 'groups'}
        aria-label="Groups tab"
        onClick={() => onTabChange('groups')}
        onKeyDown={(e) => handleKeyDown(e, 'groups')}
        tabIndex={activeTab === 'groups' ? 0 : -1}
        className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="flex items-center gap-2">
          <Shield size={11} />
          Groups ({groupsCount})
        </span>
      </button>
      <button
        ref={(el) => { tabRefs.current['policies'] = el; }}
        role="tab"
        aria-selected={activeTab === 'policies'}
        aria-label="Policies tab"
        onClick={() => onTabChange('policies')}
        onKeyDown={(e) => handleKeyDown(e, 'policies')}
        tabIndex={activeTab === 'policies' ? 0 : -1}
        className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          activeTab === 'policies' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="flex items-center gap-2">
          <FileText size={11} />
          Policies ({policiesCount})
        </span>
      </button>
    </div>
  );
}
