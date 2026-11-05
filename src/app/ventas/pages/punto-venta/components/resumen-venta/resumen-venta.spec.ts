import { TestBed } from '@angular/core/testing';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { ResumenVenta } from './resumen-venta';

describe('ResumenVenta', () => {
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
    fixture.destroy();
  });
});
