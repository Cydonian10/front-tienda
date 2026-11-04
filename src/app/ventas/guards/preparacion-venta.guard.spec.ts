import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { PreparacionVentaService } from '../services/preparacion-venta.service';
import { preparacionVentaGuard } from './preparacion-venta.guard';

describe('preparacionVentaGuard', () => {
  it('redirige sin selección y permite el acceso con preparación', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const ejecutar = () => TestBed.runInInjectionContext(() => preparacionVentaGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(TestBed.inject(Router).serializeUrl(ejecutar() as ReturnType<Router['parseUrl']>)).toBe('/admin/ventas/venta/preparacion');
    TestBed.inject(PreparacionVentaService).seleccion.set({ almacenId: 'a1', turnoId: 't1' });
    expect(ejecutar()).toBe(true);
  });
});
