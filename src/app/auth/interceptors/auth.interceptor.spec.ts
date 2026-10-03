import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from '../services/auth-session.service';
import { authInterceptor } from './auth.interceptor';
import { ENVIRONMENT } from '../../api/config/env-dev';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.removeItem('front-tienda-auth');
    TestBed.resetTestingModule();
  });

  it('sends the bearer token only to the configured API', () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('http://localhost:3000/api/roles').subscribe();
    const apiRequest = controller.expectOne('http://localhost:3000/api/roles');
    expect(apiRequest.request.headers.get('Authorization')).toBe('Bearer secret');
    apiRequest.flush({});

    http.post('http://localhost:3000/api/auth/login', {}).subscribe();
    const loginRequest = controller.expectOne('http://localhost:3000/api/auth/login');
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    loginRequest.flush({});

    http.get('http://localhost:3000/api-other/roles').subscribe();
    const otherPath = controller.expectOne('http://localhost:3000/api-other/roles');
    expect(otherPath.request.headers.has('Authorization')).toBe(false);
    otherPath.flush({});

    http.get('https://example.com/api/roles').subscribe();
    const otherOrigin = controller.expectOne('https://example.com/api/roles');
    expect(otherOrigin.request.headers.has('Authorization')).toBe(false);
    otherOrigin.flush({});
  });

  it('does not attach expired tokens or override explicit authorization', () => {
    const session = TestBed.inject(AuthSessionService);
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    session.set({ accessToken: 'expired', tokenType: 'Bearer', expiresIn: 0 });

    http.get('http://localhost:3000/api/roles').subscribe();
    const expiredRequest = controller.expectOne('http://localhost:3000/api/roles');
    expect(expiredRequest.request.headers.has('Authorization')).toBe(false);
    expiredRequest.flush({});

    session.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 60 });
    http
      .get('http://localhost:3000/api/roles', { headers: { Authorization: 'Other value' } })
      .subscribe();
    const explicitRequest = controller.expectOne('http://localhost:3000/api/roles');
    expect(explicitRequest.request.headers.get('Authorization')).toBe('Other value');
    explicitRequest.flush({});
  });
});
