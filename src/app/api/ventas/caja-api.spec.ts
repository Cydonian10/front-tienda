import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CajaApi } from './caja-api';

describe('CajaApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.resetTestingModule());

  it('lista cajas con los filtros y devuelve sus turnos', async () => {
    const api = TestBed.inject(CajaApi);
    const http = TestBed.inject(HttpTestingController);
    const cajas = [{ id: '1', codigo: 'C0001', nombre: 'Mostrador', activo: true, turnos: [] }];
    const result = api.list({ fechaOperativa: '2026-10-30', estado: 'activas' });
    const request = http.expectOne((req) => req.url === 'http://localhost:3000/api/cajas');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('fechaOperativa')).toBe('2026-10-30');
    expect(request.request.params.get('estado')).toBe('activas');
    request.flush(cajas);
    await expect(result).resolves.toEqual(cajas);
    http.verify();
  });

  it('omite los filtros opcionales cuando no se proporcionan', async () => {
    const result = TestBed.inject(CajaApi).list();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('http://localhost:3000/api/cajas');
    request.flush([]);
    await expect(result).resolves.toEqual([]);
    http.verify();
  });

  it('crea una caja con el nombre y devuelve la respuesta del servidor', async () => {
    const api = TestBed.inject(CajaApi);
    const http = TestBed.inject(HttpTestingController);
    const caja = { id: '1', codigo: 'C0001', nombre: 'Mostrador', activo: true };
    const result = api.create({ nombre: 'Mostrador' });
    const request = http.expectOne('http://localhost:3000/api/cajas');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nombre: 'Mostrador' });
    request.flush(caja);
    await expect(result).resolves.toEqual(caja);
    http.verify();
  });
});
