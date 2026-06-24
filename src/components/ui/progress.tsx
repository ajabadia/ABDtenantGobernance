'use client';

/**
 * @purpose Gestiona un componente progreso dinámico con estilos personalizables y valores.
 * @purpose_en Manages a dynamic progress bar component with customizable styles and values.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:0,imports:3,sig:1dpokyv
 * @lastUpdated 2026-06-23T21:46:42.869Z
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Extracting dynamic logic into a dedicated constant to ensure architectural purity.
  const dynamicStyle = { 
    "--progress-translate": `-${100 - (value || 0)}%` 
  } as React.CSSProperties;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all [transform:translateX(var(--progress-translate))]"
        style={dynamicStyle}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
