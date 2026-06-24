/**
 * @purpose Proporciona una combinación de clases Tailwind CSS utilizando `clsx` y `tailwind-merge`.
 * @purpose_en Merges and combines Tailwind CSS class names using `clsx` and `tailwind-merge`.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1gv7yg5
 * @lastUpdated 2026-06-23T21:47:57.747Z
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
