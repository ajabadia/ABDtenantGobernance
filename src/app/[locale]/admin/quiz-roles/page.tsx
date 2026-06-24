'use client';

/**
 * @purpose Gestiona y renderiza la página de roles del quiz en la sección administrativa, incluyendo una tabla de roles, filtros, barra de acciones, resumen y modales para asignar y revocar roles.
 * @purpose_en Renders and manages the quiz roles page in the admin section, including displaying a table of roles, filters, actions bar, summary, and modals for assigning and revoking roles.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:13,sig:qpiin2
 * @lastUpdated 2026-06-23T21:42:08.520Z
 */

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { AdminPageHeader } from '@ajabadia/styles';
import { ConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { useQuizRoles } from './useQuizRoles';
import { QuizRolesTable } from './QuizRolesTable';
import { QuizRolesFilters } from './QuizRolesFilters';
import { QuizRolesActionsBar } from './QuizRolesActionsBar';
import { QuizRolesSummary } from './QuizRolesSummary';
import { AssignRoleModal } from './AssignRoleModal';
import { BulkAssignModal } from './BulkAssignModal';

export default function QuizRolesPage() {
  const tAdmin = useTranslations('admin');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const {
    tenantId, roles, users, loading, userMap, roleLiterals,
    filterScopeType, setFilterScopeType, filterScopeId, setFilterScopeId,
    assignModalOpen, setAssignModalOpen, assignUserId, setAssignUserId,
    assignScopeType, setAssignScopeType, assignScopeId, setAssignScopeId,
    assignRoleType, setAssignRoleType, assigning, resetAssignForm,
    bulkModalOpen, setBulkModalOpen, bulkScopeType, setBulkScopeType,
    bulkScopeId, setBulkScopeId, bulkRoleType, setBulkRoleType,
    bulkUserIds, setBulkUserIds, bulkSelectAll, setBulkSelectAll, bulking,
    revokeTarget, setRevokeTarget, revoking,
    fetchData, handleAssign, handleRevoke, handleBulkAssign,
  } = useQuizRoles(locale);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        <AdminPageHeader
          icon={GraduationCap}
          breadcrumb={<>{tAdmin('controlConsole')} &bull; {tAdmin('quizRoles.breadcrumb')}</>}
          title={tAdmin('quizRoles.title')}
          backButton={
            <Link
              href={`/${locale}/admin`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label={tAdmin('quizRoles.backButton')}
            >
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          }
          description={tAdmin('quizRoles.subtitle')}
        >
          <QuizRolesActionsBar
            loading={loading}
            onRefresh={fetchData}
            onAssign={() => { resetAssignForm(); setAssignModalOpen(true); }}
            onBulkAssign={() => { setBulkModalOpen(true); }}
          />
        </AdminPageHeader>

        <QuizRolesFilters
          filterScopeType={filterScopeType}
          onFilterScopeTypeChange={(v) => { setFilterScopeType(v); }}
          filterScopeId={filterScopeId}
          onFilterScopeIdChange={(v) => { setFilterScopeId(v); }}
          onClear={() => { setFilterScopeType(''); setFilterScopeId(''); }}
        />

        <QuizRolesTable
          roles={roles}
          users={users}
          loading={loading}
          roleLiterals={roleLiterals}
          locale={locale}
          userMap={userMap}
          onRevoke={setRevokeTarget}
        />

        <QuizRolesSummary roles={roles} loading={loading} roleLiterals={roleLiterals} locale={locale} />
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
