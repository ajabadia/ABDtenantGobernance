'use client';

import { useTranslations } from 'next-intl';

interface SpaceVisibilitySelectorProps {
  visibility: string;
  onChange: (value: string) => void;
  showCascade?: boolean;
  cascadeVisibility?: boolean;
  onCascadeChange?: (value: boolean) => void;
}

export function SpaceVisibilitySelector({
  visibility,
  onChange,
  showCascade = false,
  cascadeVisibility = false,
  onCascadeChange,
}: SpaceVisibilitySelectorProps) {
  const t = useTranslations('dashboard.spaces');

  return (
    <>
      <div className="grid gap-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          {t('visibility_label')}
        </label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          value={visibility}
          onChange={e => onChange(e.target.value)}
        >
          <option value="PUBLIC" className="bg-background">{t('vis_public', { defaultMessage: 'Público' })}</option>
          <option value="INTERNAL" className="bg-background">{t('vis_internal', { defaultMessage: 'Interno' })}</option>
          <option value="PRIVATE" className="bg-background">{t('vis_private', { defaultMessage: 'Privado' })}</option>
        </select>
      </div>

      {showCascade && onCascadeChange && (
        <div className="flex items-center justify-between p-4 bg-secondary/10 border border-border rounded-lg">
          <div className="flex flex-col gap-0.5">
            <label htmlFor="cascade-visibility" className="text-xs font-semibold text-foreground cursor-pointer select-none">
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
            onChange={e => onCascadeChange(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}
    </>
  );
}
