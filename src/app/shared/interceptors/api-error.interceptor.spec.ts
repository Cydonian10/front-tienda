import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../../api/config/env-dev';
import { ToastService } from '../services/toast/toast.service';
import { SKIP_API_ERROR_TOAST, apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  const api = 'http://localhost:3000/api';
  const toast = { error: vi.fn() };

  beforeEach(() => {
    toast.error.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: api } },
        { provide: ToastService, useValue: toast },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('shows the backend message for a forbidden action and preserves the HTTP error', () => {
    let received: HttpErrorResponse | undefined;
    TestBed.inject(HttpClient)
      .post(`${api}/users/123/roles/456`, {})
      .subscribe({
        error: (error: HttpErrorResponse) => (received = error),
      });

    TestBed.inject(HttpTestingController).expectOne(`${api}/users/123/roles/456`).flush(
      {
        statusCode: 403,
        error: 'Forbidden',
        message: 'No tienes los permisos requeridos',
        path: '/api/users/123/roles/456',
        timestamp: '2026-10-10T20:13:44.306Z',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(toast.error).toHaveBeenCalledExactlyOnceWith('No tienes los permisos requeridos');
    expect(received?.status).toBe(403);
  });

  it('provides safe defaults for missing messages and network/server failures', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.delete(`${api}/users/123`).subscribe({ error: () => {} });
    controller.expectOne(`${api}/users/123`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(toast.error).toHaveBeenLastCalledWith('No tienes los permisos requeridos.');

    http.post(`${api}/users`, {}).subscribe({ error: () => {} });
    controller
      .expectOne(`${api}/users`)
      .flush(
        { message: 'Database connection failed' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    expect(toast.error).toHaveBeenLastCalledWith(
      'El servidor no pudo completar la solicitud. Intenta más tarde.',
    );

    http.post(`${api}/users`, {}).subscribe({ error: () => {} });
    controller.expectOne(`${api}/users`).error(new ProgressEvent('error'));
    expect(toast.error).toHaveBeenLastCalledWith(
      'No se pudo conectar con el servidor. Revisa tu conexión.',
    );
  });

  it('shows validation messages returned as an array', () => {
    TestBed.inject(HttpClient)
      .post(`${api}/users`, {})
      .subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController)
      .expectOne(`${api}/users`)
      .flush(
        { message: ['El email ya existe', 'El nombre es obligatorio'] },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      'El email ya existe. El nombre es obligatorio',
    );
  });

  it('leaves ordinary GET failures to the page but reports a GET 403', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get(`${api}/users`).subscribe({ error: () => {} });
    controller.expectOne(`${api}/users`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(toast.error).not.toHaveBeenCalled();

    http.get(`${api}/users`).subscribe({ error: () => {} });
    controller
      .expectOne(`${api}/users`)
      .flush({ message: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' });
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('Acceso denegado');
  });

  it('skips login, external services and requests with a local error handler', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.post(`${api}/auth/login`, {}).subscribe({ error: () => {} });
    controller
      .expectOne(`${api}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    http.post('https://example.com/api/users', {}).subscribe({ error: () => {} });
    controller
      .expectOne('https://example.com/api/users')
      .flush({}, { status: 403, statusText: 'Forbidden' });

    http
      .post(
        `${api}/users`,
        {},
        {
          context: new HttpContext().set(SKIP_API_ERROR_TOAST, true),
        },
      )
      .subscribe({ error: () => {} });
    controller.expectOne(`${api}/users`).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(toast.error).not.toHaveBeenCalled();
  });
});
