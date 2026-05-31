'use client';

import { Search, X, User, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GroupItem { id: string; name: string; type: 'GROUP'; }
interface UserItem { id: string; name: string; email: string; type: 'USER'; }
type SearchItem = GroupItem | UserItem;

interface Props {
  activeTab: 'GROUP' | 'USER';
  items: SearchItem[];
  search: string;
  onAdd: (id: string) => void;
}

export function CollaboratorSearchResultList({ activeTab, items, search, onAdd }: Props) {
  const t = useTranslations('dashboard.spaces');

  if (!search.trim() && items.length === 0) {
    return (
      <div className="py-8 text-center font-mono text-[10px] text-muted-foreground/50 uppercase">
        {activeTab === 'GROUP'
          ? 'Escribe para buscar grupos...'
          : 'Escribe para buscar usuarios...'}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <Search size={20} className="mx-auto text-muted-foreground/30 mb-2" />
        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase">
          {t('no_results', { defaultMessage: 'Sin resultados' })}
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto border border-border/60 divide-y divide-border/40 bg-secondary/10">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between px-3 py-2.5 hover:bg-primary/[0.04] transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {item.type === 'GROUP' ? (
              <Shield size={12} className="text-muted-foreground shrink-0" />
            ) : (
              <User size={12} className="text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-foreground truncate block">
                {item.name}
              </span>
              {'email' in item && item.email && (
                <span className="font-mono text-[9px] text-muted-foreground/60 truncate block">
                  {item.email}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAdd(item.id)}
            aria-label={`Agregar ${item.name}`}
            className="p-1 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
