'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ParentSpaceSelector } from './ParentSpaceSelector';

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
    if (spaceToEdit) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFormData({ ...spaceToEdit, parentSpaceId: spaceToEdit.parentSpaceId || '' });
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setCascadeVisibility(false);
    } else {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: 'TENANT',
        visibility: 'INTERNAL',
        parentSpaceId: ''
      });
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setCascadeVisibility(false);
    }
  }, [spaceToEdit]);

  const handleSlugify = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: !spaceToEdit ? handleSlugify(val) : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tenantId,
        parentSpaceId: formData.parentSpaceId === '' ? null : formData.parentSpaceId,
        cascade: cascadeVisibility
      };

      const url = spaceToEdit ? `/api/admin/spaces/${spaceToEdit._id}` : `/api/admin/spaces`;
      const method = spaceToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save space');
      }

      toast.success(
        spaceToEdit 
          ? t('space_updated', { defaultMessage: 'Espacio actualizado' }) 
          : t('space_created', { defaultMessage: 'Espacio creado' })
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Error saving space');
      }
    } finally {
      setLoading(false);
    }
  };

  const parentId = formData.parentSpaceId || null;
  const parentSpace = parentId ? allSpaces.find(s => s._id === parentId) : null;
  const levelIndex = parentSpace && parentSpace.materializedPath 
    ? parentSpace.materializedPath.split('/').filter(Boolean).length 
    : 0;
  const levelName = customSpaceLabels[Math.min(levelIndex, customSpaceLabels.length - 1)] || `Nivel ${levelIndex + 1}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('name_label')}</Label>
        <Input 
          required
          value={formData.name || ''} 
          onChange={e => handleNameChange(e.target.value)} 
          placeholder="Ej: Departamento IT"
          className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('slug_label')}</Label>
        <Input 
          required
          value={formData.slug || ''} 
          onChange={e => setFormData({ ...formData, slug: handleSlugify(e.target.value) })} 
          className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary font-mono text-xs"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('parent_label')}</Label>
        <ParentSpaceSelector 
          value={formData.parentSpaceId || ''}
          onChange={val => setFormData({ ...formData, parentSpaceId: val })}
          allSpaces={allSpaces}
          spaceToEdit={spaceToEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('type_label', { defaultMessage: 'Nivel Jerárquico' })}</Label>
          <div className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-primary font-bold items-center cursor-not-allowed">
            {levelName} (L0{levelIndex + 1})
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('visibility_label')}</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            value={formData.visibility || 'INTERNAL'}
            onChange={e => setFormData({ ...formData, visibility: e.target.value })}
          >
            <option value="PUBLIC" className="bg-background">{t('vis_public', { defaultMessage: 'Público' })}</option>
            <option value="INTERNAL" className="bg-background">{t('vis_internal', { defaultMessage: 'Interno' })}</option>
            <option value="PRIVATE" className="bg-background">{t('vis_private', { defaultMessage: 'Privado' })}</option>
          </select>
        </div>
      </div>

      {spaceToEdit && (
        <div className="flex items-center justify-between p-4 bg-secondary/10 border border-border rounded-lg">
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="cascade-visibility"
              className="text-xs font-semibold text-foreground cursor-pointer select-none"
            >
              {t('cascade_label', { defaultMessage: 'Heredar recursivamente' })}
            </label>
            <span className="text-[10px] text-muted-foreground select-none leading-normal">
              {t('cascade_desc', { defaultMessage: 'Propaga la visibilidad seleccionada a todos los sub-espacios descendientes.' })}
            </span>
          </div>
          <input
            id="cascade-visibility"
            type="checkbox"
            checked={cascadeVisibility}
            onChange={e => setCascadeVisibility(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

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
