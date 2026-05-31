'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Plus, RefreshCw, Shield, UserPlus } from 'lucide-react';
import { fetchUsersAction, updateUserAction } from './actions';
import { fetchGroupsAction } from '../permissions/actions';
import { fetchTenantMembershipsAction } from './memberships-actions';
import { UsersTable } from './UsersTable';
import { AddExistingUserModal } from './components/AddExistingUserModal';
import { UserInviteModal } from './components/UserInviteModal';
import { ManageUserGroupsModal } from './components/ManageUserGroupsModal';
import { toast } from 'sonner';
import { AdminPageHeader } from '@ajabadia/styles';
import { IamUser } from '@/lib/services/iamClient';

interface Group {
  _id: string;
  name: string;
  slug: string;
}

export default function UsersPage() {
  const tAdmin = useTranslations('admin');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [tenantId, setTenantId] = useState<string>('');

  const [users, setUsers] = useState<IamUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<{userId: string, groupId: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenExisting, setModalOpenExisting] = useState(false);
  const [manageGroupsUser, setManageGroupsUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const resolveTenant = async () => {
      const explicit = searchParams.get('tenantId');
      if (explicit) {
        setTenantId(explicit);
      } else {
        setTenantId('academia-alfa');
      }
    };
    resolveTenant();
  }, [searchParams]);

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [usersRes, groupsRes, membershipsRes] = await Promise.all([
      fetchUsersAction(tenantId),
      fetchGroupsAction(tenantId),
      fetchTenantMembershipsAction(tenantId),
    ]);
    if (usersRes.error) toast.error('Error al cargar usuarios');
    else setUsers(usersRes.data || []);
    if (!groupsRes.error) setGroups((groupsRes.data as Group[]) || []);
    if (!membershipsRes.error) setMemberships(membershipsRes.data as {userId: string, groupId: string}[] || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [tenantId]);

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await updateUserAction({ userId, tenantId, updates: { status: newStatus as 'active' | 'suspended' } });
      if (res.error) throw new Error(res.error);
      toast.success(`Estado del usuario actualizado a ${newStatus}`);
      fetchData();
    } catch {
      toast.error('Error al actualizar el usuario');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader
          icon={Users}
          breadcrumb={<>{tAdmin('controlConsole')} • USUARIOS</>}
          title="Gestión de Usuarios"
          backButton={
            <Link href={`/${locale}/admin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          }
          description="Administra los usuarios de tu organización y sus permisos de acceso."
        >
          <button aria-label="Refrescar usuarios" onClick={fetchData}
            className="inline-flex items-center justify-center p-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 font-mono text-[10px] font-black uppercase transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href={`/${locale}/admin/permissions?tenantId=${tenantId}`} aria-label="Gestionar grupos de permisos"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent text-muted-foreground border border-border hover:border-muted-foreground/40 hover:text-foreground font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none"
          >
            <Shield className="h-3.5 w-3.5" /> GRUPOS
          </Link>
          <button aria-label="Invitar usuario" onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <Plus className="h-4 w-4" /> INVITAR USUARIO
          </button>
          <button aria-label="Agregar usuario existente" onClick={() => setModalOpenExisting(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <UserPlus className="h-4 w-4" /> AGREGAR EXISTENTE
          </button>
        </AdminPageHeader>

        <UsersTable
          users={users} tenantId={tenantId} loading={loading}
          groups={groups} memberships={memberships}
          onToggleStatus={toggleUserStatus}
          onManageGroups={(u) => setManageGroupsUser({ id: u._id, name: `${u.name} ${u.surname}` })}
        />

        <UserInviteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} tenantId={tenantId} onSuccess={fetchData} availableGroups={groups} />
        <AddExistingUserModal isOpen={modalOpenExisting} onClose={() => setModalOpenExisting(false)} tenantId={tenantId} onSuccess={fetchData} availableGroups={groups} />
        {manageGroupsUser && (
          <ManageUserGroupsModal
            tenantId={tenantId} userId={manageGroupsUser.id} userName={manageGroupsUser.name}
            isOpen={!!manageGroupsUser} onClose={() => setManageGroupsUser(null)} onSuccess={fetchData}
            availableGroups={groups} initialGroupIds={memberships.filter(m => m.userId === manageGroupsUser.id).map(m => m.groupId)}
          />
        )}
      </div>
    </main>
  );
}
