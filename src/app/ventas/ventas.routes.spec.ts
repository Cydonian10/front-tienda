import { Component, signal } from '@angular/core';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoCajaApi } from '../api/ventas/movimiento-caja/movimiento-caja-api';
import { RegistrarMovimientoCajaAction } from './actions/use-movimientos-caja-action';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { AuthorizationService } from '../auth/services/authorization.service';
import MovimientosCajaPage from './pages/movimientos-caja/movimientos-caja-page';
import ventasRoutes from './ventas.routes';

@Component({ template: '' })
class PuntoVentaPrueba {
  readonly bloqueado = signal(false);
  puedeSalir(): boolean {
    return !this.bloqueado();
  }
}

@Component({ template: '' })
class OtraPaginaPrueba {}

describe('Rutas de ventas', () => {
  it.each([true, false])('protege movimientos de caja según el permiso: %s', async (permitido) => {
    // Usar la ruta y el guard reales con una sesión y permisos controlados.
    const movimientos = ventasRoutes.find((ruta) => ruta.path === 'movimientos-caja')!;
    const autorizacion = { hasPermission: vi.fn().mockReturnValue(permitido) };
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        {
          provide: MovimientoCajaApi,
          useValue: { listar: vi.fn().mockResolvedValue({ data: [], total: 0 }) },
        },
        {
          provide: RegistrarMovimientoCajaAction,
          useValue: { bloqueado: signal(false), pendiente: signal(null) },
        },
        provideRouter([
          { ...movimientos, path: 'admin/ventas/movimientos-caja' },
          { path: 'admin', component: OtraPaginaPrueba },
        ]),
        { provide: AuthSessionService, useValue: { get: () => ({}) } },
        { provide: AuthProfileService, useValue: { load: vi.fn().mockResolvedValue(undefined) } },
        { provide: AuthorizationService, useValue: autorizacion },
      ],
    });

    // La navegación autorizada muestra la pantalla; la otra vuelve al inicio de administración.
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/ventas/movimientos-caja');
    const urlResultante = TestBed.inject(Router).url;
    expect(autorizacion.hasPermission).toHaveBeenCalledWith(
      'VENTAS',
      PERMISSION_CODES.CAJAS_TURNOS_READ,
    );
    expect(urlResultante).toBe(permitido ? '/admin/ventas/movimientos-caja' : '/admin');
    if (permitido) {
      const paginaMostrada = harness.routeDebugElement?.componentInstance;
      const textoMostrado = harness.routeNativeElement?.textContent;
      expect(paginaMostrada).toBeInstanceOf(MovimientosCajaPage);
      expect(textoMostrado).toContain('Historial de movimientos');
      expect(textoMostrado).toContain('Registrar movimiento');
    }
  });

  it('no permite navegar fuera del punto de venta durante un cobro pendiente', async () => {
    // Usar el guard real de la ruta con una página controlable.
    const puntoVenta = ventasRoutes.find((ruta) => ruta.path === 'punto-venta')!;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'punto-venta',
            component: PuntoVentaPrueba,
            canDeactivate: puntoVenta.canDeactivate,
          },
          { path: 'otra', component: OtraPaginaPrueba },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/punto-venta', PuntoVentaPrueba);
    pagina.bloqueado.set(true);

    // El router cancela la navegación hasta que termine la operación.
    const router = TestBed.inject(Router);
    const navegacionBloqueada = await router.navigateByUrl('/otra');
    expect(navegacionBloqueada).toBe(false);
    expect(router.url).toBe('/punto-venta');
    pagina.bloqueado.set(false);
    const navegacionPermitida = await router.navigateByUrl('/otra');
    expect(navegacionPermitida).toBe(true);
    expect(router.url).toBe('/otra');
  });
});
