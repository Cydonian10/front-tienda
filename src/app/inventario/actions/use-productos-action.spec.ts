import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../api/inventario/product-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import {
  productoDetalleQueryKey,
  productoImagenQueryKey,
  productosBusquedaQueryKey,
  useProductoApi,
  useProductoDetalle,
  useProductoImagen,
  useProductosBusqueda,
} from './use-productos-action';
import { varianteImagenesQueryKey } from './use-variante-action';

describe('acciones de productos', () => {
  const search = vi.fn();
  const getById = vi.fn();
  const getImage = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { search, getById, getImage, create, update } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('espera dos caracteres y separa resultados por término, página y límite', async () => {
    const term = signal('a');
    const page = signal(1);
    const limit = signal(20);
    const results = { items: [], page: 1, limit: 20, totalItems: 0 };
    search.mockResolvedValue(results);
    const query = TestBed.runInInjectionContext(() => useProductosBusqueda(term, page, limit));
    expect(search).not.toHaveBeenCalled();

    term.set('ab');
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'ab', page: 1, limit: 20 }));
    await vi.waitFor(() => expect(query.data()).toEqual(results));
    page.set(2);
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'ab', page: 2, limit: 20 }));
    limit.set(10);
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'ab', page: 2, limit: 10 }));
    expect(client.getQueryData(productosBusquedaQueryKey('ab', 1, 20))).toEqual(results);
    expect(client.getQueryData(productosBusquedaQueryKey('ab', 2, 10))).toEqual(results);
  });

  it('consulta detalle y archivo solo con IDs, con claves independientes', async () => {
    const id = signal('');
    const imageId = signal('');
    const blob = new Blob(['foto']);
    getById.mockResolvedValue({ id: 'p1' });
    getImage.mockResolvedValue(blob);
    TestBed.runInInjectionContext(() => {
      useProductoDetalle(id);
      useProductoImagen(id, imageId);
    });
    expect(getById).not.toHaveBeenCalled();
    expect(getImage).not.toHaveBeenCalled();

    id.set('p1');
    await vi.waitFor(() => expect(getById).toHaveBeenCalledExactlyOnceWith('p1'));
    imageId.set('i1');
    await vi.waitFor(() => expect(getImage).toHaveBeenCalledExactlyOnceWith('p1', 'i1'));
    await vi.waitFor(() => expect(client.getQueryData(productoImagenQueryKey('p1', 'i1'))).toBe(blob));
    expect(client.getQueryData(productoDetalleQueryKey('p1'))).toEqual({ id: 'p1' });
  });

  it('invalida solo datos del producto afectado y galerías heredadas si cambian las fotos', async () => {
    const product = { id: 'p1', nombre: 'Nuevo', imagenes: [] };
    update.mockResolvedValue(product);
    client.setQueryData(productoDetalleQueryKey('p1'), { id: 'p1', nombre: 'Viejo' });
    client.setQueryData(productoDetalleQueryKey('p2'), { id: 'p2' });
    client.setQueryData(productosBusquedaQueryKey('a', 1, 20), { items: [] });
    client.setQueryData(productoImagenQueryKey('p1', 'i1'), new Blob());
    client.setQueryData(varianteImagenesQueryKey('p1', 'v1'), []);
    client.setQueryData(varianteImagenesQueryKey('p2', 'v2'), []);
    const actions = TestBed.runInInjectionContext(() => useProductoApi());

    const dto = {
      nombre: 'Nuevo', descripcion: '', unidadBaseId: 'u1', activo: false,
      imagenesConservarIds: [],
    };
    await actions.actualizarMutation.mutateAsync({ id: 'p1', dto });
    expect(update).toHaveBeenCalledExactlyOnceWith('p1', dto);
    expect(client.getQueryData(productoDetalleQueryKey('p1'))).toEqual(product);
    for (const key of [
      productoDetalleQueryKey('p1'), productosBusquedaQueryKey('a', 1, 20),
      productoImagenQueryKey('p1', 'i1'), varianteImagenesQueryKey('p1', 'v1'),
    ]) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(productoDetalleQueryKey('p2'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(varianteImagenesQueryKey('p2', 'v2'))?.isInvalidated).toBe(false);
  });

  it('no borra la caché ni confirma un fallo; la creación mantiene su resultado', async () => {
    const product = { id: 'p1', nombre: 'Anterior' };
    client.setQueryData(productoDetalleQueryKey('p1'), product);
    const actions = TestBed.runInInjectionContext(() => useProductoApi());
    update.mockRejectedValue(new Error('Servidor no disponible'));
    await expect(actions.actualizarMutation.mutateAsync({
      id: 'p1', dto: { nombre: 'Nuevo', descripcion: '', unidadBaseId: 'u1', activo: true },
    })).rejects.toThrow('Servidor no disponible');
    expect(client.getQueryData(productoDetalleQueryKey('p1'))).toEqual(product);
    expect(client.getQueryState(productoDetalleQueryKey('p1'))?.isInvalidated).toBe(false);

    create.mockResolvedValue({ id: 'p3', nombre: 'Creado' });
    await expect(actions.crearMutation.mutateAsync({
      nombre: 'Creado', descripcion: '', unidadBaseId: 'u1', activo: true, imagenes: [],
      marcaId: 'm1', categoriasIds: ['c1'],
    })).resolves.toMatchObject({ id: 'p3' });
    expect(client.getQueryData(productoDetalleQueryKey('p3'))).toMatchObject({ id: 'p3' });
  });
});
