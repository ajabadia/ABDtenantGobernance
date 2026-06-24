'use client';

/**
 * @purpose Gestiona una tabla que muestra a los usuarios con sus roles, aplicaciones, grupos y estado, proporcionando acciones para gestionar los estados de los usuarios y las membresías de los grupos.
 * @purpose_en Renders a table displaying users with their roles, applications, groups, and status, providing actions to manage user statuses and group memberships.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:86lia7
 * @lastUpdated 2026-06-23T21:43:36.218Z
 */

import { useTranslations } from 'next-intl';
import { UserStatusBadge } from './components/UserStatusBadge';
import { IamUser } from '@/lib/services/iamClient';

interface TenantMembership {
  tenantId: string;
  role: string;
  status: string;
  allowedApps: string[];
  groupIds?: string[];
}

interface Group {
  _id: string;
  name: string;
  slug: string;
}

interface UsersTableProps {
  users: IamUser[];
  tenantId: string;
  loading: boolean;
  groups: Group[];
  memberships: { userId: string; groupId: string }[];
  onToggleStatus: (userId: string, currentStatus: string) => void;
  onManageGroups: (user: IamUser) => void;
}

export function UsersTable({
  users,
  tenantId,
  loading,
  groups,
  memberships,
  onToggleStatus,
  onManageGroups,
}: UsersTableProps) {
  const tAdmin = useTranslations('admin');
  const tUsers = useTranslations('admin.users');

  return (
    <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
      <table className="w-full text-left divide-y divide-border/60">
        <thead className="bg-secondary/40">
          <tr>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_id')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_email_name')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_role_apps')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_groups')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_status')}</th>
            <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tUsers('table_actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {tUsers('table_loading')}
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                {tUsers('table_empty')}
              </td>
            </tr>
          ) : (
            users.map(u => {
              const membership = u.tenants.find(
                t => (t as unknown as TenantMembership).tenantId === tenantId
              ) as unknown as TenantMembership | undefined;
              const isSuspended = membership?.status === 'suspended';
              const memberGroupIds = memberships.filter(m => m.userId === u._id).map(m => m.groupId);
              const memberGroups = groups.filter(g => memberGroupIds.includes(g._id));

              return (
                <tr key={u._id} className="hover:bg-primary/[0.02] transition-colors duration-150">
                  <td className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground/80">
                    {u._id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 flex flex-col gap-1">
                    <span className="text-xs font-sans text-foreground/90 font-bold">{u.name} {u.surname}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{u.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase font-bold text-primary">{membership?.role || 'STUDENT'}</span>
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">{membership?.allowedApps?.join(', ') || 'NONE'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {memberGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {memberGroups.slice(0, 2).map(g => (
                          <span key={g._id} className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-primary/20 text-primary/70 bg-primary/5">
                            {g.name}
                          </span>
                        ))}
                        {memberGroups.length > 2 && (
                          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 border border-border text-muted-foreground">
                            +{memberGroups.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[9px] text-muted-foreground/40 uppercase">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <UserStatusBadge status={membership?.status || 'active'} active={u.active} />
                  </td>
                  <td className="px-6 py-4 flex flex-col gap-2">
                    <button
                      aria-label={isSuspended ? 'Reactivar usuario' : 'Suspender usuario'}
                      onClick={() => onToggleStatus(u._id, membership?.status || 'active')}
                      className="w-full px-3 py-1.5 bg-transparent border border-border hover:border-primary/50 hover:text-primary font-mono text-[9px] uppercase tracking-wider text-muted-foreground rounded-none transition-colors"
                    >
                      {isSuspended ? tUsers('reactivate_btn') : tUsers('suspend_btn')}
                    </button>
                    <button
                      aria-label={tUsers('manage_groups_btn')}
                      onClick={() => onManageGroups(u)}
                      className="w-full px-3 py-1.5 bg-primary/10 border border-primary/40 hover:border-primary hover:bg-primary/20 text-primary font-mono text-[9px] uppercase tracking-wider rounded-none transition-colors"
                    >
                      {tUsers('manage_groups_btn')}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
