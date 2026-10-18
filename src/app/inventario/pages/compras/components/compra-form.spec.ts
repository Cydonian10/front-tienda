import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../../api/inventario/almacen-api';
import { CompraApi } from '../../../../api/inventario/compra-api';
import { ProveedorApi } from '../../../../api/inventario/proveedor-api';
import { VarianteCompraApi } from '../../../../api/inventario/variante-compra-api';
import type { VarianteCompraResponse } from '../../../../api/interfaces/inventario/compra.interface';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../../../../store/auth/auth.store';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';
import { By } from '@angular/platform-browser';
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
  const create = vi.fn();

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
        provideRouter([]),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: CompraApi, useValue: { create } },
        { provide: ProveedorApi, useValue: { list: listProveedores } },
        { provide: AlmacenApi, useValue: { list: listAlmacenes } },
        { provide: VarianteCompraApi, useValue: { list: listVariantes } },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  async function validForm() {
    const fixture = TestBed.createComponent(CompraForm);
    const form = fixture.componentInstance;
    await vi.waitFor(() => expect(form.proveedoresQuery.data()?.data).toEqual([proveedor]));
    await vi.waitFor(() => expect(form.almacenesQuery.data()?.data).toEqual([almacen]));
    await vi.waitFor(() => expect(form.variantesQuery.data()?.data).toEqual([variante]));
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.COMPRAS_CREATE, systemCode: 'INVENTARIO' }],
    } as never);
    form.selectProveedor('p1');
    form.selectAlmacen('a1');
    form.serieDocumento.set('F001');
    form.numeroDocumento.set('123');
    const row = form.renglones()[0].key;
    form.selectVariant(row, 'v1');
    form.updateRow(row, { cantidad: '2', precioUnitario: '10.50' });
    fixture.detectChanges();
    return {
      fixture,
      form,
      upload: fixture.debugElement.query(By.directive(FileUpload)).componentInstance as FileUpload,
    };
  }

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

  it('adjunta solo un PDF/JPG/PNG de hasta 10 MB, permite quitarlo y confirmar sin archivo inválido', async () => {
    const { fixture, form, upload } = await validForm();
    const pdf = new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' });
    upload.addFiles([pdf]);
    expect(form.comprobante()).toBe(pdf);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('factura.pdf');
    upload.remove(0);
    expect(form.comprobante()).toBeNull();
    upload.addFiles([new File(['x'], 'factura.exe', { type: 'application/octet-stream' })]);
    expect(form.fileError()).toContain('formato no está permitido');
    expect(form.canConfirm()).toBe(true);
    const oversized = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversized, 'size', { value: 10 * 1024 * 1024 + 1 });
    upload.addFiles([oversized]);
    expect(form.fileError()).toContain('supera el límite');
    upload.addFiles([new File(['x'], 'falso.pdf', { type: 'image/gif' })]);
    expect(form.fileError()).toContain('PDF, JPG o PNG válido');
    expect(upload.files()).toEqual([]);
    expect(form.comprobante()).toBeNull();
    upload.addFiles([pdf]);
    expect(form.fileError()).toBe('');
    expect(form.comprobante()).toBe(pdf);
  });

  it('envía una sola compra y muestra éxito de recepción con advertencia si falla el adjunto', async () => {
    const { fixture, form, upload } = await validForm();
    const pdf = new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' });
    upload.addFiles([pdf]);
    let release!: (value: unknown) => void;
    create.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const first = form.confirm();
    const second = form.confirm();
    expect(form.sending()).toBe(true);
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(create.mock.calls[0][0]).toEqual({
      proveedorId: 'p1',
      almacenId: 'a1',
      tipoDocumento: 'factura',
      fecha: form.fecha(),
      serieDocumento: 'F001',
      numeroDocumento: '123',
      observaciones: undefined,
      renglones: [{ varianteId: 'v1', unidadId: 'u1', cantidad: '2', precioUnitario: '10.50' }],
      comprobante: pdf,
    });
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).disabled,
    ).toBe(true);
    release({
      id: 'c1',
      comprobante: { estado: 'fallido', advertencia: 'El archivo no se guardó.' },
    });
    await Promise.all([first, second]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Compra e ingreso de inventario confirmados',
    );
    expect(fixture.nativeElement.textContent).toContain('El archivo no se guardó');
    expect(fixture.nativeElement.textContent).toContain('La compra y el stock sí se registraron');
    expect(
      fixture.nativeElement.querySelector('a[href="/admin/inventario/compras/c1"]'),
    ).not.toBeNull();
    await form.confirm();
    expect(create).toHaveBeenCalledOnce();
  });

  it('deja editable el formulario ante conflicto sin afirmar que el stock se recibió', async () => {
    const { fixture, form } = await validForm();
    create.mockRejectedValueOnce(new HttpErrorResponse({ status: 409, statusText: 'Conflict' }));
    await form.confirm();
    fixture.detectChanges();
    expect(form.confirmed()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Este documento ya figura registrado');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Compra e ingreso de inventario confirmados',
    );
    expect(
      (
        fixture.nativeElement.querySelector(
          'input[aria-label="Serie del documento"]',
        ) as HTMLInputElement
      ).disabled,
    ).toBe(false);
    expect(form.serieDocumento()).toBe('F001');
    create.mockResolvedValueOnce({ id: 'c2', comprobante: { estado: 'pendiente' } });
    await form.confirm();
    expect(create).toHaveBeenCalledTimes(2);
    expect(form.confirmed()?.id).toBe('c2');
    expect(create.mock.calls[1][0].comprobante).toBeNull();
  });

  it('comprueba COMPRAS_CREAR al ejecutar, incluso con datos válidos', async () => {
    const { form } = await validForm();
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [] } as never);
    await form.confirm();
    expect(create).not.toHaveBeenCalled();
    expect(form.actionError()).toContain('No tienes permiso');
  });

  it('ante una respuesta perdida invita a buscar el documento antes de reintentar', async () => {
    const { fixture, form } = await validForm();
    create.mockRejectedValueOnce(new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }));
    const find = vi.fn();
    form.findDocument.subscribe(find);
    await form.confirm();
    fixture.detectChanges();
    expect(form.confirmed()).toBeNull();
    expect(form.actionError()).toContain('Busca el documento en el listado');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Compra e ingreso de inventario confirmados',
    );
    const lookup = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Buscar documento'),
    );
    lookup?.click();
    expect(find).toHaveBeenCalledExactlyOnceWith('123');
  });
});
