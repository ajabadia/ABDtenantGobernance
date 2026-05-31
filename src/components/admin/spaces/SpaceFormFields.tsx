'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParentSpaceSelector } from './ParentSpaceSelector';
import { SpaceVisibilitySelector } from './SpaceVisibilitySelector';
import type { SpaceData } from './SpaceForm';

interface SpaceFormFieldsProps {
  formData: Partial<SpaceData>;
  setFormData: (data: Partial<SpaceData>) => void;
  spaceToEdit?: SpaceData | null;
  allSpaces: SpaceData[];
  customSpaceLabels: string[];
  cascadeVisibility: boolean;
  setCascadeVisibility: (v: boolean) => void;
}

export function SpaceFormFields({
  formData, setFormData,
  spaceToEdit, allSpaces,
  customSpaceLabels,
  cascadeVisibility, setCascadeVisibility,
}: SpaceFormFieldsProps) {
  const t = useTranslations('dashboard.spaces');

  const handleSlugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (val: string) => {
    setFormData({ ...formData, name: val, slug: !spaceToEdit ? handleSlugify(val) : formData.slug });
  };

  const parentId = formData.parentSpaceId || null;
  const parentSpace = parentId ? allSpaces.find(s => s._id === parentId) : null;
  const levelIndex = parentSpace && parentSpace.materializedPath
    ? parentSpace.materializedPath.split('/').filter(Boolean).length : 0;
  const levelName = customSpaceLabels[Math.min(levelIndex, customSpaceLabels.length - 1)] || `Nivel ${levelIndex + 1}`;

  return (
    <>
      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('name_label')}</Label>
        <Input required value={formData.name || ''} onChange={e => handleNameChange(e.target.value)}
          placeholder="Ej: Departamento IT" className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary" />
      </div>
      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('slug_label')}</Label>
        <Input required value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: handleSlugify(e.target.value) })}
          className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary font-mono text-xs" />
      </div>
      <div className="grid gap-2">
        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('parent_label')}</Label>
        <ParentSpaceSelector value={formData.parentSpaceId || ''} onChange={val => setFormData({ ...formData, parentSpaceId: val })}
          allSpaces={allSpaces} spaceToEdit={spaceToEdit} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('level')}</Label>
          <div className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-primary font-bold items-center cursor-not-allowed">
            {levelName} (L0{levelIndex + 1})
          </div>
        </div>
        <SpaceVisibilitySelector visibility={formData.visibility || 'INTERNAL'} onChange={val => setFormData({ ...formData, visibility: val })}
          showCascade={!!spaceToEdit} cascadeVisibility={cascadeVisibility} onCascadeChange={setCascadeVisibility} />
      </div>
    </>
  );
}
