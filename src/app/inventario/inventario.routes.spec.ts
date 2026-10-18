import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../store/auth/auth.store';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import inventarioRoutes from './inventario.routes';

@Component({ template: '' })
class EmptyPage {}

describe('rutas de inventario', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            children: [
              { path: '', pathMatch: 'full', component: EmptyPage },
              { path: 'inventario', children: inventarioRoutes },
            ],
          },
          { path: 'auth/login', component: EmptyPage },
        ]),
        {
          provide: AuthProfileService,
          useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() },
        },
        {
          provide: AuthSessionService,
          useValue: {
            get: vi.fn().mockReturnValue({ accessToken: 'secret', tokenType: 'Bearer' }),
            clear: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setPermissions(permissions: { code: string; systemCode: string }[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions } as never);
  }

  it('permite Existencias con EXISTENCIAS_LEER sin exigir ALMACENES_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.EXISTENCIAS_READ, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/existencias');

    expect(TestBed.inject(Router).url).toBe('/admin/inventario/existencias');
    expect(TestBed.inject(AuthProfileService).load).toHaveBeenCalled();
  });

  it('deniega la ruta si solo se tiene ALMACENES_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.ALMACENES_READ, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/existencias');

    expect(TestBed.inject(Router).url).toBe('/admin');
  });
});
