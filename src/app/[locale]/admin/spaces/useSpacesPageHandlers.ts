'use client';

import { useState } from 'react';
import { useSpacesManager, SpaceData } from '@/hooks/useSpacesManager';

export function useSpacesPageHandlers(explicitTenantId: string | null) {
  const {
    spaces, loading, tenantId, setTenantId,
    allTenants, customSpaceLabels,
    modalOpen, setModalOpen, spaceToEdit, setSpaceToEdit,
    fetchSpaces, handleDelete, deleteTargetId,
    handleConfirmDelete, handleCancelDelete, isDeleting,
  } = useSpacesManager(explicitTenantId);

  const [collaboratorsModalOpen, setCollaboratorsModalOpen] = useState(false);
  const [assetsModalOpen, setAssetsModalOpen] = useState(false);

  const handleCreateRoot = () => {
    setSpaceToEdit(null);
    setModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setSpaceToEdit({
      name: '', slug: '', type: 'TENANT' as const,
      visibility: 'INTERNAL' as const, parentSpaceId: parentId
    } as SpaceData);
    setModalOpen(true);
  };

  const handleEdit = (space: SpaceData) => {
    setSpaceToEdit(space);
    setModalOpen(true);
  };

  const handleManageCollaborators = (space: SpaceData) => {
    setSpaceToEdit(space);
    setCollaboratorsModalOpen(true);
  };

  const handleManageAssets = (space: SpaceData) => {
    setSpaceToEdit(space);
    setAssetsModalOpen(true);
  };

  return {
    spaces, loading, tenantId, setTenantId,
    allTenants, customSpaceLabels,
    modalOpen, setModalOpen, spaceToEdit, setSpaceToEdit,
    fetchSpaces, handleDelete, deleteTargetId,
    handleConfirmDelete, handleCancelDelete, isDeleting,
    collaboratorsModalOpen, setCollaboratorsModalOpen,
    assetsModalOpen, setAssetsModalOpen,
    handleCreateRoot, handleAddChild,
    handleEdit, handleManageCollaborators, handleManageAssets,
  };
}
