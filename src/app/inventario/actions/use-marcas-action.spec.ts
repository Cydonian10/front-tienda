import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MarcaApi } from '../../api/inventario/marca-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { productoDetalleQueryKey } from './use-productos-action';
import {
  marcaDetalleQueryKey, marcaImagenQueryKey, marcasListadoQueryKey, useMarcaDetalle,
  useMarcaImagen, useMarcasApi, useMarcasListado,
} from './use-marcas-action';

describe('acciones de marcas', () => {
  const list = vi.fn();
  const getById = vi.fn();
  const getImage = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const changeStatus = vi.fn();
  const marca = { id: 'm1', nombre: 'Atlas', activo: true, imagenId: 'i1' };
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: MarcaApi, useValue: { list, getById, getImage, create, update, changeStatus } },
      { provide: ToastService, useValue: { success: vi.fn() } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('mantiene resultados por búsqueda, filtro, página y límite sin mezclar respuestas antiguas', async () => {
    const q = signal('al');
    const activo = signal<boolean | undefined>(undefined);
    const page = signal(1);
    const limit = signal(20);
    let resolveOld!: (value: unknown) => void;
    list.mockImplementation(({ q: term }: { q?: string }) =>
      term === 'al' ? new Promise((resolve) => { resolveOld = resolve; }) :
        Promise.resolve({ items: [marca], page: 1, limit: 20, totalItems: 1 }));
    const query = TestBed.runInInjectionContext(() => useMarcasListado(q, activo, page, limit));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'al', activo: undefined, page: 1, limit: 20 }));
    q.set('at');
    await vi.waitFor(() => expect(query.data()?.items).toEqual([marca]));
    resolveOld({ items: [], page: 1, limit: 20, totalItems: 0 });
    await vi.waitFor(() => expect(client.getQueryData(marcasListadoQueryKey('al', undefined, 1, 20))).toBeDefined());
    expect(query.data()?.items).toEqual([marca]);
    activo.set(false);
    page.set(2);
    limit.set(10);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'at', activo: false, page: 2, limit: 10 }));
    q.set('a');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ activo: false, page: 2, limit: 10 }));
  });

  it('consulta detalle e imagen únicamente con IDs', async () => {
    const id = signal('');
    const imageId = signal('');
    const blob = new Blob(['foto']);
    getById.mockResolvedValue(marca);
    getImage.mockResolvedValue(blob);
    TestBed.runInInjectionContext(() => { useMarcaDetalle(id); useMarcaImagen(id, imageId); });
    expect(getById).not.toHaveBeenCalled();
    expect(getImage).not.toHaveBeenCalled();
    id.set('m1');
    await vi.waitFor(() => expect(getById).toHaveBeenCalledWith('m1'));
    imageId.set('i1');
    await vi.waitFor(() => expect(client.getQueryData(marcaImagenQueryKey('m1', 'i1'))).toBe(blob));
    expect(getImage).toHaveBeenCalledWith('m1');
  });

  it('invalida solo listados, imagen y productos de la marca modificada', async () => {
    update.mockResolvedValue({ ...marca, nombre: 'Atlas 2', imagenId: 'i2' });
    client.setQueryData(marcasListadoQueryKey('', undefined, 1, 20), { items: [marca] });
    client.setQueryData(marcaDetalleQueryKey('m1'), marca);
    client.setQueryData(marcaImagenQueryKey('m1', 'i1'), new Blob());
    client.setQueryData(marcaImagenQueryKey('m2', 'i2'), new Blob());
    client.setQueryData(productoDetalleQueryKey('p1'), { marca });
    client.setQueryData(productoDetalleQueryKey('p2'), { marca: { id: 'm2' } });
    const actions = TestBed.runInInjectionContext(() => useMarcasApi());
    const file = new File(['foto'], 'nueva.png', { type: 'image/png' });
    await actions.updateMutation.mutateAsync({ id: 'm1', dto: { imagen: file, nombre: 'Atlas 2' } });
    expect(client.getQueryState(marcasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(true);
    expect(client.getQueryState(marcaDetalleQueryKey('m1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(marcaImagenQueryKey('m1', 'i1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(marcaImagenQueryKey('m2', 'i2'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(productoDetalleQueryKey('p1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(productoDetalleQueryKey('p2'))?.isInvalidated).toBe(false);
  });

  it('alta y cambio de estado refrescan catálogo; un fallo no invalida', async () => {
    client.setQueryData(marcasListadoQueryKey('', undefined, 1, 20), { items: [] });
    const actions = TestBed.runInInjectionContext(() => useMarcasApi());
    create.mockResolvedValue(marca);
    await actions.createMutation.mutateAsync({ nombre: 'Atlas' });
    expect(client.getQueryData(marcaDetalleQueryKey('m1'))).toEqual(marca);
    expect(client.getQueryState(marcasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(true);
    client.setQueryData(marcasListadoQueryKey('', undefined, 1, 20), { items: [marca] });
    changeStatus.mockResolvedValue({ ...marca, activo: false });
    await actions.statusMutation.mutateAsync({ id: 'm1', activo: false });
    expect(changeStatus).toHaveBeenCalledWith('m1', false);
    expect(client.getQueryState(marcasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(true);
    client.setQueryData(marcasListadoQueryKey('', undefined, 1, 20), { items: [marca] });
    update.mockRejectedValue(new Error('Conflicto'));
    await expect(actions.updateMutation.mutateAsync({ id: 'm1', dto: { nombre: 'Atlas' } })).rejects.toThrow('Conflicto');
    expect(client.getQueryState(marcasListadoQueryKey('', undefined, 1, 20))?.isInvalidated).toBe(false);
  });
});
