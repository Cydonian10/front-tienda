import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
