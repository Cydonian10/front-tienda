import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import type { AbrirTurnoDto, CerrarTurnoDto } from '../../api/interfaces/ventas/caja-turno.interface';
import { CajaTurnosApi } from '../../api/ventas/caja-turnos/caja-turnos-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { cajasListadoQueryKey } from './use-cajas-action';

export const resumenTurnoQueryKey = (cajaId: string, turnoId: string) =>
  ['cajas', cajaId, 'turnos', turnoId, 'resumen'] as const;

export function useResumenTurno(cajaId: () => string, turnoId: () => string) {
  const api = inject(CajaTurnosApi);

  return injectQuery(() => {
    const caja = cajaId();
    const turno = turnoId();
    return {
      queryKey: resumenTurnoQueryKey(caja, turno),
      queryFn: () => api.resumen(caja, turno),
      enabled: !!caja && !!turno,
      retry: false,
    };
  });
}

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

  const cerrarMutation = injectMutation(() => ({
    mutationFn: ({ cajaId, turnoId, dto }: { cajaId: string; turnoId: string; dto: CerrarTurnoDto }) =>
      api.cerrar(cajaId, turnoId, dto),
    onSuccess: async (_resultado, { dto }) => {
      await client.invalidateQueries({ queryKey: cajasListadoQueryKey });
      toast.success(dto.tipoCierre === 'dia' ? 'Día cerrado correctamente.' : 'Turno cerrado correctamente.');
    },
  }));

  return { abrirMutation, cerrarMutation };
}
