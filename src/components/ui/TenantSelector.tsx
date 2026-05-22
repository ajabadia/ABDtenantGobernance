'use client';

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { TenantSelector as SharedTenantSelector, type TenantOption, type ContextOption } from "@abd/styles";

interface TenantApiResponse {
  tenantId: string;
  name?: string;
  active?: boolean;
}

interface SessionUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

interface TenantSelectorProps {
  sessionUser?: SessionUser;
}

export function TenantSelector({ sessionUser }: TenantSelectorProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [superAdminTenants, setSuperAdminTenants] = useState<TenantOption[]>([]);
  const [spaces, setSpaces] = useState<ContextOption[]>([]);
  const [groups, setGroups] = useState<ContextOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userRole = sessionUser?.role || "USER";
  const defaultTenantId = sessionUser?.tenantId || "";
  const activeTenantId = searchParams.get("tenantId") || defaultTenantId;
  const activeContextId = searchParams.get("contextId") || "";

  // Compute tenants list: for non-SUPER_ADMIN users derive it directly without setState
  const tenants = useMemo<TenantOption[]>(() => {
    if (userRole !== 'SUPER_ADMIN') {
      if (!defaultTenantId) return [];
      return [{ tenantId: defaultTenantId, name: defaultTenantId }];
    }
    return superAdminTenants;
  }, [userRole, defaultTenantId, superAdminTenants]);

  // Fetch all tenants only for SUPER_ADMIN
  useEffect(() => {
    if (userRole !== "SUPER_ADMIN") return;

    const fetchAllTenants = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/tenants");
        if (res.ok) {
          const data: TenantApiResponse[] = await res.json();
          const options: TenantOption[] = data.map((t) => ({
            tenantId: t.tenantId,
            name: t.name || t.tenantId,
            active: t.active,
          }));
          setSuperAdminTenants(options);
        }
      } catch (error) {
        console.error("[TENANT_SELECTOR_FETCH_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTenants();
  }, [userRole]);

  // Fetch spaces and groups for the active tenant
  useEffect(() => {
    if (!activeTenantId) return;

    const fetchContexts = async () => {
      try {
        const [spacesRes, groupsRes] = await Promise.all([
          fetch(`/api/admin/spaces?tenantId=${activeTenantId}`),
          fetch(`/api/admin/permissions/groups?tenantId=${activeTenantId}`)
        ]);

        if (spacesRes.ok) {
          const data = await spacesRes.json();
          const items = Array.isArray(data) ? data : (data.items || []);
          setSpaces(items.map((s: { _id?: string; id?: string; name: string }) => ({ id: s._id || s.id || '', name: s.name })));
        }
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          const items = Array.isArray(data) ? data : (data.items || []);
          setGroups(items.map((g: { _id?: string; id?: string; name: string }) => ({ id: g._id || g.id || '', name: g.name })));
        }
      } catch (error) {
        console.error("[TENANT_SELECTOR_CONTEXT_FETCH_ERROR]", error);
      }
    };

    fetchContexts();
  }, [activeTenantId]);

  const handleTenantChange = (newTenantId: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tenantId", newTenantId);
    current.delete("contextId");
    current.delete("contextType");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
    router.refresh();
  };

  const handleContextChange = (newContextId: string, type: 'space' | 'group') => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("contextId", newContextId);
    current.set("contextType", type);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
    router.refresh();
  };

  if (!sessionUser) return null;

  return (
    <SharedTenantSelector
      activeTenantId={activeTenantId}
      tenants={tenants}
      onTenantChange={handleTenantChange}
      spaces={spaces}
      groups={groups}
      activeContextId={activeContextId}
      onContextChange={handleContextChange}
      userRole={userRole}
      isLoading={isLoading}
      translations={{
        title: "Organización",
        searchPlaceholder: "Buscar...",
        noTenantsFound: "Sin resultados",
        activeTenantBadge: "Organización Activa",
        selectTenant: "Seleccionar organización",
      }}
    />
  );
}
