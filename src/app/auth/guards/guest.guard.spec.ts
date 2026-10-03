import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthProfileService } from '../services/auth-profile.service';
import { AuthSessionService } from '../services/auth-session.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
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

  it('shows login if there is no token', async () => {
    expect(await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(
      true,
    );
    expect(TestBed.inject(AuthProfileService).load).not.toHaveBeenCalled();
  });

  it('restores the profile and redirects to admin when the app opens with a token', async () => {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(TestBed.inject(AuthProfileService).load).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/admin',
    );
  });

  it('removes a rejected token and lets the user log in again', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'revoked', tokenType: 'Bearer', expiresIn: 60 });
    vi.mocked(TestBed.inject(AuthProfileService).load).mockRejectedValue(
      new HttpErrorResponse({ status: 401 }),
    );

    expect(await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(
      true,
    );
    expect(session.get()).toBeNull();
    expect(TestBed.inject(AuthProfileService).clear).toHaveBeenCalled();
  });
});
