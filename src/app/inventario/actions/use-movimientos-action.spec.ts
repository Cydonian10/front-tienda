import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import type {
  FiltroVariantesMovimiento,
  NuevoMovimiento,
} from '../../api/interfaces/inventario/movimiento.interface';
import { existenciasQueryKey } from './use-existencias-action';
import {
  movimientosAlmacenesQueryKey,
  movimientosVariantesQueryKey,
  useAlmacenesMovimiento,
  useCrearMovimiento,
  useVariantesMovimiento,
} from './use-movimientos-action';

describe('acciones de movimientos', () => {
  let client: QueryClient;
  const listarAlmacenes = vi.fn();
  const buscarVariantes = vi.fn();
  const crear = vi.fn();
  const empty = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const filtro: FiltroVariantesMovimiento = {
    tipo: 'salida',
    almacenId: 'almacen-1',
    q: 'tornillo',
    page: 1,
    limit: 20,
  };
  const movimiento: NuevoMovimiento = {
    idempotenciaClave: '550e8400-e29b-41d4-a716-446655440006',
    tipo: 'traslado',
    almacenOrigenId: 'almacen-1',
    almacenDestinoId: 'almacen-2',
    detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '2.500000' }],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listarAlmacenes.mockResolvedValue([{ id: 'almacen-1', nombre: 'Principal' }]);
    buscarVariantes.mockResolvedValue(empty);
    crear.mockResolvedValue({ id: 'movimiento-1', tipo: 'traslado', estado: 'confirmado' });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: MovimientoApi, useValue: { listarAlmacenes, buscarVariantes, crear } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('consulta almacenes con una clave estable', async () => {
    const query = TestBed.runInInjectionContext(() => useAlmacenesMovimiento());
    await vi.waitFor(() => expect(query.data()).toEqual([{ id: 'almacen-1', nombre: 'Principal' }]));
    expect(client.getQueryData(movimientosAlmacenesQueryKey)).toEqual(query.data());
    expect(listarAlmacenes).toHaveBeenCalledOnce();
  });

  it('espera un almacén y al menos dos caracteres antes de buscar', async () => {
    const filtroActual = signal<FiltroVariantesMovimiento | null>(null);
    const query = TestBed.runInInjectionContext(() => useVariantesMovimiento(filtroActual));
    expect(query.fetchStatus()).toBe('idle');
    filtroActual.set({ ...filtro, q: 't' });
    await vi.waitFor(() => expect(query.fetchStatus()).toBe('idle'));
    expect(buscarVariantes).not.toHaveBeenCalled();
    filtroActual.set({ ...filtro, almacenId: '' });
    await vi.waitFor(() => expect(query.fetchStatus()).toBe('idle'));
    expect(buscarVariantes).not.toHaveBeenCalled();

    filtroActual.set(filtro);
    await vi.waitFor(() => expect(buscarVariantes).toHaveBeenCalledExactlyOnceWith(filtro));
    await vi.waitFor(() => expect(client.getQueryData(movimientosVariantesQueryKey(filtro))).toEqual(empty));

    filtroActual.set({ ...filtro, page: 2 });
    await vi.waitFor(() => expect(buscarVariantes).toHaveBeenCalledWith({ ...filtro, page: 2 }));
  });

  it('separa todas las dimensiones de la búsqueda en la clave', () => {
    const key = movimientosVariantesQueryKey(filtro);
    for (const change of [
      { tipo: 'traslado' as const },
      { almacenId: 'almacen-2' },
      { q: 'tuerca' },
      { page: 2 },
      { limit: 10 },
    ]) {
      expect(movimientosVariantesQueryKey({ ...filtro, ...change })).not.toEqual(key);
    }
    expect(movimientosVariantesQueryKey(null)).not.toEqual(key);
  });

  it('expone el error de búsqueda y permite reintentar mediante refetch', async () => {
    buscarVariantes.mockRejectedValueOnce(new Error('Sin conexión'));
    const query = TestBed.runInInjectionContext(() => useVariantesMovimiento(() => filtro));

    await vi.waitFor(() => expect(query.isError()).toBe(true));
    expect(buscarVariantes).toHaveBeenCalledOnce();
    await query.refetch();
    await vi.waitFor(() => expect(query.data()).toEqual(empty));
    expect(buscarVariantes).toHaveBeenCalledTimes(2);
  });

  it('invalida solo existencias y opciones de almacenes afectados tras éxito', async () => {
    for (const almacenId of ['almacen-1', 'almacen-2', 'almacen-3', 'todos']) {
      client.setQueryData(existenciasQueryKey({ almacenId, page: 1, limit: 20 }), {});
    }
    for (const almacenId of ['almacen-1', 'almacen-2', 'almacen-3']) {
      client.setQueryData(movimientosVariantesQueryKey({ ...filtro, almacenId }), empty);
    }
    client.setQueryData(movimientosAlmacenesQueryKey, []);
    const mutation = TestBed.runInInjectionContext(() => useCrearMovimiento());

    await expect(mutation.mutateAsync(movimiento)).resolves.toEqual({
      id: 'movimiento-1', tipo: 'traslado', estado: 'confirmado',
    });
    expect(crear).toHaveBeenCalledExactlyOnceWith(movimiento);
    for (const almacenId of ['almacen-1', 'almacen-2', 'todos']) {
      expect(client.getQueryState(existenciasQueryKey({ almacenId, page: 1, limit: 20 }))?.isInvalidated).toBe(true);
    }
    for (const almacenId of ['almacen-1', 'almacen-2']) {
      expect(client.getQueryState(movimientosVariantesQueryKey({ ...filtro, almacenId }))?.isInvalidated).toBe(true);
    }
    expect(client.getQueryState(existenciasQueryKey({ almacenId: 'almacen-3', page: 1, limit: 20 }))?.isInvalidated).toBe(false);
    expect(client.getQueryState(movimientosVariantesQueryKey({ ...filtro, almacenId: 'almacen-3' }))?.isInvalidated).toBe(false);
    expect(client.getQueryState(movimientosAlmacenesQueryKey)?.isInvalidated).toBe(false);
  });

  it('en una salida invalida solo el origen y existencias globales', async () => {
    const salida: NuevoMovimiento = {
      idempotenciaClave: movimiento.idempotenciaClave,
      tipo: 'salida',
      almacenOrigenId: movimiento.almacenOrigenId,
      detalles: movimiento.detalles,
    };
    for (const almacenId of ['almacen-1', 'almacen-2', 'todos']) {
      client.setQueryData(existenciasQueryKey({ almacenId, page: 1, limit: 20 }), {});
      client.setQueryData(movimientosVariantesQueryKey({ ...filtro, almacenId }), empty);
    }
    const mutation = TestBed.runInInjectionContext(() => useCrearMovimiento());
    await mutation.mutateAsync(salida);

    expect(client.getQueryState(existenciasQueryKey({ almacenId: 'almacen-1', page: 1, limit: 20 }))?.isInvalidated).toBe(true);
    expect(client.getQueryState(existenciasQueryKey({ almacenId: 'todos', page: 1, limit: 20 }))?.isInvalidated).toBe(true);
    expect(client.getQueryState(existenciasQueryKey({ almacenId: 'almacen-2', page: 1, limit: 20 }))?.isInvalidated).toBe(false);
    expect(client.getQueryState(movimientosVariantesQueryKey({ ...filtro, almacenId: 'almacen-1' }))?.isInvalidated).toBe(true);
    expect(client.getQueryState(movimientosVariantesQueryKey({ ...filtro, almacenId: 'almacen-2' }))?.isInvalidated).toBe(false);
  });

  it('ante un rechazo no invalida ni reintenta automáticamente', async () => {
    const error = { status: 409, message: 'Saldo insuficiente' };
    crear.mockRejectedValue(error);
    client.setQueryData(movimientosVariantesQueryKey(filtro), empty);
    const mutation = TestBed.runInInjectionContext(() => useCrearMovimiento());

    await expect(mutation.mutateAsync(movimiento)).rejects.toBe(error);
    expect(crear).toHaveBeenCalledOnce();
    expect(client.getQueryState(movimientosVariantesQueryKey(filtro))?.isInvalidated).toBe(false);
  });

  it('permite reintentar manualmente el mismo envío tras un fallo incierto sin cambiar la clave', async () => {
    const error = { status: 0, message: 'Error de red' };
    crear.mockRejectedValueOnce(error);
    const mutation = TestBed.runInInjectionContext(() => useCrearMovimiento());

    await expect(mutation.mutateAsync(movimiento)).rejects.toBe(error);
    expect(crear).toHaveBeenCalledOnce();
    await expect(mutation.mutateAsync(movimiento)).resolves.toMatchObject({ id: 'movimiento-1' });
    expect(crear).toHaveBeenCalledTimes(2);
    expect(crear).toHaveBeenNthCalledWith(1, movimiento);
    expect(crear).toHaveBeenNthCalledWith(2, movimiento);
  });
});
