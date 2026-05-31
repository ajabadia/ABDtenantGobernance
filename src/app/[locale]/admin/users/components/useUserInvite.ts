'use client';

import { useState, useEffect, startTransition } from 'react';
import { toast } from 'sonner';
import { inviteUserAction } from '../actions';
import { updateUserGroupsAction } from '../memberships-actions';

export function useUserInvite(
  tenantId: string,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void
) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    startTransition(() => {
      if (isOpen) {
        setEmail('');
        setName('');
        setRole('student');
        setSelectedGroups([]);
        setError('');
      }
    });
  }, [isOpen]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const invitePromise = inviteUserAction({
        email, name, tenantId, role,
        allowedApps: ['quiz'],
        groupIds: selectedGroups.length > 0 ? selectedGroups : undefined,
      }).then(result => {
        if (result?.error) throw new Error(result.error);
        return result;
      });

      const groupsPromise = invitePromise.then(result => {
        if (result?.data && selectedGroups.length > 0) {
          return updateUserGroupsAction(tenantId, result.data._id, selectedGroups);
        }
      });

      await toast.promise(
        Promise.all([invitePromise, groupsPromise]),
        {
          loading: 'Enviando invitación…',
          success: 'Usuario invitado correctamente',
          error: (err) => `Error: ${err instanceof Error ? err.message : 'Fallo la invitación'}`,
        }
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al invitar al usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email, setEmail, name, setName, role, setRole,
    selectedGroups, toggleGroup, isLoading, error, handleSubmit,
  };
}
