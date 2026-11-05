import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../api/inventario/almacen-api';
import { CajaApi } from '../../../api/ventas/caja/caja-api';
import PreparacionVentaPage from './preparacion-venta-page';

describe('PreparacionVentaPage', () => {
  it('muestra almacenes activos y turnos abiertos y conserva los identificadores', async () => {
    // Preparar las respuestas simuladas de almacenes y cajas.
    const client = new QueryClient();
    const consultarAlmacenes = vi.fn().mockResolvedValue({
      data: [{ id: 'a1', nombre: 'Principal', activo: true }],
      meta: { totalPages: 1 },
    });
    const consultarCajas = vi.fn().mockResolvedValue([
      {
        nombre: 'Caja 1',
        turnos: [
          { id: 't1', fechaCierre: null, usuarioApertura: { nickName: 'Ana' } },
          { id: 't2', fechaCierre: '2026-01-01', usuarioApertura: { nickName: 'Luis' } },
        ],
      },
    ]);
    // Configurar la página con las consultas simuladas y el enrutador.
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(client),
        { provide: AlmacenApi, useValue: { list: consultarAlmacenes } },
        { provide: CajaApi, useValue: { list: consultarCajas } },
      ],
    });
    const fixture = TestBed.createComponent(PreparacionVentaPage);
    fixture.detectChanges();

    // Esperar a que ambas consultas terminen antes de revisar la página.
    await vi.waitFor(() => {
      const cajasCargadas = fixture.componentInstance.cajasQuery.isSuccess();
      const almacenesCargados = fixture.componentInstance.almacenesQuery.isSuccess();
      expect(cajasCargadas && almacenesCargados).toBe(true);
    });
    fixture.detectChanges();

    // Mostrar el almacén y el turno abierto, pero no el turno cerrado.
    const pagina: HTMLElement = fixture.nativeElement;
    const textoPagina = pagina.textContent;
    expect(textoPagina).toContain('Principal');
    expect(textoPagina).toContain('Caja 1 · Ana');
    expect(textoPagina).not.toContain('Luis');

    // Seleccionar el almacén y el turno como lo haría el usuario.
    const almacen = pagina.querySelector<HTMLSelectElement>('#almacen')!;
    const turno = pagina.querySelector<HTMLSelectElement>('#turno')!;
    almacen.value = 'a1';
    almacen.dispatchEvent(new Event('change'));
    turno.value = 't1';
    turno.dispatchEvent(new Event('change'));
    const almacenSeleccionado = fixture.componentInstance.almacen();
    const turnoSeleccionado = fixture.componentInstance.turno();
    expect(almacenSeleccionado).toBe('a1');
    expect(turnoSeleccionado).toBe('t1');

    // Continuar debe guardar los identificadores y navegar al punto de venta.
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.continuar();
    const servicio = TestBed.inject(PreparacionVentaService);
    const seleccionGuardada = servicio.seleccion();
    expect(seleccionGuardada).toEqual({
      almacenId: 'a1',
      turnoId: 't1',
    });
    expect(navegar).toHaveBeenCalledWith(['/admin/ventas/punto-venta']);
    // Verificar los filtros enviados a las consultas.
    expect(consultarAlmacenes).toHaveBeenCalledWith(1, 100, '', true);
    expect(consultarCajas).toHaveBeenCalledWith({ estado: 'activas' });

    // Liberar el componente y los datos de las consultas.
    fixture.destroy();
    client.clear();
  });
});
