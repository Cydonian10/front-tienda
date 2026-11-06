import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../../api/inventario/almacen-api';
import { CajaApi } from '../../../api/ventas/caja/caja-api';
import { CatalogoApi } from '../../../api/ventas/catalogo/catalogo-api';
import { AuthStore } from '../../../store/auth/auth.store';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { RegistrarVentaAction } from '../../actions/use-registrar-venta-action';
import PuntoVentaPage from './punto-venta-page';

describe('PuntoVentaPage', () => {
  it('muestra el almacén seleccionado, el orden del turno y el usuario autenticado', async () => {
    // Preparar un almacén en la segunda página y turnos de distintos días.
    const client = new QueryClient();
    const registroBloqueado = signal(false);
    const almacenRecuperacion = signal<string | null>(null);
    const listarAlmacenes = vi.fn().mockImplementation(async (pagina: number) => ({
      data: pagina === 1 ? [] : [{ id: 'a1', nombre: 'Almacén norte', activo: true }],
      meta: { totalPages: 2 },
    }));
    const listarCajas = vi.fn().mockResolvedValue([
      {
        nombre: 'Caja central',
        turnos: [
          { id: 'anterior', fechaOperativa: '2026-11-04', fechaCierre: 'cerrado' },
          { id: 'primero', fechaOperativa: '2026-11-05', fechaCierre: 'cerrado' },
          {
            id: 'seleccionado',
            fechaOperativa: '2026-11-05',
            fechaCierre: null,
            usuarioApertura: { nickName: 'Otra persona' },
          },
        ],
      },
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(client),
        { provide: AlmacenApi, useValue: { list: listarAlmacenes } },
        { provide: CajaApi, useValue: { list: listarCajas } },
        {
          provide: CatalogoApi,
          useValue: {
            list: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 5, totalItems: 0 }),
          },
        },
        {
          provide: PreparacionVentaService,
          useValue: {
            seleccion: () => ({ almacenId: 'a1', turnoId: 'seleccionado' }),
            finalizarRecuperacion: vi.fn(),
            recuperandoAlmacen: almacenRecuperacion,
          },
        },
        { provide: RegistrarVentaAction, useValue: { bloqueado: registroBloqueado } },
        {
          provide: AuthStore,
          useValue: {
            authPerfil: () => ({
              person: { firstName: 'Ana', lastName: 'Pérez' },
              nickName: 'ana',
            }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(PuntoVentaPage);
    fixture.detectChanges();

    // Esperar las consultas y comprobar que se muestran sus datos, no los de apertura.
    await vi.waitFor(() => {
      expect(fixture.componentInstance.almacenQuery.isSuccess()).toBe(true);
      expect(fixture.componentInstance.cajasQuery.isSuccess()).toBe(true);
    });
    fixture.detectChanges();
    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Almacén norte');
    expect(contenido).toContain('Caja central · #02');
    expect(contenido).toContain('Ana Pérez');
    expect(contenido).not.toContain('Otra persona');
    expect(listarAlmacenes).toHaveBeenCalledTimes(2);

    // Cambiar la vista móvil sin eliminar ninguno de los paneles del escritorio.
    const pagina = fixture.nativeElement as HTMLElement;
    const productos = pagina.querySelector<HTMLElement>('app-catalogo-productos')!;
    const venta = pagina.querySelector<HTMLElement>('app-resumen-venta')!;
    const selectorVenta = pagina.querySelector<HTMLInputElement>('#vista-venta')!;
    const selectorProductos = pagina.querySelector<HTMLInputElement>('#vista-productos')!;
    expect(productos.classList.contains('hidden')).toBe(false);
    expect(venta.classList.contains('hidden')).toBe(true);
    selectorVenta.click();
    fixture.detectChanges();
    expect(productos.classList.contains('hidden')).toBe(true);
    expect(venta.classList.contains('hidden')).toBe(false);
    expect(selectorVenta.checked).toBe(true);
    selectorProductos.click();
    fixture.detectChanges();
    expect(productos.classList.contains('hidden')).toBe(false);
    expect(venta.classList.contains('hidden')).toBe(true);
    expect(productos.classList.contains('xl:block')).toBe(true);
    expect(venta.classList.contains('xl:block')).toBe(true);

    // Un cobro pendiente impide navegar y solicita la advertencia del navegador al salir.
    registroBloqueado.set(true);
    const salidaPermitida = fixture.componentInstance.puedeSalir();
    const evento = {
      preventDefault: vi.fn(),
      returnValue: 'sin advertencia',
    } as unknown as BeforeUnloadEvent;
    fixture.componentInstance.advertirSalida(evento);
    expect(salidaPermitida).toBe(false);
    expect(evento.preventDefault).toHaveBeenCalledOnce();
    expect(evento.returnValue).toBe('');

    // Al recuperar un turno, destruir la página no descarta el carrito compartido.
    const carrito = fixture.componentInstance.carrito;
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
    almacenRecuperacion.set('a1');
    fixture.destroy();
    expect(carrito.lineas()).toHaveLength(1);
    client.clear();
  });

  it('avisa cuando el turno seleccionado ya está cerrado', async () => {
    // Preparar una selección cuyo turno ya fue cerrado.
    const client = new QueryClient();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTanStackQuery(client),
        {
          provide: AlmacenApi,
          useValue: {
            list: vi.fn().mockResolvedValue({
              data: [{ id: 'a1', nombre: 'Principal' }],
              meta: { totalPages: 1 },
            }),
          },
        },
        {
          provide: CajaApi,
          useValue: {
            list: vi
              .fn()
              .mockResolvedValue([
                { nombre: 'Caja', turnos: [{ id: 't1', fechaCierre: 'cerrado' }] },
              ]),
          },
        },
        {
          provide: PreparacionVentaService,
          useValue: {
            seleccion: () => ({ almacenId: 'a1', turnoId: 't1' }),
            finalizarRecuperacion: vi.fn(),
            recuperandoAlmacen: () => null,
          },
        },
        { provide: RegistrarVentaAction, useValue: { bloqueado: () => false } },
        { provide: AuthStore, useValue: { authPerfil: () => null } },
      ],
    });
    const fixture = TestBed.createComponent(PuntoVentaPage);
    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(fixture.componentInstance.almacenQuery.isSuccess()).toBe(true);
      expect(fixture.componentInstance.cajasQuery.isSuccess()).toBe(true);
    });
    fixture.detectChanges();

    // Mostrar una salida clara en lugar de información desactualizada.
    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('El turno seleccionado ya no está disponible o está cerrado');
    expect(contenido).toContain('Volver a preparación');
    fixture.destroy();
    client.clear();
  });
});
