'use client';

import { useTranslations } from 'next-intl';
import { type IamUser } from '@/lib/services/iamClient';

interface BulkUserSelectionListProps {
  users: IamUser[];
  bulkUserIds: string[];
  bulkSelectAll: boolean;
  onToggleUser: (userId: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
}

export function BulkUserSelectionList({
  users,
  bulkUserIds,
  bulkSelectAll,
  onToggleUser,
  onToggleSelectAll,
}: BulkUserSelectionListProps) {
  const tAdmin = useTranslations('admin');

  return (
    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
          {tAdmin('quizRoles.selectUsers', { count: bulkUserIds.length, total: users.length })}
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[9px] font-mono text-muted-foreground uppercase">{tAdmin('quizRoles.allUsers')}</span>
          <input
            type="checkbox"
            checked={bulkSelectAll}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            className="accent-primary"
          />
        </label>
      </div>
      <div className="border border-border divide-y divide-border/40 overflow-y-auto flex-1">
        {users.length === 0 ? (
          <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
            {tAdmin('quizRoles.noUsers')}
          </div>
        ) : (
          users.map((u) => (
            <label
              key={u._id}
              htmlFor={`bulk-user-${u._id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.03] cursor-pointer transition-colors"
            >
              <input
                id={`bulk-user-${u._id}`}
                type="checkbox"
                checked={bulkUserIds.includes(u._id)}
                onChange={() => onToggleUser(u._id)}
                className="accent-primary shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-xs font-bold text-foreground truncate">{u.name} {u.surname}</span>
                <span className="font-mono text-[9px] text-muted-foreground truncate">{u.email}</span>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
