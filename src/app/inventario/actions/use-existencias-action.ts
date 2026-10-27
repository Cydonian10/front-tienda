import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { FiltroExistencias } from '../../api/interfaces/inventario/existencia.interface';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { resumenReposicionKey } from './use-dashboard-reposicion-action';

export const existenciasAlmacenesQueryKey = ['existencias', 'almacenes'] as const;
export const existenciasListadoQueryKey = ['existencias', 'listado'] as const;
export const existenciasQueryKey = (filtro: FiltroExistencias | null) =>
  [
    ...existenciasListadoQueryKey,
    filtro?.almacenId ?? null,
    filtro?.page ?? null,
    filtro?.limit ?? null,
    filtro?.q ?? null,
    filtro?.disponibilidad ?? null,
  ] as const;

export function useAlmacenesExistencias() {
  const api = inject(ExistenciaApi);

  return injectQuery(() => ({
    queryKey: existenciasAlmacenesQueryKey,
    queryFn: () => api.listarAlmacenes(),
    retry: false,
  }));
}

export function useExistencias(filtro: () => FiltroExistencias | null) {
  const api = inject(ExistenciaApi);

  return injectQuery(() => {
    const filtroActual = filtro();

    return {
      queryKey: existenciasQueryKey(filtroActual),
      queryFn: () => {
        if (!filtroActual) {
          throw new Error('Selecciona un almacén antes de consultar existencias.');
        }
        return api.listar(filtroActual);
      },
      enabled: filtroActual !== null && filtroActual.almacenId.length > 0,
      retry: false,
    };
  });
}

export interface MinimoExistenciaInput {
  varianteId: string;
  almacenId: string;
}

export interface GuardarMinimoInput extends MinimoExistenciaInput {
  minimoBase: string;
}

const minimoValido = /^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/;

export function useEditarMinimoExistencia() {
  const api = inject(ExistenciaApi);
  const client = inject(QueryClient);
  const authorization = inject(AuthorizationService);
  const checkPermission = () => {
    if (!authorization.hasPermission('INVENTARIO', PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM)) {
      throw new Error('No tienes permiso para editar mínimos de existencias.');
    }
  };
  const invalidate = async (almacenId: string) => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: existenciasListadoQueryKey,
        predicate: (query) => query.queryKey[2] === almacenId || query.queryKey[2] === 'todos',
      }),
      client.invalidateQueries({
        queryKey: resumenReposicionKey,
        predicate: (query) => query.queryKey[2] === almacenId || query.queryKey[2] === 'todos',
      }),
    ]);
  };

  const guardar = injectMutation(() => ({
    mutationFn: ({ varianteId, almacenId, minimoBase }: GuardarMinimoInput) => {
      checkPermission();
      if (!minimoValido.test(minimoBase) || !/[1-9]/.test(minimoBase)) {
        throw new Error('El mínimo debe ser positivo y tener hasta seis decimales.');
      }
      if (!varianteId || !almacenId || almacenId === 'todos') {
        throw new Error('Selecciona una variante y un almacén válido.');
      }
      return api.guardarMinimo(varianteId, almacenId, minimoBase);
    },
    onSuccess: async (_, { almacenId }) => invalidate(almacenId),
    retry: false,
  }));

  const quitar = injectMutation(() => ({
    mutationFn: ({ varianteId, almacenId }: MinimoExistenciaInput) => {
      checkPermission();
      if (!varianteId || !almacenId || almacenId === 'todos') {
        throw new Error('Selecciona una variante y un almacén válido.');
      }
      return api.quitarMinimo(varianteId, almacenId);
    },
    onSuccess: async (_, { almacenId }) => invalidate(almacenId),
    retry: false,
  }));

  return { guardar, quitar };
}
