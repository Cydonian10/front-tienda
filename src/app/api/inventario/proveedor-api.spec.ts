import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProveedorApi } from './proveedor-api';
import type { CrearProveedorDto, InformeComprasProveedor } from '../interfaces/inventario/proveedor.interface';

describe('ProveedorApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('envía página, límite y filtros de proveedor', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.list(2, 15, 'Acero Norte', '204');
    const request = http.expectOne(
      'http://localhost:3000/api/proveedores?page=2&limit=15&nombre=Acero%20Norte&documento=204',
    );
    expect(request.request.method).toBe('GET');
    const response = { data: [], meta: { page: 2, limit: 15, total: 0, totalPages: 0 } };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('omite filtros vacíos y consulta la búsqueda sin paginar', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const page = api.list(1, 20, '', '');
    http
      .expectOne('http://localhost:3000/api/proveedores?page=1&limit=20')
      .flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await page;

    const all = api.listAll('Ferretería');
    const request = http.expectOne(
      'http://localhost:3000/api/proveedores/todos?nombre=Ferreter%C3%ADa',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'p1', nombre: 'Ferretería', documento: null, contacto: null }]);
    expect((await all)[0].id).toBe('p1');
  });

  it('crea un proveedor con campos opcionales ausentes o nulos y devuelve la respuesta HTTP', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const dto: CrearProveedorDto = { nombre: 'Acero Norte' };
    const result = api.create(dto);
    const request = http.expectOne('http://localhost:3000/api/proveedores');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    const created = { id: 'p1', nombre: 'Acero Norte', documento: null, contacto: null };
    request.flush(created);
    await expect(result).resolves.toEqual(created);

    const withNullableFields: CrearProveedorDto = {
      nombre: 'Metal Sur',
      documento: '204',
      contacto: null,
    };
    const second = api.create(withNullableFields);
    const secondRequest = http.expectOne('http://localhost:3000/api/proveedores');
    expect(secondRequest.request.body).toEqual(withNullableFields);
    secondRequest.flush({ id: 'p2', ...withNullableFields });
    await expect(second).resolves.toMatchObject({ id: 'p2', documento: '204', contacto: null });
  });

  it('propaga el conflicto HTTP de documento duplicado', async () => {
    const result = TestBed.inject(ProveedorApi).create({ nombre: 'Duplicado', documento: '204' });
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/api/proveedores')
      .flush({ message: 'Documento duplicado' }, { status: 409, statusText: 'Conflict' });
    await expect(result).rejects.toMatchObject({ status: 409 });
  });

  it('consulta compras con fechas, paginación y conserva importes nulos como los devuelve la API', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.listCompras('p1', {
      desde: '2026-10-01',
      hasta: '2026-10-25',
      page: 2,
      limit: 20,
    });
    const request = http.expectOne(
      'http://localhost:3000/api/proveedores/p1/compras?page=2&limit=20&desde=2026-10-01&hasta=2026-10-25',
    );
    expect(request.request.method).toBe('GET');
    const response: InformeComprasProveedor = {
      proveedor: { id: 'p1', nombre: 'Acero Norte', documento: null, contacto: null },
      resumen: { cantidadCompras: 21, totalDocumento: null },
      data: [{
        id: 'c1', fecha: '2026-10-25', tipoDocumento: null,
        serieDocumento: null, numeroDocumento: null, totalDocumento: null,
      }],
      meta: { page: 2, limit: 20, total: 21, totalPages: 2 },
    };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('omite fechas vacías del informe y conserva montos decimales como cadenas', async () => {
    const result = TestBed.inject(ProveedorApi).listCompras('p1', {
      desde: '', hasta: '', page: 1, limit: 20,
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/proveedores/p1/compras?page=1&limit=20',
    );
    const response: InformeComprasProveedor = {
      proveedor: { id: 'p1', nombre: 'Acero Norte', documento: '204', contacto: null },
      resumen: { cantidadCompras: 1, totalDocumento: '10.50' },
      data: [{
        id: 'c1', fecha: '2026-10-25', tipoDocumento: 'factura',
        serieDocumento: 'F001', numeroDocumento: '123', totalDocumento: '10.50',
      }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });
});
