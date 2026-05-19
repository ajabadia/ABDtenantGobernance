'use client';

import { useTranslations } from 'next-intl';

interface BorderRadiusSelectorProps {
  isRounded: boolean;
  radiusValue: string;
  onRoundedChange: (val: boolean) => void;
  onRadiusChange: (val: string) => void;
}

export function BorderRadiusSelector({
  isRounded,
  radiusValue,
  onRoundedChange,
  onRadiusChange
}: BorderRadiusSelectorProps) {
  const t = useTranslations('admin');

  return (
    <div className="flex flex-col gap-3 bg-secondary/10 border border-border p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground">{t('roundedBorders')}</span>
          <span className="text-[10px] text-muted-foreground">{t('roundedBordersDesc')}</span>
        </div>
        <input 
          type="checkbox" 
          checked={isRounded} 
          onChange={(e) => onRoundedChange(e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        />
      </div>

      {isRounded && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">{t('borderRadius')}</label>
          <select 
            value={radiusValue} 
            onChange={(e) => onRadiusChange(e.target.value)}
            className="bg-background border border-border rounded p-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="0.25rem">{t('fineCyber')}</option>
            <option value="0.375rem">{t('standardSmooth')}</option>
            <option value="0.5rem">{t('organicMedium')}</option>
            <option value="0.75rem">{t('roundedPremium')}</option>
            <option value="1rem">{t('circularLarge')}</option>
          </select>
        </div>
      )}
    </div>
  );
}
