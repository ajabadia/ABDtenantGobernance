'use client';

import { useTranslations } from 'next-intl';
import { Plus, Database } from 'lucide-react';
import { SpaceTreeView } from '@/components/admin/spaces/SpaceTreeView';
import { CreateEditSpaceModal } from '@/components/admin/spaces/CreateEditSpaceModal';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSpacesManager, SpaceData } from '@/hooks/useSpacesManager';

export default function SpacesPage() {
  const t = useTranslations('dashboard.spaces');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const explicitTenantId = searchParams.get('tenantId');

  const {
    spaces,
    loading,
    tenantId,
    setTenantId,
    allTenants,
    customSpaceLabels,
    modalOpen,
    setModalOpen,
    spaceToEdit,
    setSpaceToEdit,
    fetchSpaces,
    handleDelete,
  } = useSpacesManager(explicitTenantId);

  const handleCreateRoot = () => {
    setSpaceToEdit(null);
    setModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setSpaceToEdit({
      name: '',
      slug: '',
      type: 'TENANT',
      visibility: 'INTERNAL',
      parentSpaceId: parentId
    } as SpaceData);
    setModalOpen(true);
  };

  const handleEdit = (space: SpaceData) => {
    setSpaceToEdit(space);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                {t('title')}
              </h1>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono ml-2">
              {t('subtitle')}
            </p>

            {/* 🏢 Selector de Tenant Activo (para SuperAdmins con múltiples tenants) */}
            {allTenants && allTenants.length > 1 && (
              <div className="flex flex-col gap-2 p-4 bg-secondary/20 border border-border rounded-xl max-w-md mt-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Database size={12} aria-hidden="true" />
                  Organización Seleccionada
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => {
                    const newTenantId = e.target.value;
                    setTenantId(newTenantId);
                    router.push(`${pathname}?tenantId=${newTenantId}`);
                  }}
                  className="w-full bg-background border border-border hover:border-primary/40 text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="">{t('select_tenant', { defaultMessage: 'Selecciona una organización' })}</option>
                  {allTenants.map(ten => (
                    <option key={ten.tenantId} value={ten.tenantId}>{ten.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleCreateRoot}
              aria-label={t('new_space')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-150 rounded-none border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
            >
              <Plus className="h-4 w-4" />
              {t('new_space')}
            </button>
          </div>
        </header>

        <div className="mt-8">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground font-mono text-xs uppercase tracking-widest">{t('loading', { defaultMessage: 'Cargando jerarquía...' })}</div>
          ) : (
          <SpaceTreeView 
            spaces={spaces} 
            customSpaceLabels={customSpaceLabels}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        )}
        </div>

        <CreateEditSpaceModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          tenantId={tenantId}
          allSpaces={spaces}
          spaceToEdit={spaceToEdit}
          onSaved={fetchSpaces}
          customSpaceLabels={customSpaceLabels}
        />
      </div>
    </main>
  );
}
