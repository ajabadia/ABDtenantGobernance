'use client';

/**
 * @purpose Valida y renderiza un campo de texto para el nombre del remitente de una correo electrónico, con validación y estilos.
 * @purpose_en Renders a text input for the sender's name in an email, with validation and styling.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:dqghnz
 * @lastUpdated 2026-06-23T21:44:22.772Z
 */

import React from 'react';

interface EmailFromNameInputProps {
  fromName: string;
  onChange: (value: string) => void;
}

export function EmailFromNameInput({ fromName, onChange }: EmailFromNameInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-wider text-primary">
        Nombre Remitente del Email
      </label>
      <input
        type="text"
        value={fromName}
        onChange={e => onChange(e.target.value)}
        className="h-10 px-4 rounded-none bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground"
        placeholder="Ej: ABD RAG Platform"
      />
    </div>
  );
}
