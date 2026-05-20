'use client';

import { useTranslations } from 'next-intl';
import { Plus, Database, FolderOpen, ArrowLeft } from 'lucide-react';
import { SpaceTreeView } from '@/components/admin/spaces/SpaceTreeView';
import { CreateEditSpaceModal } from '@/components/admin/spaces/CreateEditSpaceModal';
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation';
import { useSpacesManager, SpaceData } from '@/hooks/useSpacesManager';
import Link from 'next/link';

export default function SpacesPage() {
  const t = useTranslations('dashboard.spaces');
  const tAdmin = useTranslations('admin');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string || 'en';
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
            {/* Tag Monospace de Ubicación (Breadcrumb/Ruta) de acuerdo con la guía de estilo */}
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
              <FolderOpen size={14} className="text-primary animate-pulse" aria-hidden="true" />
              <span className="animate-console-pulse">{tAdmin('controlConsole')} • {t('title')}</span>
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              {/* Botón de Retroceso Aséptico y Táctico rounded-none */}
              <Link 
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
              
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
                {t('title')}
              </h1>
            </div>
            
            {/* Subtítulo descriptivo en Geist Sans, tamaño normal y sentence-case */}
            <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
              {t('subtitle')}
            </p>

            {/* 🏢 Selector de Tenant Activo (para SuperAdmins con múltiples tenants) */}
            {allTenants && allTenants.length > 1 && (
              <div className="flex flex-col gap-2 p-4 bg-secondary/20 border border-border rounded-xl max-w-md mt-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2 font-mono">
                  <Database size={12} aria-hidden="true" />
                  {tAdmin('selectedOrganization')}
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => {
                    const newTenantId = e.target.value;
                    setTenantId(newTenantId);
                    router.push(`${pathname}?tenantId=${newTenantId}`);
                  }}
                  className="w-full bg-background border border-border hover:border-primary/40 text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-bold font-mono"
                >
                  <option value="" className="bg-card text-foreground">{t('select_tenant', { defaultMessage: 'Selecciona una organización' })}</option>
                  {allTenants.map(ten => (
                    <option key={ten.tenantId} value={ten.tenantId} className="bg-card text-foreground">
                      {ten.name} ({ten.tenantId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Botón de Avance / Crear Raíz pulido bajo los estándares exactos */}
            <button 
              onClick={handleCreateRoot}
              aria-label={t('new_space')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
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
