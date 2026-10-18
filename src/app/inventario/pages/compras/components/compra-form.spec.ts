import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../../api/inventario/almacen-api';
import { ProveedorApi } from '../../../../api/inventario/proveedor-api';
import { VarianteCompraApi } from '../../../../api/inventario/variante-compra-api';
import type { VarianteCompraResponse } from '../../../../api/interfaces/inventario/compra.interface';
import { renglonCalculo, totalVistaPrevia } from '../compra-form.model';
import { CompraForm } from './compra-form';

describe('CompraForm', () => {
  const proveedor = { id: 'p1', nombre: 'Acero Norte', documento: '123', contacto: null };
  const almacen = { id: 'a1', nombre: 'Principal', activo: true };
  const variante: VarianteCompraResponse = {
    id: 'v1',
    productoId: 'producto-1',
    productoNombre: 'Clavo',
    sku: 'CLA-1',
    unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' },
    unidades: [
      { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' },
      { id: 'u2', nombre: 'Caja', simbolo: 'caja', factorABase: '12.00000000' },
      { id: 'u3', nombre: 'Fracción', simbolo: 'fr', factorABase: '0.33333333' },
    ],
  };
  const listProveedores = vi.fn();
  const listAlmacenes = vi.fn();
  const listVariantes = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    listProveedores.mockImplementation((page: number, limit: number) =>
      Promise.resolve({
        data: [proveedor],
        meta: { page, limit, total: 1, totalPages: 1 },
      }),
    );
    listAlmacenes.mockResolvedValue({
      data: [almacen],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    listVariantes.mockImplementation((page: number, limit: number) =>
      Promise.resolve({
        data: [variante],
        meta: { page, limit, total: 1, totalPages: 1 },
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: ProveedorApi, useValue: { list: listProveedores } },
        { provide: AlmacenApi, useValue: { list: listAlmacenes } },
        { provide: VarianteCompraApi, useValue: { list: listVariantes } },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('consulta proveedores paginados, almacenes activos y variantes por búsqueda remota', async () => {
    const fixture = TestBed.createComponent(CompraForm);
    const form = fixture.componentInstance;
    await vi.waitFor(() => {
      expect(listProveedores).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(listAlmacenes).toHaveBeenCalledWith(1, 100, '', true);
      expect(listVariantes).toHaveBeenCalledWith(1, 10, undefined);
    });
    form.proveedorSearchDraft.set(' Acero ');
    form.searchProviders(new Event('submit'));
    await vi.waitFor(() => expect(listProveedores).toHaveBeenCalledWith(1, 10, 'Acero', undefined));
    form.changeProviderFilter('documento');
    await vi.waitFor(() => expect(listProveedores).toHaveBeenCalledWith(1, 10, undefined, 'Acero'));
    form.varianteSearchDraft.set(' CLA-1 ');
    form.searchVariants(new Event('submit'));
    await vi.waitFor(() => expect(listVariantes).toHaveBeenCalledWith(1, 10, 'CLA-1'));
    form.variantePage.set(2);
    await vi.waitFor(() => expect(listVariantes).toHaveBeenCalledWith(2, 10, 'CLA-1'));
  });

  it('bloquea datos incompletos, limita unidades y permite repetir variantes', async () => {
    const fixture = TestBed.createComponent(CompraForm);
    const form = fixture.componentInstance;
    await vi.waitFor(() => expect(form.variantesQuery.data()?.data).toEqual([variante]));
    await vi.waitFor(() => expect(form.proveedoresQuery.data()?.data).toEqual([proveedor]));
    await vi.waitFor(() => expect(form.almacenesQuery.data()?.data).toEqual([almacen]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Selecciona un proveedor existente');
    expect(form.canConfirm()).toBe(false);

    form.selectProveedor('p1');
    form.selectAlmacen('a1');
    form.serieDocumento.set('F001');
    form.numeroDocumento.set('123');
    const first = form.renglones()[0].key;
    form.selectVariant(first, 'v1');
    expect(form.renglones()[0].unidadId).toBe('u1');
    form.updateRow(first, { unidadId: 'no-valida', cantidad: '2', precioUnitario: '10' });
    expect(form.canConfirm()).toBe(false);
    form.updateRow(first, { unidadId: 'u2' });
    expect(form.total()).toBe('20.000000');
    expect(form.canConfirm()).toBe(true);
    fixture.detectChanges();
    const units = fixture.nativeElement.querySelector(
      '[aria-label="Unidad del renglón 1"]',
    ) as HTMLSelectElement;
    expect([...units.options].map((option) => option.value)).toEqual(['', 'u1', 'u2', 'u3']);
    expect(fixture.nativeElement.textContent).toContain('1 caja = 12.00000000 u');

    form.addRow();
    const second = form.renglones()[1].key;
    form.selectVariant(second, 'v1');
    form.updateRow(second, { cantidad: '1', precioUnitario: '0.000001' });
    expect(form.renglones().map((row) => row.variante?.id)).toEqual(['v1', 'v1']);
    expect(form.total()).toBe('20.000001');
    form.removeRow(first);
    expect(form.renglones()).toHaveLength(1);
    form.removeRow(second);
    expect(form.canConfirm()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Añade al menos un renglón válido');
    form.addRow();
    form.fecha.set('2026-02-31');
    expect(form.canConfirm()).toBe(false);
  });

  it('calcula con enteros decimales, redondea cada subtotal y rechaza conversión inexacta', () => {
    const row = {
      key: 1,
      variante,
      unidadId: 'u1',
      cantidad: '0.333333',
      precioUnitario: '0.333333',
    };
    expect(renglonCalculo(row).subtotal).toBe('0.111111');
    expect(totalVistaPrevia([row, row])).toBe('0.222222');
    expect(renglonCalculo({ ...row, unidadId: 'u3', cantidad: '1' }).cantidadBaseExacta).toBe(
      false,
    );
    expect(totalVistaPrevia([{ ...row, unidadId: 'u3', cantidad: '1' }])).toBeNull();
    expect(totalVistaPrevia([{ ...row, precioUnitario: '-1' }])).toBeNull();
    expect(totalVistaPrevia([{ ...row, cantidad: '1.0000001' }])).toBeNull();
  });

  it('explica cuando no hay proveedores y ofrece reintentar un fallo de consulta', async () => {
    listProveedores.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    const fixture = TestBed.createComponent(CompraForm);
    const form = fixture.componentInstance;
    await vi.waitFor(() => expect(form.proveedoresQuery.data()?.data).toEqual([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay proveedores registrados');
    expect(form.canConfirm()).toBe(false);
    listProveedores.mockRejectedValueOnce(new Error('sin acceso'));
    await form.proveedoresQuery.refetch();
    await vi.waitFor(() => expect(form.proveedoresQuery.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los proveedores');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });

  it('conserva proveedor y variante elegidos al buscar otra página remota', async () => {
    const fixture = TestBed.createComponent(CompraForm);
    const form = fixture.componentInstance;
    await vi.waitFor(() => expect(form.proveedoresQuery.data()?.data).toEqual([proveedor]));
    await vi.waitFor(() => expect(form.variantesQuery.data()?.data).toEqual([variante]));
    form.selectProveedor('p1');
    const key = form.renglones()[0].key;
    form.selectVariant(key, 'v1');
    listProveedores.mockResolvedValueOnce({
      data: [],
      meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });
    listVariantes.mockResolvedValueOnce({
      data: [],
      meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });
    form.proveedorPage.set(2);
    form.variantePage.set(2);
    await vi.waitFor(() => expect(form.proveedoresQuery.data()?.meta.page).toBe(2));
    await vi.waitFor(() => expect(form.variantesQuery.data()?.meta.page).toBe(2));
    expect(form.proveedores().map((item) => item.id)).toContain('p1');
    expect(form.rowOptions(form.renglones()[0]).map((item) => item.id)).toContain('v1');
  });
});
