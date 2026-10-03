import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.resetTestingModule();
  });

  it('redirects unauthenticated users to login with a return URL', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/admin/roles' } as never),
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/auth/login?returnUrl=%2Fadmin%2Froles',
    );
  });

  it('allows users with a valid session', () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    expect(
      TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/admin' } as never)),
    ).toBe(true);
  });
});
