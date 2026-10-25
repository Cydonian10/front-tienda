import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CompraApi } from './compra-api';
import type { NuevaCompra } from '../interfaces/inventario/compra.interface';

describe('CompraApi (lectura)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('envía paginación y búsqueda documental o por proveedor', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.list(2, 10, 'F001 123');
    const request = http.expectOne(
      'http://localhost:3000/api/compras?page=2&limit=10&q=F001%20123',
    );
    expect(request.request.method).toBe('GET');
    const response = { data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('no envía una búsqueda vacía y obtiene el detalle por ID', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const list = api.list(1, 20, '');
    http
      .expectOne('http://localhost:3000/api/compras?page=1&limit=20')
      .flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await list;

    const detail = api.getById('compra-1');
    const request = http.expectOne('http://localhost:3000/api/compras/compra-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'compra-1', comprobante: null, renglones: [] });
    expect((await detail).id).toBe('compra-1');
  });

  it('confirma por multipart sin totales calculados ni identidad de usuario, con archivo opcional', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const compra: NuevaCompra = {
      proveedorId: 'p1',
      almacenId: 'a1',
      tipoDocumento: 'factura',
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '123',
      observaciones: 'Entrega completa',
      renglones: [{ varianteId: 'v1', unidadId: 'u1', cantidad: '2', precioUnitario: '10.50' }],
      comprobante: new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' }),
    };
    const result = api.create(compra);
    const request = http.expectOne('http://localhost:3000/api/compras');
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect([...body.keys()]).toEqual([
      'proveedorId',
      'almacenId',
      'tipoDocumento',
      'fecha',
      'serieDocumento',
      'numeroDocumento',
      'observaciones',
      'renglones',
      'comprobante',
    ]);
    expect(body.get('renglones')).toBe(JSON.stringify(compra.renglones));
    expect(body.get('comprobante')).toBe(compra.comprobante);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ id: 'c1', comprobante: { estado: 'adjuntado' } });
    await expect(result).resolves.toEqual({ id: 'c1', comprobante: { estado: 'adjuntado' } });

    const withoutFile = api.create({ ...compra, comprobante: null, observaciones: '' });
    const second = http.expectOne('http://localhost:3000/api/compras');
    const secondBody = second.request.body as FormData;
    expect(secondBody.has('comprobante')).toBe(false);
    expect(secondBody.has('observaciones')).toBe(false);
    second.flush({ id: 'c2', comprobante: { estado: 'pendiente' } });
    await withoutFile;
  });

  it('corrige documento y precios sin permitir que el cliente imponga el total', async () => {
    const correccion = {
      revision: 0,
      tipoDocumento: 'factura' as const,
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '124',
      observaciones: '',
      precios: [{ renglonId: 'r1', precioUnitario: '11.00' }],
    };
    const result = TestBed.inject(CompraApi).update('c1', correccion);
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/compras/c1',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(correccion);
    expect(request.request.body).not.toHaveProperty('totalDocumento');
    request.flush({ id: 'c1', revision: 1, totalDocumento: '22.000000' });
    expect((await result).revision).toBe(1);
  });

  it('propaga el error de compra sin convertirlo en éxito de recepción', async () => {
    const result = TestBed.inject(CompraApi).create({
      proveedorId: 'p1',
      almacenId: 'a1',
      tipoDocumento: 'factura',
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '123',
      renglones: [],
      comprobante: null,
    });
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/api/compras')
      .flush({ message: 'Documento duplicado' }, { status: 409, statusText: 'Conflict' });
    await expect(result).rejects.toMatchObject({ status: 409 });
  });

  it('adjunta un comprobante pendiente sin reenviar la compra', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const file = new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' });
    const result = api.attachComprobante('c1', file);
    const request = http.expectOne('http://localhost:3000/api/compras/c1/comprobante');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect([...(request.request.body as FormData).keys()]).toEqual(['comprobante']);
    expect((request.request.body as FormData).get('comprobante')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    const metadata = {
      id: 'archivo-1',
      nombreOriginal: 'factura.pdf',
      tipoMime: 'application/pdf',
      tamanoBytes: 8,
      fechaSubida: '2026-10-17T10:00:00Z',
    };
    request.flush(metadata);
    await expect(result).resolves.toEqual(metadata);
  });

  it('descarga el binario autenticable como Blob, no como URL pública', async () => {
    const result = TestBed.inject(CompraApi).downloadComprobante('c1');
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/compras/c1/comprobante/archivo',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    const blob = new Blob(['archivo'], { type: 'application/pdf' });
    request.flush(blob);
    await expect(result).resolves.toBe(blob);
  });
});
