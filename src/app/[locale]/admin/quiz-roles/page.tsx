'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchQuizRolesAction,
  fetchTenantRoleCustomizationAction,
  assignQuizRoleAction,
  revokeQuizRoleAction,
  bulkAssignQuizRolesAction,
} from './actions';
import { fetchUsersAction } from '@/app/[locale]/admin/users/actions';
import { AdminPageHeader, RoleBadge, type RoleLiteralsMap } from '@ajabadia/styles';
import { ConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { type IamUser } from '@/lib/services/iamClient';
import { type IQuizUserRole } from '@/models/QuizUserRole';
import { AssignRoleModal } from './AssignRoleModal';
import { BulkAssignModal } from './BulkAssignModal';

type ScopeType = 'space' | 'course' | 'exam_config';

const SCOPE_TYPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'space', label: 'Space' },
  { value: 'course', label: 'Course' },
  { value: 'exam_config', label: 'Exam Config' },
];

export default function QuizRolesPage() {
  const tAdmin = useTranslations('admin');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';

  const [tenantId, setTenantId] = useState<string>('');
  const [roles, setRoles] = useState<Partial<IQuizUserRole>[]>([]);
  const [users, setUsers] = useState<IamUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterScopeType, setFilterScopeType] = useState<string>('');
  const [filterScopeId, setFilterScopeId] = useState<string>('');

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [assignScopeType, setAssignScopeType] = useState<ScopeType>('space');
  const [assignScopeId, setAssignScopeId] = useState<string>('');
  const [assignRoleType, setAssignRoleType] = useState<'CREATOR' | 'AUDITOR'>('AUDITOR');
  const [assigning, setAssigning] = useState(false);

  // Bulk assign modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkScopeType, setBulkScopeType] = useState<ScopeType>('space');
  const [bulkScopeId, setBulkScopeId] = useState<string>('');
  const [bulkRoleType, setBulkRoleType] = useState<'CREATOR' | 'AUDITOR'>('AUDITOR');
  const [bulkUserIds, setBulkUserIds] = useState<string[]>([]);
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [bulking, setBulking] = useState(false);

  // Revoke confirm
  const [roleLiterals, setRoleLiterals] = useState<RoleLiteralsMap | undefined>(undefined);

  const [revokeTarget, setRevokeTarget] = useState<{ id: string; userId: string } | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Resolve tenantId on mount
  useEffect(() => {
    const resolve = async () => {
      const explicit = searchParams.get('tenantId');
      if (explicit) {
        setTenantId(explicit);
      } else {
        setTenantId('academia-alfa');
      }
    };
    resolve();
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [rolesRes, usersRes, roleCustRes] = await Promise.all([
      fetchQuizRolesAction(tenantId, {
        scopeType: filterScopeType || undefined,
        scopeId: filterScopeId || undefined,
      }),
      fetchUsersAction(tenantId),
      fetchTenantRoleCustomizationAction(tenantId),
    ]);
    if (rolesRes.error) toast.error(tAdmin('quizRoles.loadError'));
    else setRoles(rolesRes.data || []);
    if (!usersRes.error) setUsers(usersRes.data || []);
    if (!roleCustRes.error && roleCustRes.roleCustomization?.roleLiterals) {
      setRoleLiterals(roleCustRes.roleCustomization.roleLiterals);
    }
    setLoading(false);
  }, [tenantId, filterScopeType, filterScopeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const userMap = new Map(users.map((u) => [u._id, u]));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignScopeId) {
      toast.error(tAdmin('quizRoles.validationError'));
      return;
    }
    setAssigning(true);
    const res = await assignQuizRoleAction(tenantId, {
      userId: assignUserId,
      scopeType: assignScopeType,
      scopeId: assignScopeId,
      roleType: assignRoleType,
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(tAdmin('quizRoles.assignSuccess'));
      setAssignModalOpen(false);
      resetAssignForm();
      fetchData();
    }
    setAssigning(false);
  };

  const resetAssignForm = () => {
    setAssignUserId('');
    setAssignScopeType('space');
    setAssignScopeId('');
    setAssignRoleType('AUDITOR');
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const res = await revokeQuizRoleAction(revokeTarget.id, tenantId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(tAdmin('quizRoles.revokeSuccess'));
      setRevokeTarget(null);
      fetchData();
    }
    setRevoking(false);
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkUserIds.length === 0 || !bulkScopeId) {
      toast.error(tAdmin('quizRoles.bulkValidationError'));
      return;
    }
    setBulking(true);
    const res = await bulkAssignQuizRolesAction(tenantId, {
      userIds: bulkUserIds,
      scopeType: bulkScopeType,
      scopeId: bulkScopeId,
      roleType: bulkRoleType,
    });
    if (res.error && !res.data) {
      toast.error(res.error);
    } else {
      toast.success(tAdmin('quizRoles.bulkSuccess', { assigned: res.data?.assigned || 0, skipped: res.data?.skipped || 0 }));
      setBulkModalOpen(false);
      setBulkUserIds([]);
      setBulkSelectAll(false);
      fetchData();
    }
    setBulking(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        <AdminPageHeader
          icon={GraduationCap}
          breadcrumb={<>{tAdmin('controlConsole')} • {tAdmin('quizRoles.breadcrumb')}</>}
          title={tAdmin('quizRoles.title')}
          backButton={
            <Link
              href={`/${locale}/admin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label={tAdmin('quizRoles.backButton')}
            >
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          }
          description={tAdmin('quizRoles.subtitle')}
        >
          <button
            aria-label={tAdmin('quizRoles.refresh')}
            onClick={fetchData}
            className="inline-flex items-center justify-center p-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-black uppercase transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
            title={tAdmin('quizRoles.refresh')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            aria-label={tAdmin('quizRoles.assignRole')}
            onClick={() => { resetAssignForm(); setAssignModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            {tAdmin('quizRoles.assignRole')}
          </button>
          <button
            aria-label={tAdmin('quizRoles.bulkAssign')}
            onClick={() => { setBulkModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
          >
            <UserPlus className="h-4 w-4" />
            {tAdmin('quizRoles.bulkAssign')}
          </button>
        </AdminPageHeader>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={10} /> {tAdmin('quizRoles.filterScopeType')}
            </label>
            <select
              value={filterScopeType}
              onChange={(e) => setFilterScopeType(e.target.value)}
              className="h-9 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-[10px] outline-none text-foreground rounded-none uppercase"
            >
              <option value="">{tAdmin('quizRoles.allScopeTypes')}</option>
              {SCOPE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">{tAdmin('quizRoles.filterScopeId')}</label>
            <input
              type="text"
              value={filterScopeId}
              onChange={(e) => setFilterScopeId(e.target.value)}
              placeholder={tAdmin('quizRoles.filterPlaceholder')}
              className="h-9 px-3 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-[10px] outline-none text-foreground rounded-none w-56"
            />
          </div>
          {(filterScopeType || filterScopeId) && (
          <button
              aria-label={tAdmin('quizRoles.clearFilters')}
              onClick={() => { setFilterScopeType(''); setFilterScopeId(''); }}
              className="h-9 px-4 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[9px] uppercase tracking-wider transition-colors rounded-none"
            >
              {tAdmin('quizRoles.clearFilters')}
            </button>
          )}
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto border border-border rounded-none bg-card/40 backdrop-blur-sm">
          <table className="w-full text-left divide-y divide-border/60">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.user')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.scope')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.scopeId')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.role')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.assignedBy')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.date')}</th>
                <th className="px-6 py-4 font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{tAdmin('quizRoles.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                    {tAdmin('quizRoles.loading')}
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                    {tAdmin('quizRoles.noRoles')}{filterScopeType || filterScopeId ? ' ' + tAdmin('quizRoles.underFilters') : ''}
                  </td>
                </tr>
              ) : (
                roles.map((r) => {
                  const u = userMap.get(r.userId || '');
                  return (
                    <tr key={String(r._id)} className="hover:bg-primary/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-sans text-foreground/90 font-bold">
                            {u ? `${u.name} ${u.surname}` : r.userId?.substring(0, 12) + '...'}
                          </span>
                          {u && (
                            <span className="font-mono text-[9px] text-muted-foreground">{u.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] uppercase font-bold text-primary/80">
                          {r.scopeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[9px] text-muted-foreground" title={r.scopeId}>
                          {r.scopeId?.substring(0, 16)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.roleType === 'CREATOR' || r.roleType === 'AUDITOR' ? (
                          <RoleBadge
                            role={r.roleType}
                            roleLiterals={roleLiterals}
                            locale={locale as 'es' | 'en'}
                          />
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground">{r.roleType}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {r.assignedBy?.substring(0, 12)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {(r as unknown as { createdAt?: string }).createdAt
                            ? new Date((r as unknown as { createdAt: string }).createdAt).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          aria-label={tAdmin('quizRoles.revoke')}
                          onClick={() => setRevokeTarget({ id: String(r._id), userId: r.userId || '' })}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-none"
                          title={tAdmin('quizRoles.revoke')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {!loading && roles.length > 0 && (
          <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-3">
            <span>{tAdmin('quizRoles.total', { count: roles.length })}</span>
            <span className="flex items-center gap-1">
              <RoleBadge role="CREATOR" roleLiterals={roleLiterals} locale={locale as 'es' | 'en'} variant="ghost" showIcon={false} />
              <span className="font-bold">{roles.filter(r => r.roleType === 'CREATOR').length}</span>
            </span>
            <span className="flex items-center gap-1">
              <RoleBadge role="AUDITOR" roleLiterals={roleLiterals} locale={locale as 'es' | 'en'} variant="ghost" showIcon={false} />
              <span className="font-bold">{roles.filter(r => r.roleType === 'AUDITOR').length}</span>
            </span>
          </div>
        )}
      </div>

      {/* Assign Role Modal */}
      {assignModalOpen && (
        <AssignRoleModal
          users={users}
          assignUserId={assignUserId}
          setAssignUserId={setAssignUserId}
          assignScopeType={assignScopeType}
          setAssignScopeType={setAssignScopeType}
          assignScopeId={assignScopeId}
          setAssignScopeId={setAssignScopeId}
          assignRoleType={assignRoleType}
          setAssignRoleType={setAssignRoleType}
          assigning={assigning}
          locale={locale}
          roleLiterals={roleLiterals}
          onClose={() => setAssignModalOpen(false)}
          onSubmit={handleAssign}
        />
      )}

      {/* Bulk Assign Modal */}
      {bulkModalOpen && (
        <BulkAssignModal
          users={users}
          bulkScopeType={bulkScopeType}
          setBulkScopeType={setBulkScopeType}
          bulkScopeId={bulkScopeId}
          setBulkScopeId={setBulkScopeId}
          bulkRoleType={bulkRoleType}
          setBulkRoleType={setBulkRoleType}
          bulkUserIds={bulkUserIds}
          setBulkUserIds={setBulkUserIds}
          bulkSelectAll={bulkSelectAll}
          setBulkSelectAll={setBulkSelectAll}
          bulking={bulking}
          locale={locale}
          roleLiterals={roleLiterals}
          onClose={() => setBulkModalOpen(false)}
          onSubmit={handleBulkAssign}
        />
      )}

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        open={revokeTarget !== null}
        title={tAdmin('quizRoles.revokeConfirmTitle')}
        message={
          revokeTarget
            ? tAdmin('quizRoles.confirmRevoke', { userId: revokeTarget.userId.substring(0, 12) })
            : ''
        }
        confirmLabel={tAdmin('quizRoles.revoke')}
        cancelLabel={tAdmin('quizRoles.cancel')}
        variant="danger"
        isLoading={revoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </main>
  );
}
