import { Dialog } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { ResumenVenta } from './resumen-venta';

describe('ResumenVenta', () => {
  it('abre el diálogo compartido y lo cierra sin modificar el carrito', async () => {
    // Preparar una venta para abrir el diálogo desde el resumen.
    const carrito = new CarritoVentaService();
    const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
    carrito.agregar({
      id: 'v1', productoId: 'p1', nombre: 'Martillo', marca: 'Stanley', sku: 'MAR',
      precio: '10.00', stock: '3', atributos: [], unidadBase: unidad, unidades: [unidad],
    }, unidad, '2');
    TestBed.configureTestingModule({
      imports: [ResumenVenta],
      providers: [{ provide: CarritoVentaService, useValue: carrito }],
    });
    const fixture = TestBed.createComponent(ResumenVenta);
    fixture.detectChanges();
    const botonCobrar = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((boton) => boton.textContent?.includes('Ir a cobrar'))!;
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
    const montoReabierto = dialogoReabierto.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
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
    const marcaEnResumen = fixture.nativeElement.querySelector('[title="Marca: Stanley"]') as HTMLElement;
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
});
