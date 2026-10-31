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
