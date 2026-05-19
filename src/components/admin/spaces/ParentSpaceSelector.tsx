'use client';

import { useTranslations } from 'next-intl';
import { SpaceData } from './SpaceForm';

interface ParentSpaceSelectorProps {
  value: string;
  onChange: (val: string) => void;
  allSpaces: SpaceData[];
  spaceToEdit?: SpaceData | null;
}

export function ParentSpaceSelector({
  value,
  onChange,
  allSpaces,
  spaceToEdit
}: ParentSpaceSelectorProps) {
  const t = useTranslations('dashboard.spaces');

  // Prevenir que un espacio sea su propio padre o padre de sus propios hijos en la UI
  const getAvailableParents = () => {
    if (!spaceToEdit) return allSpaces;
    return allSpaces.filter(s => {
      if (s._id === spaceToEdit._id) return false;
      // Evitar referencias circulares filtrando descendientes
      if (s.materializedPath && spaceToEdit.materializedPath && s.materializedPath.startsWith(spaceToEdit.materializedPath + '/')) {
        return false;
      }
      return true;
    });
  };

  return (
    <select 
      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="" className="bg-background">{t('no_parent')}</option>
      {getAvailableParents().map(s => (
        <option key={s._id} value={s._id} className="bg-background">
          {s.materializedPath || s.name}
        </option>
      ))}
    </select>
  );
}
