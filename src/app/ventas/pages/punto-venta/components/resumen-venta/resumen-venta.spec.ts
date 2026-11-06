import { Dialog } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  RegistrarVentaAction,
  type EstadoRegistroVenta,
} from '../../../../actions/use-registrar-venta-action';
import { PreparacionVentaService } from '../../../../services/preparacion-venta.service';
import { AuthStore } from '../../../../../store/auth/auth.store';
import type { AuthPerfil } from '../../../../../api/interfaces/access-control/auth.interface';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { ResumenVenta } from './resumen-venta';

describe('ResumenVenta', () => {
  it('abre el diálogo compartido y lo cierra sin modificar el carrito', async () => {
    // Preparar una venta para abrir el diálogo desde el resumen.
    const carrito = new CarritoVentaService();
    const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
    carrito.agregar(
      {
        id: 'v1',
        productoId: 'p1',
        nombre: 'Martillo',
        marca: 'Stanley',
        sku: 'MAR',
        precio: '10.00',
        stock: '3',
        atributos: [],
        unidadBase: unidad,
        unidades: [unidad],
      },
      unidad,
      '2',
    );
    TestBed.configureTestingModule({
      imports: [ResumenVenta],
      providers: [
        provideRouter([]),
        { provide: QueryClient, useValue: new QueryClient() },
        { provide: CarritoVentaService, useValue: carrito },
        {
          provide: PreparacionVentaService,
          useValue: { seleccion: () => ({ almacenId: 'a1', turnoId: 't1' }) },
        },
        {
          provide: RegistrarVentaAction,
          useValue: {
            estado: signal<EstadoRegistroVenta>({ tipo: 'listo' }),
            bloqueado: () => false,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ResumenVenta);
    fixture.detectChanges();
    const botonCobrar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((boton) => boton.textContent?.includes('Ir a cobrar'))!;
    botonCobrar.click();
    await TestBed.tick();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const dialogo = overlay.querySelector('[role="dialog"]')!;
    const titulo = document.getElementById(dialogo.getAttribute('aria-labelledby')!);
    const descripcion = document.getElementById(dialogo.getAttribute('aria-describedby')!);
    expect(titulo?.textContent).toBe('Cobrar venta');
    expect(descripcion?.textContent).toContain('Selecciona un medio de pago');
    expect(dialogo.textContent).toContain('S/ 20.00');
    expect(dialogo.querySelector('app-dialog-shell')).not.toBeNull();

    // Cancelar cierra el diálogo y al volver a abrirlo restablece sus datos.
    dialogo.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    await TestBed.tick();
    dialogo.querySelector<HTMLButtonElement>('[data-dialog-cancel]')!.click();
    const dialogoCerrado = overlay.querySelector('[role="dialog"]');
    expect(dialogoCerrado).toBeNull();
    expect(carrito.lineas()).toHaveLength(1);
    botonCobrar.click();
    await TestBed.tick();
    const dialogoReabierto = overlay.querySelector('[role="dialog"]')!;
    const efectivo = dialogoReabierto.querySelector<HTMLInputElement>('input[type="radio"]')!;
    const montoReabierto = dialogoReabierto.querySelector<HTMLInputElement>(
      'input[inputmode="decimal"]',
    )!;
    expect(efectivo.checked).toBe(true);
    expect(montoReabierto.value).toBe('');
    TestBed.inject(Dialog).closeAll();
    fixture.destroy();
  });

  it('muestra el carrito, sus importes y permite quitar una línea', () => {
    // Preparar una línea en el carrito compartido con la vista.
    const carrito = new CarritoVentaService();
    const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
    const variante = {
      id: 'v1',
      productoId: 'p1',
      nombre: 'Martillo',
      marca: 'Stanley',
      sku: 'MAR',
      precio: '10.00',
      stock: '3',
      atributos: [],
      unidadBase: unidad,
      unidades: [unidad],
    };
    carrito.agregar(variante, unidad, '2');
    TestBed.configureTestingModule({
      imports: [ResumenVenta],
      providers: [{ provide: CarritoVentaService, useValue: carrito }],
    });
    const fixture = TestBed.createComponent(ResumenVenta);
    fixture.detectChanges();
    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Martillo');
    expect(contenido).toContain('Marca: Stanley');
    const marcaEnResumen = fixture.nativeElement.querySelector(
      '[title="Marca: Stanley"]',
    ) as HTMLElement;
    expect(marcaEnResumen.classList.contains('badge')).toBe(true);
    expect(contenido).toContain('S/ 20.00');

    // Quitar devuelve el resumen al estado vacío sin habilitar el cobro.
    (fixture.nativeElement.querySelector('li button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const contenidoVacio = fixture.nativeElement.textContent as string;
    const botonCobrar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((boton) => boton.textContent?.includes('Ir a cobrar'));
    expect(contenidoVacio).toContain('Tu venta está vacía');
    expect(botonCobrar?.disabled).toBe(true);
    fixture.componentInstance.abrirCobro();
    const dialogosAbiertos = TestBed.inject(Dialog).openDialogs;
    expect(dialogosAbiertos).toHaveLength(0);
    fixture.destroy();
  });

  it('impide cerrar el diálogo con Escape o el fondo mientras se registra el cobro', async () => {
    // Abrir el diálogo real con una mutación que queda pendiente.
    const carrito = new CarritoVentaService();
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
    const estado = signal<EstadoRegistroVenta>({ tipo: 'listo' });
    let terminar!: () => void;
    const registrar = vi.fn(() => {
      estado.set({
        tipo: 'enviando',
        intento: {
          dto: {
            turnoId: 't1',
            almacenId: 'a1',
            detalles: [],
            pagos: [{ medio: 'efectivo', importe: '10.00' }],
          },
          clave: 'clave',
          usuarioId: 'u1',
        },
      });
      return new Promise<void>((resolve) => {
        terminar = resolve;
      });
    });
    TestBed.configureTestingModule({
      imports: [ResumenVenta],
      providers: [
        provideRouter([]),
        { provide: QueryClient, useValue: new QueryClient() },
        { provide: CarritoVentaService, useValue: carrito },
        {
          provide: PreparacionVentaService,
          useValue: { seleccion: () => ({ almacenId: 'a1', turnoId: 't1' }) },
        },
        {
          provide: RegistrarVentaAction,
          useValue: { estado, registrar, bloqueado: computed(() => estado().tipo === 'enviando') },
        },
      ],
    });
    TestBed.inject(AuthStore).setProfile({ id: 'u1', isSuperAdmin: true } as AuthPerfil);
    const fixture = TestBed.createComponent(ResumenVenta);
    fixture.detectChanges();
    fixture.componentInstance.abrirCobro();
    await TestBed.tick();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const dialogo = overlay.querySelector<HTMLElement>('[role="dialog"]')!;
    const monto = dialogo.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
    monto.value = '10.00';
    monto.dispatchEvent(new Event('input'));
    await TestBed.tick();
    const boton = Array.from(dialogo.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Registrar cobro'),
    )!;
    boton.click();
    await TestBed.tick();
    boton.click();

    // Ni Escape ni el fondo cierran la operación en curso.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    overlay.querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
    await TestBed.tick();
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    expect(dialogo.querySelector<HTMLButtonElement>('[data-dialog-cancel]')?.disabled).toBe(true);
    expect(registrar).toHaveBeenCalledOnce();

    // Resolver la operación antes de destruir los componentes de prueba.
    estado.set({ tipo: 'rechazado', error: new Error('Rechazado') });
    terminar();
    await TestBed.tick();
    TestBed.inject(Dialog).closeAll();
    fixture.destroy();
  });
});
