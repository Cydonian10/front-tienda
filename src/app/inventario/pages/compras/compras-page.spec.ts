import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';
import routes from '../../inventario.routes';
import ComprasPage from './compras-page';

@Component({ template: '' })
class EmptyPage {}

describe('ruta y acciones de compras', () => {
  const profile = { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin', component: EmptyPage },
          { path: 'auth/login', component: EmptyPage },
          { path: 'admin/inventario', children: routes },
        ]),
        {
          provide: AuthSessionService,
          useValue: { get: () => ({ accessToken: 'token' }), clear: vi.fn() },
        },
        { provide: AuthProfileService, useValue: profile },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ systemCode: 'INVENTARIO', code })),
    } as never);
  }

  it('bloquea navegación directa sin COMPRAS_LEER y permite consultar con ese permiso', async () => {
    grant(PERMISSION_CODES.COMPRAS_CREATE);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    expect(TestBed.inject(Router).url).toBe('/admin');

    grant(PERMISSION_CODES.COMPRAS_READ);
    await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/compras');
    expect(profile.load).toHaveBeenCalled();
  });

  it('oculta crear sin permiso y lo vuelve a comprobar al ejecutar la acción', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    const page = await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).not.toBeNull();

    grant(PERMISSION_CODES.COMPRAS_READ);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).toBeNull();
    page.openCreate();
    expect(page.showCreate()).toBe(false);

    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).not.toBeNull();
    page.openCreate();
    expect(page.showCreate()).toBe(true);
  });
});
