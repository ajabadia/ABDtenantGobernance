'use client';

import { useTranslations } from 'next-intl';
import { Plus, FolderOpen, ArrowLeft } from 'lucide-react';
import { SpaceTreeView } from '@/components/admin/spaces/SpaceTreeView';
import { CreateEditSpaceModal } from '@/components/admin/spaces/CreateEditSpaceModal';
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation';
import { useSpacesManager, SpaceData } from '@/hooks/useSpacesManager';
import Link from 'next/link';
import { AdminPageHeader } from '@abd/styles';

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
        
        <AdminPageHeader
          icon={FolderOpen}
          breadcrumb={<>{tAdmin('controlConsole')} • {t('title')}</>}
          title={t('title')}
          backButton={
              <Link 
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={t('subtitle')}
        >
            {/* Botón de Avance / Crear Raíz pulido bajo los estándares exactos */}
            <button 
              onClick={handleCreateRoot}
              aria-label={t('new_space')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <Plus className="h-4 w-4" />
              {t('new_space')}
            </button>
        </AdminPageHeader>

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
