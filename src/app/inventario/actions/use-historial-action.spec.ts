import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import type {
  FiltroHistorialMovimientos,
  HistorialMovimientosPagina,
} from '../../api/interfaces/inventario/historial-movimiento.interface';
import {
  historialDetalleQueryKey,
  historialListadoQueryKey,
  useHistorialDetalle,
  useHistorialListado,
} from './use-historial-action';

describe('consultas del historial', () => {
  let client: QueryClient;
  const listarHistorial = vi.fn();
  const obtenerHistorial = vi.fn();
  const filtro: FiltroHistorialMovimientos = {
    q: 'tornillo', tipo: 'salida', desde: '2026-10-01', hasta: '2026-10-24', page: 2, limit: 5,
  };
  const pagina: HistorialMovimientosPagina = {
    data: [], meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listarHistorial.mockResolvedValue(pagina);
    obtenerHistorial.mockResolvedValue({ id: 'id-1', detalles: [] });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: MovimientoApi, useValue: { listarHistorial, obtenerHistorial } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('incluye las seis dimensiones del filtro en la clave del listado', () => {
    const key = historialListadoQueryKey(filtro);
    expect(key).toEqual([
      'movimientos', 'historial', 'listado', 'tornillo', 'salida', '2026-10-01',
      '2026-10-24', 2, 5,
    ]);
    for (const change of [
      { q: 'tuerca' }, { tipo: 'ingreso' as const }, { desde: '2026-09-01' },
      { hasta: '2026-10-23' }, { page: 1 }, { limit: 20 },
    ]) {
      expect(historialListadoQueryKey({ ...filtro, ...change })).not.toEqual(key);
    }
    expect(historialListadoQueryKey(null)).not.toEqual(key);
    expect(historialListadoQueryKey({ page: 1, limit: 20 })).toEqual([
      'movimientos', 'historial', 'listado', null, null, null, null, 1, 20,
    ]);
  });

  it('espera un filtro válido y consulta de nuevo al cambiar parámetros', async () => {
    const actual = signal<FiltroHistorialMovimientos | null>(null);
    const query = TestBed.runInInjectionContext(() => useHistorialListado(actual));
    expect(query.fetchStatus()).toBe('idle');
    expect(listarHistorial).not.toHaveBeenCalled();

    actual.set(filtro);
    await vi.waitFor(() => expect(query.data()).toEqual(pagina));
    expect(listarHistorial).toHaveBeenCalledExactlyOnceWith(filtro);
    expect(client.getQueryData(historialListadoQueryKey(filtro))).toEqual(pagina);

    const otro = { ...filtro, page: 1, limit: 10, q: 'tuerca' };
    const otraPagina = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    listarHistorial.mockResolvedValueOnce(otraPagina);
    actual.set(otro);
    await vi.waitFor(() => expect(query.data()).toEqual(otraPagina));
    expect(listarHistorial).toHaveBeenLastCalledWith(otro);
    expect(client.getQueryData(historialListadoQueryKey(filtro))).toEqual(pagina);
  });

  it('no muestra el resultado tardío de una búsqueda anterior en la nueva', async () => {
    let resolverAnterior!: (value: HistorialMovimientosPagina) => void;
    const anterior = new Promise<HistorialMovimientosPagina>((resolve) => {
      resolverAnterior = resolve;
    });
    listarHistorial.mockReset().mockReturnValueOnce(anterior);
    const actual = signal<FiltroHistorialMovimientos | null>(filtro);
    const query = TestBed.runInInjectionContext(() => useHistorialListado(actual));
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledOnce());

    const siguiente = { ...filtro, q: 'tuerca' };
    const nuevaPagina = { data: [], meta: { page: 2, limit: 5, total: 1, totalPages: 1 } };
    listarHistorial.mockResolvedValueOnce(nuevaPagina);
    actual.set(siguiente);
    await vi.waitFor(() => expect(query.data()).toEqual(nuevaPagina));
    resolverAnterior(pagina);
    await vi.waitFor(() => expect(client.getQueryData(historialListadoQueryKey(filtro))).toEqual(pagina));
    expect(query.data()).toEqual(nuevaPagina);
    expect(client.getQueryData(historialListadoQueryKey(siguiente))).toEqual(nuevaPagina);
  });

  it('consulta detalles en una clave independiente por UUID', async () => {
    const id = signal('');
    const query = TestBed.runInInjectionContext(() => useHistorialDetalle(id));
    expect(query.fetchStatus()).toBe('idle');
    id.set('id-1');
    await vi.waitFor(() => expect(query.data()).toEqual({ id: 'id-1', detalles: [] }));
    expect(obtenerHistorial).toHaveBeenCalledExactlyOnceWith('id-1');
    expect(client.getQueryData(historialDetalleQueryKey('id-1'))).toEqual(query.data());
    expect(historialDetalleQueryKey('id-2')).not.toEqual(historialDetalleQueryKey('id-1'));
    expect(historialDetalleQueryKey('id-1')).not.toEqual(historialListadoQueryKey(filtro));
  });
});
