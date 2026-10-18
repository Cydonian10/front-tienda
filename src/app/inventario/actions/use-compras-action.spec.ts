import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CompraApi } from '../../api/inventario/compra-api';
import { ProveedorApi } from '../../api/inventario/proveedor-api';
import { VarianteCompraApi } from '../../api/inventario/variante-compra-api';
import type { NuevaCompra } from '../../api/interfaces/inventario/compra.interface';
import {
  compraDetalleQueryKey,
  comprasListadoQueryKey,
  proveedoresQueryKey,
  useCompraDetalle,
  useAdjuntarComprobante,
  useComprasListado,
  useConfirmarCompra,
  useProveedoresCompra,
  useVariantesCompra,
  variantesCompraQueryKey,
} from './use-compras-action';

describe('acciones de compras', () => {
  let client: QueryClient;
  const list = vi.fn();
  const getById = vi.fn();
  const create = vi.fn();
  const attachComprobante = vi.fn();
  const proveedores = vi.fn();
  const variantes = vi.fn();
  const empty = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue(empty);
    proveedores.mockResolvedValue(empty);
    variantes.mockResolvedValue(empty);
    getById.mockResolvedValue({ id: 'c1', comprobante: null });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: CompraApi, useValue: { list, getById, create, attachComprobante } },
        { provide: ProveedorApi, useValue: { list: proveedores } },
        { provide: VarianteCompraApi, useValue: { list: variantes } },
      ],
    });
  });
  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('usa claves independientes por página y búsqueda sin copiar respuestas a señales locales', async () => {
    const page = signal(1);
    const search = signal('F001');
    const query = TestBed.runInInjectionContext(() => useComprasListado(page, () => 20, search));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, 'F001'));
    await vi.waitFor(() => expect(query.data()).toEqual(empty));
    expect(client.getQueryData(comprasListadoQueryKey(1, 20, 'F001'))).toEqual(empty);

    page.set(2);
    search.set('Acero');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 20, 'Acero'));
    expect(client.getQueryData(comprasListadoQueryKey(2, 20, 'Acero'))).toEqual(empty);
    expect(client.getQueryData(comprasListadoQueryKey(1, 20, 'F001'))).toEqual(empty);
  });

  it('incluye todos los filtros remotos y el ID del detalle en sus claves', async () => {
    const name = signal('Acero');
    const document = signal('201');
    const variantSearch = signal('SKU');
    const id = signal('c1');
    TestBed.runInInjectionContext(() => {
      useProveedoresCompra(
        () => 2,
        () => 10,
        name,
        document,
      );
      useVariantesCompra(
        () => 3,
        () => 15,
        variantSearch,
      );
      useCompraDetalle(id);
    });
    await vi.waitFor(() => {
      expect(proveedores).toHaveBeenCalledWith(2, 10, 'Acero', '201');
      expect(variantes).toHaveBeenCalledWith(3, 15, 'SKU');
      expect(getById).toHaveBeenCalledWith('c1');
    });
    await vi.waitFor(() => {
      expect(client.getQueryData(proveedoresQueryKey(2, 10, 'Acero', '201'))).toEqual(empty);
      expect(client.getQueryData(variantesCompraQueryKey(3, 15, 'SKU'))).toEqual(empty);
      expect(client.getQueryData(compraDetalleQueryKey('c1'))).toMatchObject({ id: 'c1' });
    });
  });

  it('invalida solo listados de compras al confirmar, incluso si el adjunto falló', async () => {
    const compra: NuevaCompra = {
      proveedorId: 'p1',
      almacenId: 'a1',
      tipoDocumento: 'factura',
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '123',
      renglones: [],
      comprobante: null,
    };
    create.mockResolvedValue({
      id: 'c2',
      comprobante: { estado: 'fallido', advertencia: 'Sin archivo' },
    });
    client.setQueryData(comprasListadoQueryKey(1, 20, ''), empty);
    client.setQueryData(comprasListadoQueryKey(2, 20, 'Acero'), empty);
    client.setQueryData(compraDetalleQueryKey('c1'), { id: 'c1' });
    client.setQueryData(proveedoresQueryKey(1, 20, '', ''), empty);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useConfirmarCompra());

    await expect(mutation.mutateAsync(compra)).resolves.toMatchObject({
      id: 'c2',
      comprobante: { estado: 'fallido' },
    });
    expect(create).toHaveBeenCalledExactlyOnceWith(compra);
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ['compras', 'listado'] });
    expect(client.getQueryState(comprasListadoQueryKey(1, 20, ''))?.isInvalidated).toBe(true);
    expect(client.getQueryState(comprasListadoQueryKey(2, 20, 'Acero'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(compraDetalleQueryKey('c1'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(proveedoresQueryKey(1, 20, '', ''))?.isInvalidated).toBe(false);
  });

  it('propaga el error de confirmación y deja intacta la caché', async () => {
    const compra: NuevaCompra = {
      proveedorId: 'p1',
      almacenId: 'a1',
      tipoDocumento: 'factura',
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '123',
      renglones: [],
      comprobante: null,
    };
    const error = { status: 409, message: 'Documento duplicado' };
    create.mockRejectedValue(error);
    client.setQueryData(comprasListadoQueryKey(1, 20, ''), empty);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useConfirmarCompra());

    await expect(mutation.mutateAsync(compra)).rejects.toBe(error);
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryState(comprasListadoQueryKey(1, 20, ''))?.isInvalidated).toBe(false);
  });

  it('al adjuntar invalida solo el detalle de esa compra y no sus listados ni otros detalles', async () => {
    const file = new File(['pdf'], 'factura.pdf', { type: 'application/pdf' });
    const metadata = {
      id: 'f1',
      nombreOriginal: 'factura.pdf',
      tipoMime: 'application/pdf',
      tamanoBytes: 3,
      fechaSubida: '2026-10-17T10:00:00Z',
    };
    attachComprobante.mockResolvedValue(metadata);
    client.setQueryData(compraDetalleQueryKey('c1'), { id: 'c1', comprobante: null });
    client.setQueryData(compraDetalleQueryKey('c2'), { id: 'c2', comprobante: null });
    client.setQueryData(comprasListadoQueryKey(1, 20, ''), empty);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useAdjuntarComprobante());

    await expect(mutation.mutateAsync({ id: 'c1', file })).resolves.toEqual(metadata);
    expect(attachComprobante).toHaveBeenCalledExactlyOnceWith('c1', file);
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: compraDetalleQueryKey('c1') });
    expect(client.getQueryState(compraDetalleQueryKey('c1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(compraDetalleQueryKey('c2'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(comprasListadoQueryKey(1, 20, ''))?.isInvalidated).toBe(false);
  });

  it('un fallo de adjunto no invalida ni modifica la compra confirmada', async () => {
    const error = { status: 500 };
    attachComprobante.mockRejectedValue(error);
    client.setQueryData(compraDetalleQueryKey('c1'), {
      id: 'c1',
      ingreso: { estado: 'confirmado' },
      comprobante: null,
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useAdjuntarComprobante());

    await expect(mutation.mutateAsync({ id: 'c1', file: new File(['pdf'], 'f.pdf') })).rejects.toBe(
      error,
    );
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryData(compraDetalleQueryKey('c1'))).toMatchObject({
      ingreso: { estado: 'confirmado' },
      comprobante: null,
    });
  });
});
