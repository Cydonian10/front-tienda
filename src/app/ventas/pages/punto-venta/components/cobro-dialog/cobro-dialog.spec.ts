import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { CobroDialog } from './cobro-dialog';

describe('CobroDialog', () => {
  it('valida efectivo y Yape, calcula el vuelto y mantiene deshabilitado el registro', () => {
    // Preparar un carrito con un total de veinte soles.
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
      imports: [CobroDialog],
      providers: [
        { provide: CarritoVentaService, useValue: carrito },
        { provide: DialogRef, useValue: { id: 'cobro-prueba', close: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(CobroDialog);
    fixture.detectChanges();
    const dialogo = fixture.nativeElement as HTMLElement;
    const monto = dialogo.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;

    // El efectivo insuficiente muestra un error y el importe suficiente calcula el vuelto.
    monto.value = '19.99';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const errorEfectivo = dialogo.querySelector('[role="alert"]');
    expect(errorEfectivo?.textContent).toContain('El monto recibido debe cubrir el total.');
    expect(monto.getAttribute('aria-describedby')).toBe(errorEfectivo?.id);
    monto.value = '25.50';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('S/ 5.50');

    // Los montos rápidos actualizan el campo y el vuelto.
    const botonesRapidos = dialogo.querySelectorAll<HTMLButtonElement>(
      '[aria-label="Montos rápidos de efectivo"] button',
    );
    botonesRapidos[2].click();
    fixture.detectChanges();
    expect(monto.value).toBe('50');
    expect(dialogo.textContent).toContain('S/ 30.00');
    botonesRapidos[0].click();
    fixture.detectChanges();
    expect(monto.value).toBe('20.00');
    expect(dialogo.textContent).toContain('S/ 0.00');

    // Yape usa el importe exacto, no muestra vuelto y valida las modificaciones.
    const yape = dialogo.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1];
    yape.click();
    fixture.detectChanges();
    expect(monto.value).toBe('20.00');
    expect(dialogo.textContent).not.toContain('Vuelto');
    expect(dialogo.querySelector('[aria-label="Montos rápidos de efectivo"]')).toBeNull();
    monto.value = '20.01';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('El monto de Yape debe ser igual al total.');
    monto.value = '20.001';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('Ingresa un monto válido');
    const botonRegistro = Array.from(dialogo.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Registrar cobro'),
    );
    expect(botonRegistro?.disabled).toBe(true);
    expect(carrito.lineas()).toHaveLength(1);
    fixture.destroy();
  });
});
