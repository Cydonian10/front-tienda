import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthProfileService } from '../services/auth-profile.service';
import { HttpErrorResponse } from '@angular/common/http';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthProfileService,
          useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() },
        },
      ],
    });
  });
  afterEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.resetTestingModule();
  });

  it('redirects unauthenticated users to login with a return URL', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/admin/access-control/sistemas-roles' } as never),
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/auth/login?returnUrl=%2Fadmin%2Faccess-control%2Fsistemas-roles',
    );
  });

  it('loads the profile before allowing access with a valid session', async () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    expect(
      await TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/admin' } as never)),
    ).toBe(true);
    expect(TestBed.inject(AuthProfileService).load).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('clears a rejected session and redirects when the profile returns 401', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'revoked', tokenType: 'Bearer', expiresIn: 60 });
    vi.mocked(TestBed.inject(AuthProfileService).load).mockRejectedValue(
      new HttpErrorResponse({ status: 401 }),
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/admin/access-control/sistemas-roles' } as never),
    );

    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/auth/login?returnUrl=%2Fadmin%2Faccess-control%2Fsistemas-roles',
    );
    expect(session.get()).toBeNull();
    expect(TestBed.inject(AuthProfileService).clear).toHaveBeenCalled();
  });

  it('keeps the token on a temporary profile error but does not enter admin', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 60 });
    vi.mocked(TestBed.inject(AuthProfileService).load).mockRejectedValue(
      new HttpErrorResponse({ status: 503 }),
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/admin' } as never),
    );

    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/auth/login?returnUrl=%2Fadmin',
    );
    expect(session.get()?.accessToken).toBe('secret');
  });
});
