"use client"

import * as React from "react"
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, useConfirmDialog } from '@abd/ecosystem-widgets'
import type { Tenant } from "@/lib/schemas/tenant"
import { TenantDialog } from "./TenantDialog"
import { TenantCard } from "./TenantCard"
import { useRouter } from "next/navigation"
import type { TenantManagementTranslations } from "./types"
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput"

interface TenantManagementContainerProps {
  initialTenants: Tenant[];
  translations: TenantManagementTranslations;
}

export function TenantManagementContainer({ initialTenants, translations: t }: TenantManagementContainerProps) {
  const [tenants, setTenants] = React.useState<Tenant[]>(initialTenants)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null)
  const deleteDialog = useConfirmDialog<string>({
    onConfirm: async (id) => {
      const promise = fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      }).then(async response => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Error al eliminar organización')
        }
        router.refresh()
        setTenants(prev => prev.map(ten => ten._id?.toString() === id ? { ...ten, active: false } : ten))
      })
      toast.promise(promise, {
        loading: 'Eliminando organización...',
        success: 'Organización eliminada correctamente',
        error: (err: Error) => err.message || 'Error al eliminar organización',
      })
      await promise
    },
  })
  const router = useRouter()

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: Partial<Tenant>) => {
    const isEditing = !!editingTenant
    const url = isEditing ? `/api/admin/tenants/${editingTenant._id}` : '/api/admin/tenants'
    const method = isEditing ? 'PATCH' : 'POST'

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async response => {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error ${response.status} al guardar tenant`)
      }
      router.refresh()
      const updatedResponse = await fetch('/api/admin/tenants')
      if (updatedResponse.ok) {
        const newData = await updatedResponse.json()
        setTenants(newData)
      }
      return response
    })

    toast.promise(promise, {
      loading: isEditing ? 'Actualizando organización...' : 'Creando organización...',
      success: isEditing ? 'Organización actualizada correctamente' : 'Organización creada correctamente',
      error: (err: Error) => err.message || 'Error al guardar organización',
    })
  }

  const handleDelete = (id: string) => {
    deleteDialog.trigger(id)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground italic">{t.title}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
            {t.subtitle} • {tenants.length} records
          </p>
        </div>
        
        <button 
          aria-label={t.new_tenant}
          onClick={() => { setEditingTenant(null); setIsDialogOpen(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm outline-none"
        >
          <Plus size={14} aria-hidden="true" />
          {t.new_tenant}
        </button>
      </header>

      <IndustrialSearchInput 
        value={search} 
        onChange={setSearch} 
        placeholder="Search organizations..." 
        ariaLabel="Search organizations" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTenants.map((tenant) => (
          <TenantCard 
            key={tenant._id?.toString()} 
            tenant={tenant} 
            translations={t} 
            onEdit={(ten) => { setEditingTenant(ten); setIsDialogOpen(true); }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <TenantDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        initialData={editingTenant}
        title={editingTenant ? t.edit_tenant : t.register_tenant}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="ELIMINAR ORGANIZACIÓN"
        message={t.confirm_delete}
        confirmLabel="ELIMINAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.confirm}
        onCancel={deleteDialog.cancel}
      />
    </div>
  )
}
