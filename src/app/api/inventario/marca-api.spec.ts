import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { MarcaApi } from './marca-api';

describe('MarcaApi', () => {
  const base = 'http://localhost:3000/api/marcas';
  const marca = { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null };
  let api: MarcaApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
    ] });
    api = TestBed.inject(MarcaApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); TestBed.resetTestingModule(); });

  it('lista por página, búsqueda y filtro de estado incluyendo false', async () => {
    const promise = api.list({ q: 'atl', activo: false, page: 2, limit: 20 });
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['activo', 'limit', 'page', 'q']);
    expect(request.request.params.get('activo')).toBe('false');
    expect(request.request.params.get('q')).toBe('atl');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    const page = { items: [marca], page: 2, limit: 20, totalItems: 23 };
    request.flush(page);
    expect(await promise).toEqual(page);

    const unfiltered = api.list({ page: 1, limit: 20 });
    const all = http.expectOne((req) => req.url === base);
    expect(all.request.params.keys().sort()).toEqual(['limit', 'page']);
    all.flush({ items: [], page: 1, limit: 20, totalItems: 0 });
    expect((await unfiltered).items).toEqual([]);
  });

  it('consulta detalle e imagen autenticada como Blob', async () => {
    const detail = api.getById('m1');
    const get = http.expectOne(`${base}/m1`);
    expect(get.request.method).toBe('GET');
    get.flush(marca);
    expect(await detail).toEqual(marca);

    const image = api.getImage('m1');
    const request = http.expectOne(`${base}/m1/imagen`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    const blob = new Blob(['foto'], { type: 'image/png' });
    request.flush(blob);
    expect(await image).toBe(blob);
  });

  it('crea sin imagen como JSON y con imagen como multipart', async () => {
    const plain = api.create({ nombre: 'Atlas' });
    const json = http.expectOne(base);
    expect(json.request.method).toBe('POST');
    expect(json.request.body).toEqual({ nombre: 'Atlas' });
    json.flush(marca);
    expect(await plain).toEqual(marca);

    const file = new File(['foto'], 'marca.png', { type: 'image/png' });
    const uploaded = api.create({ nombre: 'Atlas', imagen: file });
    const multipart = http.expectOne(base);
    expect(multipart.request.method).toBe('POST');
    expect(multipart.request.body).toBeInstanceOf(FormData);
    expect((multipart.request.body as FormData).get('nombre')).toBe('Atlas');
    expect((multipart.request.body as FormData).get('imagen')).toBe(file);
    multipart.flush(marca);
    expect(await uploaded).toEqual(marca);
  });

  it('edita nombre, imagen y retirada sin enviar operaciones contradictorias', async () => {
    const file = new File(['foto'], 'nueva.webp', { type: 'image/webp' });
    const uploaded = api.update('m1', { imagen: file });
    const multipart = http.expectOne(`${base}/m1`);
    expect(multipart.request.method).toBe('PATCH');
    expect((multipart.request.body as FormData).get('imagen')).toBe(file);
    expect((multipart.request.body as FormData).has('quitarImagen')).toBe(false);
    multipart.flush(marca);
    await uploaded;

    const removed = api.update('m1', { nombre: 'Atlas 2', quitarImagen: true });
    const json = http.expectOne(`${base}/m1`);
    expect(json.request.body).toEqual({ nombre: 'Atlas 2', quitarImagen: true });
    json.flush(marca);
    await removed;
    await expect(api.update('m1', { imagen: file, quitarImagen: true })).rejects.toThrow();
    http.expectNone(`${base}/m1`);
  });

  it('cambia estado por endpoint dedicado y propaga errores', async () => {
    const status = api.changeStatus('m1', false);
    const request = http.expectOne(`${base}/m1/estado`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ activo: false });
    request.flush({ ...marca, activo: false });
    expect((await status).activo).toBe(false);

    const failed = api.getImage('m1');
    http.expectOne(`${base}/m1/imagen`).flush(new Blob(['No hay imagen']), { status: 404, statusText: 'Not Found' });
    await expect(failed).rejects.toMatchObject({ status: 404 });
  });
});
