import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthProfileService } from '../services/auth-profile.service';
import { AuthSessionService } from '../services/auth-session.service';

@Component({ template: '' })
class EmptyPage {}

describe('admin route protection', () => {
  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    const admin = routes.find((route) => route.path === 'admin')!;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            ...admin,
            loadChildren: undefined,
            children: [
              { path: '', pathMatch: 'full', component: EmptyPage },
              { path: 'second', component: EmptyPage },
            ],
          },
          { path: 'auth/login', component: EmptyPage },
        ]),
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

  it('blocks a direct visit to admin without a session', async () => {
    await RouterTestingHarness.create('/admin');
    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fadmin');
  });

  it('checks the session again when moving from admin to a child', async () => {
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 60 });
    const profile = TestBed.inject(AuthProfileService);
    const harness = await RouterTestingHarness.create('/admin');
    expect(profile.load).toHaveBeenCalledExactlyOnceWith(true);

    vi.mocked(profile.load).mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }));
    await harness.navigateByUrl('/admin/second');

    expect(profile.load).toHaveBeenCalledTimes(2);
    expect(session.get()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fadmin%2Fsecond');
  });
});
