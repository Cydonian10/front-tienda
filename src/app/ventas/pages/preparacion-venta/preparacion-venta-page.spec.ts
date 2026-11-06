import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../api/inventario/almacen-api';
import { CajaApi } from '../../../api/ventas/caja/caja-api';
import PreparacionVentaPage from './preparacion-venta-page';
import { CarritoVentaService } from '../punto-venta/service/carrito-venta.service';

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

  it('conserva el carrito y almacén mientras se elige un turno distinto', async () => {
    // Preparar una venta interrumpida por el cierre del turno seleccionado.
    const client = new QueryClient();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(client),
        {
          provide: AlmacenApi,
          useValue: {
            list: vi.fn().mockResolvedValue({
              data: [
                { id: 'a1', nombre: 'Principal', activo: true },
                { id: 'a2', nombre: 'Otro', activo: true },
              ],
              meta: { totalPages: 1 },
            }),
          },
        },
        {
          provide: CajaApi,
          useValue: {
            list: vi.fn().mockResolvedValue([
              {
                nombre: 'Caja',
                turnos: [
                  { id: 't1', fechaCierre: null, usuarioApertura: { nickName: 'Ana' } },
                  { id: 't2', fechaCierre: null, usuarioApertura: { nickName: 'Luis' } },
                ],
              },
            ]),
          },
        },
      ],
    });
    const preparacion = TestBed.inject(PreparacionVentaService);
    const carrito = TestBed.inject(CarritoVentaService);
    const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
    carrito.agregar(
      {
        id: 'v1',
        productoId: 'p1',
        nombre: 'Martillo',
        marca: '',
        sku: 'SKU',
        precio: '10.00',
        stock: '2',
        atributos: [],
        unidadBase: unidad,
        unidades: [unidad],
      },
      unidad,
      '1',
    );
    preparacion.seleccionar({ almacenId: 'a1', turnoId: 't1' });
    preparacion.recuperarTurno();
    const fixture = TestBed.createComponent(PreparacionVentaPage);
    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(fixture.componentInstance.almacenesQuery.isSuccess()).toBe(true);
      expect(fixture.componentInstance.cajasQuery.isFetching()).toBe(false);
    });
    fixture.detectChanges();

    // El almacén no se puede cambiar y el turno anterior no se ofrece aunque la caché lo muestre abierto.
    const pagina = fixture.nativeElement as HTMLElement;
    expect(pagina.querySelector<HTMLSelectElement>('#almacen')?.disabled).toBe(true);
    expect(fixture.componentInstance.turnos().map((turno) => turno.id)).toEqual(['t2']);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.almacen.set('a2');
    fixture.componentInstance.turno.set('t2');
    fixture.componentInstance.continuar();
    expect(navegar).not.toHaveBeenCalled();

    // Al elegir el otro turno, la venta permanece en memoria al salir de preparación.
    fixture.componentInstance.almacen.set('a1');
    fixture.componentInstance.continuar();
    fixture.destroy();
    const seleccionGuardada = preparacion.seleccion();
    expect(seleccionGuardada).toEqual({ almacenId: 'a1', turnoId: 't2' });
    expect(carrito.lineas()).toHaveLength(1);
    expect(navegar).toHaveBeenCalledWith(['/admin/ventas/punto-venta']);
    preparacion.finalizarRecuperacion();
    client.clear();
  });
});
