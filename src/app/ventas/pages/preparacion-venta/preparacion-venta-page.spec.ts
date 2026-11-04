import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../api/inventario/almacen-api';
import { CajaApi } from '../../../api/ventas/caja/caja-api';
import PreparacionVentaPage from './preparacion-venta-page';

describe('PreparacionVentaPage', () => {
  it('muestra almacenes activos y turnos abiertos y conserva los identificadores', async () => {
    const client = new QueryClient();
    const almacenes = vi.fn().mockResolvedValue({ data: [{ id: 'a1', nombre: 'Principal', activo: true }], meta: { totalPages: 1 } });
    const cajas = vi.fn().mockResolvedValue([{ nombre: 'Caja 1', turnos: [
      { id: 't1', fechaCierre: null, usuarioApertura: { nickName: 'Ana' } },
      { id: 't2', fechaCierre: '2026-01-01', usuarioApertura: { nickName: 'Luis' } },
    ] }]);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTanStackQuery(client),
      { provide: AlmacenApi, useValue: { list: almacenes } },
      { provide: CajaApi, useValue: { list: cajas } },
    ] });
    const fixture = TestBed.createComponent(PreparacionVentaPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasQuery.isSuccess() && fixture.componentInstance.almacenesQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Principal');
    expect(element.textContent).toContain('Caja 1 · Ana');
    expect(element.textContent).not.toContain('Luis');
    const almacen = element.querySelector<HTMLSelectElement>('#almacen')!;
    const turno = element.querySelector<HTMLSelectElement>('#turno')!;
    almacen.value = 'a1'; almacen.dispatchEvent(new Event('change'));
    turno.value = 't1'; turno.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.almacen()).toBe('a1');
    expect(fixture.componentInstance.turno()).toBe('t1');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.continuar();
    expect(TestBed.inject(PreparacionVentaService).seleccion()).toEqual({ almacenId: 'a1', turnoId: 't1' });
    expect(navegar).toHaveBeenCalledWith(['/admin/ventas/venta/punto-venta']);
    expect(almacenes).toHaveBeenCalledWith(1, 100, '', true);
    expect(cajas).toHaveBeenCalledWith({ estado: 'activas' });
    fixture.destroy();
    client.clear();
  });
});
