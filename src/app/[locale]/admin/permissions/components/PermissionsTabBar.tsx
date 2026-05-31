'use client';

import { Shield, FileText } from 'lucide-react';

interface PermissionsTabBarProps {
  activeTab: 'groups' | 'policies';
  onTabChange: (tab: 'groups' | 'policies') => void;
  groupsCount: number;
  policiesCount: number;
}

export function PermissionsTabBar({ activeTab, onTabChange, groupsCount, policiesCount }: PermissionsTabBarProps) {
  return (
    <div className="flex border-b border-border gap-0" role="tablist">
      <button
        role="tab"
        aria-selected={activeTab === 'groups'}
        aria-label="Groups tab"
        onClick={() => onTabChange('groups')}
        className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
          activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="flex items-center gap-2">
          <Shield size={11} />
          Groups ({groupsCount})
        </span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'policies'}
        aria-label="Policies tab"
        onClick={() => onTabChange('policies')}
        className={`px-6 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
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
