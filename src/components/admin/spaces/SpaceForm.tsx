'use client';

import { useState, useEffect, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SpaceFormFields } from './SpaceFormFields';

export interface SpaceData {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  visibility: string;
  parentSpaceId?: string | null;
  materializedPath?: string;
  collaborators?: {
    subjectId: string;
    subjectType: 'USER' | 'GROUP';
    role: 'VIEWER' | 'EDITOR' | 'ADMIN';
    propagates: boolean;
  }[];
}

interface SpaceFormProps {
  tenantId: string;
  spaceToEdit?: SpaceData | null;
  allSpaces: SpaceData[];
  onSaved: () => void;
  onClose: () => void;
  customSpaceLabels?: string[];
}

export function SpaceForm({
  tenantId,
  spaceToEdit,
  allSpaces,
  onSaved,
  onClose,
  customSpaceLabels = ['L01', 'L02', 'L03']
}: SpaceFormProps) {
  const t = useTranslations('dashboard.spaces');

  const [formData, setFormData] = useState<Partial<SpaceData>>({
    name: '',
    slug: '',
    description: '',
    type: 'TENANT',
    visibility: 'INTERNAL',
    parentSpaceId: ''
  });
  const [cascadeVisibility, setCascadeVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startTransition(() => {
      if (spaceToEdit) {
        setFormData({ ...spaceToEdit, parentSpaceId: spaceToEdit.parentSpaceId || '' });
        setCascadeVisibility(false);
      } else {
        setFormData({ name: '', slug: '', description: '', type: 'TENANT', visibility: 'INTERNAL', parentSpaceId: '' });
        setCascadeVisibility(false);
      }
    });
  }, [spaceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      tenantId,
      parentSpaceId: formData.parentSpaceId === '' ? null : formData.parentSpaceId,
      cascade: cascadeVisibility
    };

    const url = spaceToEdit ? `/api/admin/spaces/${spaceToEdit._id}` : '/api/admin/spaces';
    const method = spaceToEdit ? 'PATCH' : 'POST';

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async res => {
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save space');
      onSaved();
      onClose();
      return res;
    });

    toast.promise(promise, {
      loading: t('saving', { defaultMessage: spaceToEdit ? 'Actualizando espacio...' : 'Creando espacio...' }),
      success: t('space_updated', { defaultMessage: spaceToEdit ? 'Espacio actualizado' : 'Espacio creado' }),
      error: (err: Error) => err.message || 'Error saving space',
    });

    await promise.catch(() => {});
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <SpaceFormFields
        formData={formData}
        setFormData={setFormData}
        spaceToEdit={spaceToEdit}
        allSpaces={allSpaces}
        customSpaceLabels={customSpaceLabels}
        cascadeVisibility={cascadeVisibility}
        setCascadeVisibility={setCascadeVisibility}
      />

      <DialogFooter className="pt-4 border-t border-border mt-4">
        <Button 
          type="button" 
          onClick={onClose} 
          disabled={loading}
          variant="outline"
          className="text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          {t('cancel', { defaultMessage: 'Cancelar' })}
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-primary hover:bg-primary/80 text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/10"
        >
          {loading ? t('saving', { defaultMessage: 'Guardando...' }) : t('save', { defaultMessage: 'Guardar' })}
        </Button>
      </DialogFooter>
    </form>
  );
}
