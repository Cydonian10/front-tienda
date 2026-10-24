import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CategoriaApi } from '../../api/inventario/categoria-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { productoDetalleQueryKey } from './use-productos-action';
import {
  categoriaDetalleQueryKey, categoriasListadoQueryKey, useCategoriaDetalle,
  useCategoriasApi, useCategoriasListado,
} from './use-categorias-action';

describe('acciones de categorías', () => {
  const list = vi.fn();
  const getById = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const changeStatus = vi.fn();
  const categoria = { id: 'c1', nombre: 'Herramientas', descripcion: null, activo: true };
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: CategoriaApi, useValue: { list, getById, create, update, changeStatus } },
      { provide: ToastService, useValue: { success: vi.fn() } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('separa claves por filtros y página y no muestra la respuesta obsoleta', async () => {
    const q = signal('he');
    const activo = signal<boolean | undefined>(undefined);
    const page = signal(1);
    const limit = signal(20);
    let resolveOld!: (value: unknown) => void;
    list.mockImplementation(({ q: term }: { q?: string }) =>
      term === 'he' ? new Promise((resolve) => { resolveOld = resolve; }) :
        Promise.resolve({ items: [categoria], page: 1, limit: 20, totalItems: 1 }));
    const query = TestBed.runInInjectionContext(() => useCategoriasListado(q, activo, page, limit));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'he', activo: undefined, page: 1, limit: 20 }));
    q.set('herra');
    await vi.waitFor(() => expect(query.data()?.items).toEqual([categoria]));
    resolveOld({ items: [], page: 1, limit: 20, totalItems: 0 });
    await vi.waitFor(() => expect(client.getQueryData(categoriasListadoQueryKey('he', undefined, 1, 20))).toBeDefined());
    expect(query.data()?.items).toEqual([categoria]);
    activo.set(true);
    page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'herra', activo: true, page: 2, limit: 20 }));
    q.set('h');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ activo: true, page: 2, limit: 20 }));
  });

  it('no consulta detalle sin ID', async () => {
    const id = signal('');
    getById.mockResolvedValue(categoria);
    TestBed.runInInjectionContext(() => useCategoriaDetalle(id));
    expect(getById).not.toHaveBeenCalled();
    id.set('c1');
    await vi.waitFor(() => expect(client.getQueryData(categoriaDetalleQueryKey('c1'))).toEqual(categoria));
  });

  it('invalida solo categorías y productos que incluyen la categoría editada', async () => {
    update.mockResolvedValue({ ...categoria, descripcion: 'Nueva' });
    client.setQueryData(categoriasListadoQueryKey('', undefined, 1, 20), { items: [categoria] });
    client.setQueryData(categoriaDetalleQueryKey('c1'), categoria);
    client.setQueryData(productoDetalleQueryKey('p1'), { categorias: [categoria] });
    client.setQueryData(productoDetalleQueryKey('p2'), { categorias: [{ id: 'c2' }] });
    const actions = TestBed.runInInjectionContext(() => useCategoriasApi());
    await actions.updateMutation.mutateAsync({ id: 'c1', dto: { descripcion: 'Nueva' } });
    expect(client.getQueryState(categoriasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(true);
    expect(client.getQueryState(categoriaDetalleQueryKey('c1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(productoDetalleQueryKey('p1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(productoDetalleQueryKey('p2'))?.isInvalidated).toBe(false);
  });

  it('alta y estado invalidan listados; fallos conservan caché', async () => {
    client.setQueryData(categoriasListadoQueryKey('', undefined, 1, 20), { items: [] });
    const actions = TestBed.runInInjectionContext(() => useCategoriasApi());
    create.mockResolvedValue(categoria);
    await actions.createMutation.mutateAsync({ nombre: 'Herramientas' });
    expect(client.getQueryData(categoriaDetalleQueryKey('c1'))).toEqual(categoria);
    client.setQueryData(categoriasListadoQueryKey('', undefined, 1, 20), { items: [categoria] });
    changeStatus.mockResolvedValue({ ...categoria, activo: false });
    await actions.statusMutation.mutateAsync({ id: 'c1', activo: false });
    expect(changeStatus).toHaveBeenCalledWith('c1', false);
    expect(client.getQueryState(categoriasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(true);
    client.setQueryData(categoriasListadoQueryKey('', undefined, 1, 20), { items: [categoria] });
    update.mockRejectedValue(new Error('Conflicto'));
    await expect(actions.updateMutation.mutateAsync({ id: 'c1', dto: { nombre: 'Duplicado' } })).rejects.toThrow();
    expect(client.getQueryState(categoriasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(false);
  });
});
