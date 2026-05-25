'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { SpaceData } from '@/components/admin/spaces/SpaceForm';

export function useSpacesManager(explicitTenantId: string | null) {
  const t = useTranslations('dashboard.spaces');

  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [loading, setLoading] = useState(true);
  // explicitTenantId is used as the source of truth; state mirrors it for local mutations
  const [tenantId, setTenantId] = useState<string>(explicitTenantId || '');

  // Sync when the parent passes a new explicitTenantId (avoid synchronous setState in effect)
  const resolvedTenantId = explicitTenantId || tenantId;

  const [allTenants, setAllTenants] = useState<{tenantId: string, name: string, customSpaceLabels?: string[]}[]>([]);

  const activeTenant = allTenants.find(t => t.tenantId === resolvedTenantId);
  const customSpaceLabels = activeTenant?.customSpaceLabels && activeTenant.customSpaceLabels.length > 0
    ? activeTenant.customSpaceLabels
    : ['L01', 'L02', 'L03'];
  
  const [modalOpen, setModalOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<SpaceData | null>(null);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const activeTenantId = resolvedTenantId;
      const url = activeTenantId ? `/api/admin/spaces?tenantId=${activeTenantId}` : `/api/admin/spaces`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch spaces');
      
      const data = await res.json();
      setSpaces(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Error cargando espacios');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (res.ok) {
          const data = await res.json();
          setAllTenants(data);
          
          if (!tenantId && data.length > 0) {
            setTenantId(data[0].tenantId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tenants', err);
      }
    };
    fetchTenants();
  }, []);

  useEffect(() => {
    if (resolvedTenantId) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      fetchSpaces();
    }
  }, [resolvedTenantId]);

  const handleDelete = async (spaceId: string) => {
    if (!window.confirm(t('delete_confirm'))) return;

    try {
      const res = await fetch(`/api/admin/spaces/${spaceId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error deleting space');
      }
      toast.success('Espacio eliminado');
      fetchSpaces();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  return {
    spaces,
    loading,
    tenantId: resolvedTenantId,
    setTenantId,
    allTenants,
    customSpaceLabels,
    modalOpen,
    setModalOpen,
    spaceToEdit,
    setSpaceToEdit,
    fetchSpaces,
    handleDelete,
  };
}
export type { SpaceData };
