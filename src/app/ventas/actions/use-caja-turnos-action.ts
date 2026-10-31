import { inject } from '@angular/core';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import type { AbrirTurnoDto } from '../../api/interfaces/ventas/caja-turno.interface';
import { CajaTurnosApi } from '../../api/ventas/caja-turnos/caja-turnos-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { cajasListadoQueryKey } from './use-cajas-action';

export function useCajaTurnos() {
  const api = inject(CajaTurnosApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);

  const abrirMutation = injectMutation(() => ({
    mutationFn: ({ cajaId, dto }: { cajaId: string; dto?: AbrirTurnoDto }) => api.abrir(cajaId, dto),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: cajasListadoQueryKey });
      toast.success('Turno abierto correctamente.');
    },
  }));

  return { abrirMutation };
}
