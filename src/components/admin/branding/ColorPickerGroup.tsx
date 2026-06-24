'use client';

/**
 * @purpose Renderiza un conjunto de pickers de colores primarios, secundarios y de acento con etiquetas.
 * @purpose_en Renders a group of color pickers for primary, secondary, and accent colors with labels.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:154fo3f
 * @lastUpdated 2026-06-23T21:44:19.166Z
 */

import React from 'react';
import { useTranslations } from 'next-intl';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2 bg-secondary/10 border border-border p-3 rounded-lg">
      <label className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
        />
        <span className="text-xs font-mono text-foreground">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

interface ColorPickerGroupProps {
  primaryColor: string;
  setPrimaryColor: (val: string) => void;
  secondaryColor: string;
  setSecondaryColor: (val: string) => void;
  accentColor: string;
  setAccentColor: (val: string) => void;
}

export function ColorPickerGroup({
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  accentColor,
  setAccentColor,
}: ColorPickerGroupProps) {
  const t = useTranslations('admin');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ColorPicker 
        label={t('primaryColor')} 
        value={primaryColor} 
        onChange={setPrimaryColor} 
      />
      <ColorPicker 
        label={t('secondaryColor')} 
        value={secondaryColor} 
        onChange={setSecondaryColor} 
      />
      <ColorPicker 
        label={t('accentColor')} 
        value={accentColor} 
        onChange={setAccentColor} 
      />
    </div>
  );
}
