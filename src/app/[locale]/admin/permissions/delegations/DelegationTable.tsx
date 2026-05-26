'use client'

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, useConfirmDialog } from '@abd/ecosystem-widgets';
import { fetchDelegationsAction, revokeDelegationAction } from './actions';

export interface DelegationUI {
  _id: string;
  delegateeId: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export function DelegationTable({ tenantId }: { tenantId: string }) {
  const [delegations, setDelegations] = useState<DelegationUI[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDelegations = async () => {
    setLoading(true);
    const res = await fetchDelegationsAction(tenantId);
    if (res.data) {
      setDelegations(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDelegations();
  }, [tenantId]);

  const revokeDialog = useConfirmDialog<string>({
    onConfirm: async (id) => {
      const res = await revokeDelegationAction(id, tenantId);
      if (res.success) {
        await loadDelegations();
      } else {
        toast.error(res.error || 'Error al revocar');
      }
    },
  });

  const handleRevoke = (id: string) => {
    revokeDialog.trigger(id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{'Delegaciones de Roles (Activas / Históricas)'}</CardTitle>
        <CardDescription>
          {'Administra los permisos temporales delegados a usuarios del tenant.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{'Cargando delegaciones...'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3">{'Delegado (ID)'}</th>
                  <th className="p-3">{'Inicio'}</th>
                  <th className="p-3">{'Fin'}</th>
                  <th className="p-3">{'Estado'}</th>
                  <th className="p-3 text-right">{'Acciones'}</th>
                </tr>
              </thead>
              <tbody>
                {delegations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">{'No hay delegaciones registradas.'}</td>
                  </tr>
                ) : (
                  delegations.map(del => {
                    const now = new Date();
                    const end = new Date(del.expiresAt);
                    const start = new Date(del.startsAt);
                    const isExpired = now > end;
                    const isActive = del.isActive && !isExpired && now >= start;

                    return (
                      <tr key={del._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">{del.delegateeId}</td>
                        <td className="p-3">{start.toLocaleDateString()}</td>
                        <td className="p-3">{end.toLocaleDateString()}</td>
                        <td className="p-3">
                          {isActive ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">{'Activa'}</Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="text-muted-foreground">{'Expirada'}</Badge>
                          ) : !del.isActive ? (
                            <Badge variant="destructive">{'Revocada'}</Badge>
                          ) : (
                            <Badge variant="secondary">{'Programada'}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {(del.isActive && !isExpired) && (
                            <Button size="sm" variant="destructive" onClick={() => handleRevoke(del._id)}>
                              {'Revocar'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={revokeDialog.open}
        title="REVOCAR DELEGACIÓN"
        message="¿Estás seguro de que deseas revocar esta delegación de forma anticipada?"
        confirmLabel="REVOCAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={revokeDialog.isLoading}
        onConfirm={revokeDialog.confirm}
        onCancel={revokeDialog.cancel}
      />
    </Card>
  );
}
