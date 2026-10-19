import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { VarianteApi } from '../../api/inventario/variante-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import {
  useVarianteApi,
  useVarianteImagen,
  useVarianteImagenes,
  varianteImagenQueryKey,
  varianteImagenesQueryKey,
  variantesQueryKey,
} from './use-variante-action';

describe('acciones de variantes', () => {
  const list = vi.fn();
  const listImages = vi.fn();
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
        { provide: VarianteApi, useValue: { list, listImages, getImage, create, update } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('lee galería y archivo con IDs del producto y variante sin mezclarlos', async () => {
    const productId = signal('');
    const variantId = signal('');
    const imageId = signal('');
    listImages.mockResolvedValue([{ id: 'as1', origen: 'producto' }]);
    getImage.mockResolvedValue(new Blob(['foto']));
    TestBed.runInInjectionContext(() => {
      useVarianteImagenes(productId, variantId);
      useVarianteImagen(productId, variantId, imageId);
    });
    expect(listImages).not.toHaveBeenCalled();
    productId.set('p1');
    variantId.set('v1');
    await vi.waitFor(() => expect(listImages).toHaveBeenCalledExactlyOnceWith('p1', 'v1'));
    imageId.set('i1');
    await vi.waitFor(() => expect(getImage).toHaveBeenCalledExactlyOnceWith('p1', 'v1', 'i1'));
    expect(client.getQueryData(varianteImagenesQueryKey('p1', 'v1'))).toEqual([
      { id: 'as1', origen: 'producto' },
    ]);
    await vi.waitFor(() => expect(client.getQueryData(varianteImagenQueryKey('p1', 'v1', 'i1'))).toBeInstanceOf(Blob));
  });

  it('actualiza solo el listado y las imágenes de la variante editada', async () => {
    const changed = { id: 'v1', precio: '20.00', imagenes: [] };
    update.mockResolvedValue(changed);
    client.setQueryData(variantesQueryKey('p1'), [{ id: 'v1', precio: '10.00' }]);
    client.setQueryData(variantesQueryKey('p2'), [{ id: 'v2' }]);
    client.setQueryData(varianteImagenesQueryKey('p1', 'v1'), []);
    client.setQueryData(varianteImagenQueryKey('p1', 'v1', 'i1'), new Blob());
    client.setQueryData(varianteImagenesQueryKey('p1', 'v2'), []);
    const actions = TestBed.runInInjectionContext(() => useVarianteApi(() => ''));
    const dto = { precio: '20.00', imagenesConservarIds: [] };

    await actions.updateMutation.mutateAsync({ id: 'p1', variantId: 'v1', dto });
    expect(update).toHaveBeenCalledExactlyOnceWith('p1', 'v1', dto);
    expect(client.getQueryData(variantesQueryKey('p1'))).toEqual([changed]);
    expect(client.getQueryState(variantesQueryKey('p1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(varianteImagenesQueryKey('p1', 'v1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(varianteImagenQueryKey('p1', 'v1', 'i1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(varianteImagenesQueryKey('p1', 'v2'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(variantesQueryKey('p2'))?.isInvalidated).toBe(false);
  });

  it('mantiene listado en fallo y conserva el alta existente', async () => {
    client.setQueryData(variantesQueryKey('p1'), [{ id: 'v1', sku: 'SKU-1' }]);
    const actions = TestBed.runInInjectionContext(() => useVarianteApi(() => ''));
    update.mockRejectedValue(new Error('Conflicto'));
    await expect(actions.updateMutation.mutateAsync({
      id: 'p1', variantId: 'v1', dto: { precio: '20.00' },
    })).rejects.toThrow('Conflicto');
    expect(client.getQueryData(variantesQueryKey('p1'))).toEqual([{ id: 'v1', sku: 'SKU-1' }]);

    create.mockResolvedValue({ id: 'v2', sku: 'SKU-2' });
    await actions.createMutation.mutateAsync({
      id: 'p1', dto: { precio: '10.00', valores: [], imagenes: [] },
    });
    expect(client.getQueryData(variantesQueryKey('p1'))).toEqual([
      { id: 'v1', sku: 'SKU-1' }, { id: 'v2', sku: 'SKU-2' },
    ]);
  });
});
