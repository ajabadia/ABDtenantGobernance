"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Building2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Tenant } from "@/lib/schemas/tenant"
import type { SaveTenantAction } from "./types"
import { IndustrialModalHeader } from "@/components/ui/industrial/ModalHeader"
import { TenantForm } from "./TenantForm"
import { ANIM_DURATION } from "@abd/ecosystem-widgets"

interface TenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: SaveTenantAction;
  initialData?: Tenant | null;
  title: string;
}

export function TenantDialog({ isOpen, onClose, onSave, initialData, title }: TenantDialogProps) {
  const t = useTranslations('dashboard.tenants')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // -- Mount / unmount lifecycle for exit animation --
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevOpenRef = useRef(isOpen)
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setMounted(true)
    } else if (prevOpenRef.current) {
      closeTimerRef.current = setTimeout(() => {
        setMounted(false)
      }, ANIM_DURATION)
    }

    prevOpenRef.current = isOpen

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [isOpen])

  if (!mounted) return null

  const handleSubmit = async (data: Partial<Tenant>) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-150'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onClose(); }} />

      <div
        className={`relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] ${
          isOpen ? 'animate-in zoom-in-95 duration-200' : 'animate-out zoom-out-95 duration-150'
        }`}
      >
        <IndustrialModalHeader
          title={title}
          subtitle={t('orchestrator_version')}
          icon={Building2}
          onClose={onClose}
        />

        <TenantForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
