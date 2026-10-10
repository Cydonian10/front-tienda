import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ENVIRONMENT } from '../../api/config/env-dev';
import { AuthPerfil } from '../../api/interfaces/access-control/auth.interface';
import { AuthStore } from '../../store/auth/auth.store';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthProfileService } from './auth-profile.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthProfileService', () => {
  const perfil = { id: 'employee-1', email: 'empleado@empresa.com' } as AuthPerfil;

  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient()),
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.inject(QueryClient).clear();
    localStorage.removeItem('front-tienda-auth');
    TestBed.resetTestingModule();
  });

  it('loads the profile with the token and reuses the fresh query on the next navigation', async () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    const profile = TestBed.inject(AuthProfileService);
    const request = profile.load();
    const controller = TestBed.inject(HttpTestingController);
    const pending = controller.expectOne('http://localhost:3000/api/auth/profile');
    expect(pending.request.headers.get('Authorization')).toBe('Bearer secret');
    pending.flush(perfil);

    await request;
    expect(TestBed.inject(AuthStore).authPerfil()).toEqual(perfil);
    await profile.load();
    controller.expectNone('http://localhost:3000/api/auth/profile');
  });

  it('checks the server again on guarded navigation even with a cached profile', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'revoked', tokenType: 'Bearer', expiresIn: 60 });
    const profile = TestBed.inject(AuthProfileService);
    const controller = TestBed.inject(HttpTestingController);

    const first = profile.load(true);
    controller.expectOne('http://localhost:3000/api/auth/profile').flush(perfil);
    await first;

    const second = profile.load(true);
    controller.expectOne('http://localhost:3000/api/auth/profile').flush('', { status: 401, statusText: 'Unauthorized' });
    await expect(second).rejects.toMatchObject({ status: 401 });
  });

  it('clears the profile and cached query without leaving a stale identity', async () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    const profile = TestBed.inject(AuthProfileService);
    const request = profile.load();
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/api/auth/profile')
      .flush(perfil);
    await request;

    profile.clear();
    expect(TestBed.inject(AuthStore).authPerfil()).toBeNull();
    expect(TestBed.inject(QueryClient).getQueryData(['auth-perfil'])).toBeUndefined();
  });

  it('does not reuse a cached profile when the token changes in another tab', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'first', tokenType: 'Bearer', expiresIn: 60 });
    const profile = TestBed.inject(AuthProfileService);
    const controller = TestBed.inject(HttpTestingController);
    const first = profile.load();
    controller.expectOne('http://localhost:3000/api/auth/profile').flush(perfil);
    await first;

    session.set({ accessToken: 'second', tokenType: 'Bearer', expiresIn: 60 });
    const second = profile.load();
    const request = controller.expectOne('http://localhost:3000/api/auth/profile');
    expect(request.request.headers.get('Authorization')).toBe('Bearer second');
    request.flush({ ...perfil, id: 'employee-2' });
    await second;

    expect(TestBed.inject(AuthStore).authPerfil()?.id).toBe('employee-2');
  });
});
