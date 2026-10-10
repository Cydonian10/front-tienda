import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../../store/auth/auth.store';
import { AuthProfileService } from '../services/auth-profile.service';
import { AuthSessionService } from '../services/auth-session.service';
import { permissionGuard } from './permission.guard';

@Component({ template: '' })
class EmptyPage {}

describe('permissionGuard', () => {
  const systemCode = 'ACCESS_CONTROL';
  const code = PERMISSION_CODES.USERS_READ;

  beforeEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin', component: EmptyPage },
          {
            path: 'admin/access-control/usuarios',
            component: EmptyPage,
            canActivate: [permissionGuard(systemCode, code)],
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

  function setSession() {
    TestBed.inject(AuthSessionService).set({
      accessToken: 'secret',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
  }

  function setPermissions(
    permissions: { code: string; systemCode?: string }[],
    isSuperAdmin = false,
  ) {
    TestBed.inject(AuthStore).setProfile({ permissions, isSuperAdmin } as never);
  }

  it('redirects to login without a session', async () => {
    await RouterTestingHarness.create('/admin/access-control/usuarios');
    expect(TestBed.inject(Router).url).toBe(
      '/auth/login?returnUrl=%2Fadmin%2Faccess-control%2Fusuarios',
    );
  });

  it('does not grant a permission from another system or without a system', async () => {
    setSession();
    setPermissions([{ code, systemCode: 'SALES' }, { code }]);
    await RouterTestingHarness.create('/admin/access-control/usuarios');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('allows the matching system and super admins', async () => {
    setSession();
    setPermissions([{ code, systemCode }]);
    const harness = await RouterTestingHarness.create('/admin/access-control/usuarios');
    expect(TestBed.inject(Router).url).toBe('/admin/access-control/usuarios');
    expect(TestBed.inject(AuthProfileService).load).toHaveBeenCalled();

    setPermissions([], true);
    await harness.navigateByUrl('/admin');
    await harness.navigateByUrl('/admin/access-control/usuarios');
    expect(TestBed.inject(Router).url).toBe('/admin/access-control/usuarios');
  });
});
