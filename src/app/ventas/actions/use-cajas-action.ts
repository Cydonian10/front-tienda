import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import type { CrearCajaDto, FiltrarCajasDto } from '../../api/interfaces/ventas/caja.interface';
import { CajaApi } from '../../api/ventas/caja/caja-api';
import { ToastService } from '../../shared/services/toast/toast.service';

export const cajasListadoQueryKey = ['cajas', 'listado'] as const;
export const cajasQueryKey = (filtros: FiltrarCajasDto) =>
  [...cajasListadoQueryKey, filtros.fechaOperativa ?? null, filtros.estado ?? 'todas'] as const;

export function useCajas(filtros: () => FiltrarCajasDto = () => ({})) {
  const api = inject(CajaApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CrearCajaDto) => api.create(dto),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: cajasListadoQueryKey });
      toast.success('Caja creada correctamente.');
    },
  }));

  const listQuery = injectQuery(() => {
    const filtrosActuales = filtros();
    return {
      queryKey: cajasQueryKey(filtrosActuales),
      queryFn: () => api.list(filtrosActuales),
      retry: false,
    };
  });

  return { createMutation, listQuery };
}
