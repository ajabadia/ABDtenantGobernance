'use client';

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
