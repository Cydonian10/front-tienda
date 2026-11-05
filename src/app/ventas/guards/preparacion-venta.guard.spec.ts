import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { PreparacionVentaService } from '../services/preparacion-venta.service';
import { preparacionVentaGuard } from './preparacion-venta.guard';

describe('preparacionVentaGuard', () => {
  it('redirige sin selección y permite el acceso con preparación', () => {
    // Preparar el enrutador para que el guard pueda crear la redirección.
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    // Ejecutar el guard dentro del contexto de inyección de Angular.
    const ejecutar = () =>
      TestBed.runInInjectionContext(() =>
        preparacionVentaGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

    // Sin selección, el guard redirige a la página de preparación.
    const router = TestBed.inject(Router);
    const resultadoSinSeleccion = ejecutar() as ReturnType<Router['parseUrl']>;
    const rutaRedireccion = router.serializeUrl(resultadoSinSeleccion);
    expect(rutaRedireccion).toBe('/admin/ventas/preparacion');

    // Con almacén y turno seleccionados, el guard permite el acceso.
    const servicio = TestBed.inject(PreparacionVentaService);
    servicio.seleccionar({ almacenId: 'a1', turnoId: 't1' });
    const resultadoConSeleccion = ejecutar();
    expect(resultadoConSeleccion).toBe(true);
  });
});
