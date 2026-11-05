import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogoApi } from './catalogo-api';

describe('CatalogoApi', () => {
  it('envía almacén, búsqueda y paginación al catálogo de ventas', async () => {
    // Preparar el cliente HTTP de prueba y solicitar una página.
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(CatalogoApi);
    const http = TestBed.inject(HttpTestingController);
    const resultado = api.list({ almacenId: 'a1', q: 'martillo', page: 2, limit: 5 });
    const peticion = http.expectOne((request) => request.url === 'http://localhost:3000/api/ventas/catalogo');

    // Comprobar el contrato de la petición y la respuesta.
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('almacenId')).toBe('a1');
    expect(peticion.request.params.get('q')).toBe('martillo');
    expect(peticion.request.params.get('page')).toBe('2');
    expect(peticion.request.params.get('limit')).toBe('5');
    const pagina = { items: [], page: 2, limit: 5, totalItems: 0 };
    peticion.flush(pagina);
    await expect(resultado).resolves.toEqual(pagina);
    http.verify();
  });
});
