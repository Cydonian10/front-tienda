import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import type {
  FiltroExistencias,
  ListaExistenciasResponse,
} from '../../api/interfaces/inventario/existencia.interface';
import {
  existenciasAlmacenesQueryKey,
  existenciasQueryKey,
  useAlmacenesExistencias,
  useExistencias,
} from './use-existencias-action';

describe('acciones de existencias', () => {
  let client: QueryClient;
  const listarAlmacenes = vi.fn();
  const listar = vi.fn();
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
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ExistenciaApi, useValue: { listarAlmacenes, listar } },
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

});
