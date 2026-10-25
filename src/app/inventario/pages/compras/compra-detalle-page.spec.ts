import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { CompraApi } from '../../../api/inventario/compra-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type {
  CompraResponse,
  ComprobanteCompraResponse,
} from '../../../api/interfaces/inventario/compra.interface';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';
import { AuthStore } from '../../../store/auth/auth.store';
import CompraDetallePage from './compra-detalle-page';
import { EditarCompra } from './components/editar-compra';

describe('CompraDetallePage', () => {
  const metadata: ComprobanteCompraResponse = {
    id: 'f1',
    nombreOriginal: 'factura.pdf',
    tipoMime: 'application/pdf',
    tamanoBytes: 10,
    fechaSubida: '2026-10-17T11:00:00Z',
  };
  const compra: CompraResponse = {
    id: 'c1',
    revision: 0,
    fecha: '2026-10-17',
    fechaRegistro: '2026-10-17T10:00:00Z',
    tipoDocumento: 'factura',
    serieDocumento: 'F001',
    numeroDocumento: '123',
    totalDocumento: '21.000000',
    proveedor: { id: 'p1', nombre: 'Acero Norte' },
    almacen: { id: 'a1', nombre: 'Principal' },
    cantidadRenglones: 1,
    observaciones: 'Entrega completa',
    ingreso: { id: 'm1', fecha: '2026-10-17T10:00:00Z', estado: 'confirmado' },
    renglones: [
      {
        id: 'r1',
        varianteId: 'v1',
        productoNombre: 'Clavo',
        sku: 'CLA-1',
        unidadId: 'u1',
        unidadNombre: 'Unidad',
        unidadSimbolo: 'u',
        cantidad: '2.000000',
        factorABase: '1.00000000',
        precioUnitario: '10.500000',
      },
    ],
    comprobante: null,
  };
  const getById = vi.fn();
  const attachComprobante = vi.fn();
  const downloadComprobante = vi.fn();
  const update = vi.fn();
  const paramMap = convertToParamMap({ id: 'c1' });

  beforeEach(() => {
    vi.resetAllMocks();
    getById.mockResolvedValue(compra);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap }, paramMap: of(paramMap) } },
        {
          provide: CompraApi,
          useValue: { getById, attachComprobante, downloadComprobante, update },
        },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ code, systemCode: 'INVENTARIO' })),
    } as never);
  }

  async function render() {
    const fixture = TestBed.createComponent(CompraDetallePage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()?.id).toBe('c1'));
    fixture.detectChanges();
    return { fixture, page };
  }

  it('muestra datos reales, ingreso y renglones en escritorio y móvil sin acción de subir a lectores', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    const { fixture } = await render();
    const text = fixture.nativeElement.textContent as string;
    for (const value of [
      'Factura F001-123',
      'Acero Norte',
      'Principal',
      'confirmado',
      'Clavo',
      'CLA-1',
      'S/ 21.00',
    ]) {
      expect(text).toContain(value);
    }
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('ul[aria-label="Productos recibidos"]'),
    ).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(FileUpload))).toBeNull();
    expect(text).not.toContain('Adjuntar comprobante');
    expect(getById).toHaveBeenCalledWith('c1');
    expect(text).not.toContain('Editar documento y precios');
  });

  it('corrige documento y precios con total recalculado y refresca el detalle', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_UPDATE);
    const { fixture, page } = await render();
    page.startEdit();
    fixture.detectChanges();
    const edit = fixture.debugElement.query(By.directive(EditarCompra))
      .componentInstance as EditarCompra;
    expect(edit.total()).toBe('21.000000');
    expect(fixture.nativeElement.textContent).toContain(
      'Proveedor, almacén, productos y cantidades no se modifican',
    );
    edit.numero.set('124');
    edit.setPrice('r1', '11.00');
    expect(edit.total()).toBe('22.000000');
    const updated = {
      ...compra,
      revision: 1,
      numeroDocumento: '124',
      totalDocumento: '22.000000',
      renglones: [{ ...compra.renglones[0], precioUnitario: '11.00' }],
    };
    update.mockResolvedValue(updated);
    getById.mockResolvedValue(updated);
    await edit.save();
    await vi.waitFor(() => expect(page.query.data()?.numeroDocumento).toBe('124'));
    fixture.detectChanges();
    expect(update).toHaveBeenCalledExactlyOnceWith(
      'c1',
      expect.objectContaining({
        revision: 0,
        numeroDocumento: '124',
        precios: [{ renglonId: 'r1', precioUnitario: '11.00' }],
      }),
    );
    expect(fixture.nativeElement.textContent).toContain('S/ 22.00');
    expect(fixture.nativeElement.textContent).toContain('Corrección guardada');
    expect(page.editing()).toBe(false);
  });

  it('conserva el formulario si la API rechaza la corrección por movimientos posteriores', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_UPDATE);
    const { fixture, page } = await render();
    page.startEdit();
    fixture.detectChanges();
    const edit = fixture.debugElement.query(By.directive(EditarCompra))
      .componentInstance as EditarCompra;
    edit.setPrice('r1', '12.50');
    update.mockRejectedValue(
      new HttpErrorResponse({
        status: 409,
        error: {
          message: 'Ya existen movimientos posteriores.',
        },
      }),
    );
    await edit.save();
    fixture.detectChanges();
    expect(page.editing()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Ya existen movimientos posteriores.');
    expect(edit.total()).toBe('25.000000');
  });

  it('al fallar la subida conserva el ingreso y permite reintentar sin crear otra compra', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const { fixture, page } = await render();
    const upload = fixture.debugElement.query(By.directive(FileUpload))
      .componentInstance as FileUpload;
    const file = new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' });
    upload.addFiles([file]);
    attachComprobante.mockRejectedValueOnce(new HttpErrorResponse({ status: 500 }));
    await page.attach();
    fixture.detectChanges();
    expect(page.query.data()?.ingreso?.estado).toBe('confirmado');
    expect(page.query.data()?.comprobante).toBeNull();
    expect(page.file()).toBe(file);
    expect(fixture.nativeElement.textContent).toContain('La compra y el ingreso siguen guardados');

    getById.mockResolvedValueOnce({ ...compra, comprobante: metadata });
    attachComprobante.mockResolvedValueOnce(metadata);
    await page.attach();
    await vi.waitFor(() => expect(page.query.data()?.comprobante).toEqual(metadata));
    fixture.detectChanges();
    expect(attachComprobante).toHaveBeenCalledTimes(2);
    expect(attachComprobante).toHaveBeenCalledWith('c1', file);
    expect(fixture.nativeElement.textContent).toContain('Descargar comprobante');
    expect(fixture.debugElement.query(By.directive(FileUpload))).toBeNull();
    await page.attach();
    expect(attachComprobante).toHaveBeenCalledTimes(2);
  });

  it('refresca el detalle ante 409 y no ofrece reemplazar el archivo existente', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const { fixture, page } = await render();
    fixture.debugElement
      .query(By.directive(FileUpload))
      .componentInstance.addFiles([new File(['pdf'], 'factura.pdf', { type: 'application/pdf' })]);
    attachComprobante.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    getById.mockResolvedValueOnce({ ...compra, comprobante: metadata });
    await page.attach();
    await vi.waitFor(() => expect(page.query.data()?.comprobante).toEqual(metadata));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(FileUpload))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Descargar comprobante');
  });

  it('valida tipo y tamaño antes de subir y permite retirar el archivo', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const { fixture, page } = await render();
    const upload = fixture.debugElement.query(By.directive(FileUpload))
      .componentInstance as FileUpload;
    upload.addFiles([new File(['texto'], 'comprobante.pdf', { type: 'text/plain' })]);
    fixture.detectChanges();
    expect(page.file()).toBeNull();
    expect(page.fileError()).toContain('PDF, JPG o PNG');

    upload.addFiles([
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }),
    ]);
    fixture.detectChanges();
    expect(page.file()).toBeNull();
    expect(page.fileError()).toContain('10 MB');

    upload.addFiles([new File(['pdf'], 'valido.pdf', { type: 'application/pdf' })]);
    fixture.detectChanges();
    expect(page.fileError()).toBe('');
    expect(page.file()?.name).toBe('valido.pdf');
    upload.remove(0);
    fixture.detectChanges();
    expect(page.file()).toBeNull();
    expect(attachComprobante).not.toHaveBeenCalled();
  });

  it('bloquea un segundo envío mientras se adjunta el archivo', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const { fixture, page } = await render();
    fixture.debugElement
      .query(By.directive(FileUpload))
      .componentInstance.addFiles([new File(['pdf'], 'factura.pdf', { type: 'application/pdf' })]);
    let finish!: (metadata: ComprobanteCompraResponse) => void;
    attachComprobante.mockReturnValue(
      new Promise<ComprobanteCompraResponse>((resolve) => {
        finish = resolve;
      }),
    );
    const pending = page.attach();
    fixture.detectChanges();
    expect(page.uploading()).toBe(true);
    expect(fixture.nativeElement.querySelector('button.btn-primary').disabled).toBe(true);
    await page.attach();
    expect(attachComprobante).toHaveBeenCalledTimes(1);
    finish(metadata);
    await pending;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Descargar comprobante');
    });
  });

  it('descarga con la API autenticada como Blob, sin exponer una URL privada', async () => {
    getById.mockResolvedValue({ ...compra, comprobante: metadata });
    grant(PERMISSION_CODES.COMPRAS_READ);
    const { fixture, page } = await render();
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    downloadComprobante.mockResolvedValue(blob);
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createUrl = vi.fn().mockReturnValue('blob:compra-pdf');
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('factura.pdf');
      expect(this.href).toBe('blob:compra-pdf');
    });
    try {
      await page.download();
      expect(downloadComprobante).toHaveBeenCalledExactlyOnceWith('c1');
      expect(createUrl).toHaveBeenCalledExactlyOnceWith(blob);
      expect(click).toHaveBeenCalledOnce();
      await vi.waitFor(() => expect(revokeUrl).toHaveBeenCalledWith('blob:compra-pdf'));
      expect(fixture.nativeElement.textContent).toContain('factura.pdf');
    } finally {
      click.mockRestore();
      if (originalCreate)
        Object.defineProperty(URL, 'createObjectURL', {
          configurable: true,
          value: originalCreate,
        });
      else delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
      if (originalRevoke)
        Object.defineProperty(URL, 'revokeObjectURL', {
          configurable: true,
          value: originalRevoke,
        });
      else delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
    }
  });

  it('vuelve a comprobar permisos en subida y descarga, no solo al ocultar controles', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const { fixture, page } = await render();
    fixture.debugElement
      .query(By.directive(FileUpload))
      .componentInstance.addFiles([new File(['pdf'], 'factura.pdf', { type: 'application/pdf' })]);
    grant(PERMISSION_CODES.COMPRAS_READ);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(FileUpload))).toBeNull();
    await page.attach();
    expect(attachComprobante).not.toHaveBeenCalled();
    expect(page.uploadError()).toContain('No tienes permiso');

    getById.mockResolvedValue({ ...compra, comprobante: metadata });
    await page.query.refetch();
    await vi.waitFor(() => expect(page.comprobante()).toEqual(metadata));
    grant();
    await page.download();
    expect(downloadComprobante).not.toHaveBeenCalled();
    expect(page.downloadError()).toContain('No tienes permiso');
  });

  it('mantiene visible el archivo y permite reintentar cuando falla la descarga', async () => {
    getById.mockResolvedValue({ ...compra, comprobante: metadata });
    downloadComprobante.mockRejectedValueOnce(new Error('sin conexión'));
    grant(PERMISSION_CODES.COMPRAS_READ);
    const { fixture, page } = await render();
    await page.download();
    fixture.detectChanges();
    expect(page.downloadError()).toContain('Inténtalo de nuevo');
    expect(fixture.nativeElement.textContent).toContain('Descargar comprobante');
    expect(page.downloading()).toBe(false);
  });

  it('distingue compra inexistente de error temporal y permite reintentar la consulta', async () => {
    getById.mockRejectedValueOnce(new HttpErrorResponse({ status: 404 }));
    grant(PERMISSION_CODES.COMPRAS_READ);
    const fixture = TestBed.createComponent(CompraDetallePage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos la compra');
    getById.mockResolvedValueOnce(compra);
    await page.query.refetch();
    await vi.waitFor(() => expect(page.query.data()?.id).toBe('c1'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Factura F001-123');
  });
});
