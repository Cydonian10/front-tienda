import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { AuthStore } from '../store/auth/auth.store';
import ventasRoutes from './ventas.routes';

@Component({ template: '' })
class EmptyPage {}

describe('rutas de ventas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin', children: [
            { path: '', pathMatch: 'full', component: EmptyPage },
            { path: 'ventas', children: ventasRoutes },
          ] },
        ]),
        {
          provide: AuthProfileService,
          useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() },
        },
        {
          provide: AuthSessionService,
          useValue: { get: vi.fn().mockReturnValue({ accessToken: 'secret' }), clear: vi.fn() },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  function grant(systemCode: string) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.CAJAS_TURNOS_READ, systemCode }],
    } as never);
  }

  it('redirige la entrada de Ventas y muestra el aviso informativo', async () => {
    grant('VENTAS');
    const harness = await RouterTestingHarness.create('/admin/ventas');

    expect(TestBed.inject(Router).url).toBe('/admin/ventas/cajas-turnos');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Cajas y turnos');
    expect(harness.routeNativeElement?.textContent).toContain('Gestión aún no disponible');
    expect(harness.routeNativeElement?.querySelector('button, input, form')).toBeNull();

    await harness.navigateByUrl('/admin/ventas/cajas-turnos');
    expect(TestBed.inject(Router).url).toBe('/admin/ventas/cajas-turnos');
  });

  it('deniega la ruta sin el permiso de VENTAS, incluso si existe en otro sistema', async () => {
    grant('INVENTARIO');
    const harness = await RouterTestingHarness.create('/admin/ventas/cajas-turnos');
    expect(TestBed.inject(Router).url).toBe('/admin');

    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [] } as never);
    await harness.navigateByUrl('/admin/ventas');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });
});
