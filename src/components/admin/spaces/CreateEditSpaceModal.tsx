'use client';

/**
 * @purpose Renderiza una dialogo modal para crear o editar espacios dentro de un inquilino, utilizando un componente de forma para manejar datos de espacio.
 * @purpose_en Renders a modal dialog for creating or editing spaces within a tenant, utilizing a form component to handle space data.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:3,sig:8aq5s8
 * @lastUpdated 2026-06-23T21:45:04.288Z
 */

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SpaceForm, SpaceData } from './SpaceForm';

export type { SpaceData };

interface CreateEditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  spaceToEdit?: SpaceData | null;
  allSpaces: SpaceData[];
  onSaved: () => void;
  customSpaceLabels?: string[];
}

export function CreateEditSpaceModal({
  isOpen,
  onClose,
  tenantId,
  spaceToEdit,
  allSpaces,
  onSaved,
  customSpaceLabels = ['L01', 'L02', 'L03']
}: CreateEditSpaceModalProps) {
  const t = useTranslations('dashboard.spaces');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-widest text-foreground italic">
            {spaceToEdit ? t('edit_space') : t('new_space')}
          </DialogTitle>
        </DialogHeader>

        <SpaceForm 
          tenantId={tenantId}
          spaceToEdit={spaceToEdit}
          allSpaces={allSpaces}
          onSaved={onSaved}
          onClose={onClose}
          customSpaceLabels={customSpaceLabels}
        />
      </DialogContent>
    </Dialog>
  );
}
