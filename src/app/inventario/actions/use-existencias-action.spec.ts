import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../../store/auth/auth.store';
import type {
  FiltroExistencias,
  ListaExistenciasResponse,
} from '../../api/interfaces/inventario/existencia.interface';
import {
  existenciasAlmacenesQueryKey,
  existenciasQueryKey,
  useEditarMinimoExistencia,
  useAlmacenesExistencias,
  useExistencias,
} from './use-existencias-action';
import { resumenReposicionQueryKey } from './use-dashboard-reposicion-action';

describe('acciones de existencias', () => {
  let client: QueryClient;
  const listarAlmacenes = vi.fn();
  const listar = vi.fn();
  const guardarMinimo = vi.fn();
  const quitarMinimo = vi.fn();
  const response: ListaExistenciasResponse = {
    items: [],
    page: 1,
    limit: 20,
    totalItems: 0,
    totalValorCosto: '0.000000',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listarAlmacenes.mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    listar.mockResolvedValue(response);
    guardarMinimo.mockResolvedValue(undefined);
    quitarMinimo.mockResolvedValue(undefined);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ExistenciaApi, useValue: { listarAlmacenes, listar, guardarMinimo, quitarMinimo } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('consulta y cachea el selector de almacenes activos con una clave estable', async () => {
    const query = TestBed.runInInjectionContext(() => useAlmacenesExistencias());

    await vi.waitFor(() => expect(listarAlmacenes).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(query.data()).toEqual([{ id: 'a1', nombre: 'Principal' }]));
    expect(client.getQueryData(existenciasAlmacenesQueryKey)).toEqual([
      { id: 'a1', nombre: 'Principal' },
    ]);
  });

  it('espera un almacén y luego consulta/cacha las filas del filtro seleccionado', async () => {
    const filtro = signal<FiltroExistencias | null>(null);
    const query = TestBed.runInInjectionContext(() => useExistencias(filtro));

    expect(query.fetchStatus()).toBe('idle');
    expect(listar).not.toHaveBeenCalled();

    const seleccionado: FiltroExistencias = {
      almacenId: 'todos',
      page: 1,
      limit: 20,
      q: '',
      disponibilidad: 'todas',
    };
    filtro.set(seleccionado);

    await vi.waitFor(() => expect(listar).toHaveBeenCalledOnce());
    expect(listar).toHaveBeenCalledWith(seleccionado);
    await vi.waitFor(() => expect(query.data()).toEqual(response));
    expect(client.getQueryData(existenciasQueryKey(seleccionado))).toEqual(response);
  });

  it('incluye almacén, página, límite y todos los filtros en la clave', () => {
    const base: FiltroExistencias = {
      almacenId: 'todos',
      page: 1,
      limit: 20,
      q: 'tornillo',
      disponibilidad: 'con_stock',
    };
    const baseKey = existenciasQueryKey(base);
    const changes: Partial<FiltroExistencias>[] = [
      { almacenId: 'a1' },
      { page: 2 },
      { limit: 10 },
      { q: 'tuerca' },
      { disponibilidad: 'sin_stock' },
    ];

    for (const cambio of changes) {
      expect(existenciasQueryKey({ ...base, ...cambio })).not.toEqual(baseKey);
    }
    expect(existenciasQueryKey(null)).not.toEqual(baseKey);
  });

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: codes.map((code) => ({ systemCode: 'INVENTARIO', code })) } as never);
  }

  it('comprueba permiso en cada ejecución y valida decimal positivo de hasta seis cifras fraccionarias', async () => {
    const action = TestBed.runInInjectionContext(() => useEditarMinimoExistencia());
    const input = { varianteId: 'v1', almacenId: 'a1', minimoBase: '0.000001' };
    await expect(action.guardar.mutateAsync(input)).rejects.toThrow('permiso');
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    for (const minimoBase of ['0', '0.000000', '-1', '1.0000001', '1e2', '0001', '1000000000000000000']) {
      await expect(action.guardar.mutateAsync({ ...input, minimoBase })).rejects.toThrow('positivo');
    }
    await expect(action.guardar.mutateAsync({ ...input, almacenId: 'todos' })).rejects.toThrow('almacén');
    expect(guardarMinimo).not.toHaveBeenCalled();
    await action.guardar.mutateAsync(input);
    expect(guardarMinimo).toHaveBeenCalledExactlyOnceWith('v1', 'a1', '0.000001');
    grant(PERMISSION_CODES.EXISTENCIAS_READ);
    await expect(action.quitar.mutateAsync({ varianteId: 'v1', almacenId: 'a1' })).rejects.toThrow('permiso');
    expect(quitarMinimo).not.toHaveBeenCalled();
  });

  it('invalida solo existencias y resumen del almacén editado y el agregado global al guardar o borrar', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    for (const id of ['a1', 'a2', 'todos']) {
      client.setQueryData(existenciasQueryKey({ almacenId: id, page: 1, limit: 20 }), response);
      client.setQueryData(resumenReposicionQueryKey(id), { bajoMinimo: 0, agotadas: 0, alertas: [] });
    }
    client.setQueryData(existenciasAlmacenesQueryKey, []);
    client.setQueryData(['compras', 'resumen-inventario', 'a', 'b'], {});
    const action = TestBed.runInInjectionContext(() => useEditarMinimoExistencia());
    await action.guardar.mutateAsync({ varianteId: 'v1', almacenId: 'a1', minimoBase: '2.5' });
    for (const id of ['a1', 'todos']) {
      expect(client.getQueryState(existenciasQueryKey({ almacenId: id, page: 1, limit: 20 }))?.isInvalidated).toBe(true);
      expect(client.getQueryState(resumenReposicionQueryKey(id))?.isInvalidated).toBe(true);
    }
    expect(client.getQueryState(resumenReposicionQueryKey('a2'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(existenciasQueryKey({ almacenId: 'a2', page: 1, limit: 20 }))?.isInvalidated).toBe(false);
    expect(client.getQueryState(existenciasAlmacenesQueryKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(['compras', 'resumen-inventario', 'a', 'b'])?.isInvalidated).toBe(false);
    await action.quitar.mutateAsync({ varianteId: 'v1', almacenId: 'a2' });
    expect(quitarMinimo).toHaveBeenCalledExactlyOnceWith('v1', 'a2');
    expect(client.getQueryState(resumenReposicionQueryKey('a2'))?.isInvalidated).toBe(true);
  });

  it('en un 403 no invalida datos ni oculta el fallo', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    const error = { status: 403 };
    guardarMinimo.mockRejectedValue(error);
    client.setQueryData(resumenReposicionQueryKey('a1'), {});
    const action = TestBed.runInInjectionContext(() => useEditarMinimoExistencia());
    await expect(action.guardar.mutateAsync({ varianteId: 'v1', almacenId: 'a1', minimoBase: '1' })).rejects.toBe(error);
    expect(client.getQueryState(resumenReposicionQueryKey('a1'))?.isInvalidated).toBe(false);
  });

});
