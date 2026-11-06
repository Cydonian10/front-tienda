import { TestBed } from '@angular/core/testing';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { ResumenVenta } from './resumen-venta';

describe('ResumenVenta', () => {
  it('abre el cobro y valida efectivo y Yape sin registrar la venta', () => {
    // Preparar una venta y sustituir la apertura nativa del diálogo en jsdom.
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
    const dialogo = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    let aperturas = 0;
    dialogo.showModal = () => { aperturas++; };
    const botonCobrar = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((boton) => boton.textContent?.includes('Ir a cobrar'))!;
    botonCobrar.click();
    fixture.detectChanges();
    expect(aperturas).toBe(1);
    expect(dialogo.textContent).toContain('S/ 20.00');

    // En efectivo se valida el importe y se calcula el vuelto en centavos.
    const monto = dialogo.querySelector('#monto-cobro') as HTMLInputElement;
    monto.value = '19.99';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('El monto recibido debe cubrir el total.');
    monto.value = '25.50';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('S/ 5.50');

    // Los accesos rápidos sustituyen el monto y actualizan el vuelto.
    const montosRapidos = dialogo.querySelector('[aria-label="Montos rápidos de efectivo"]')!;
    const botonesRapidos = montosRapidos.querySelectorAll('button');
    botonesRapidos[2].click();
    fixture.detectChanges();
    expect(monto.value).toBe('50');
    expect(dialogo.textContent).toContain('S/ 30.00');
    botonesRapidos[0].click();
    fixture.detectChanges();
    expect(monto.value).toBe('20.00');
    expect(dialogo.textContent).toContain('S/ 0.00');

    // Yape comienza con el total exacto, admite edición y no muestra vuelto.
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
    const botonRegistro = Array.from(dialogo.querySelectorAll('button'))
      .find((boton) => boton.textContent?.includes('Registrar cobro'));
    expect(botonRegistro?.disabled).toBe(true);
    expect(carrito.lineas()).toHaveLength(1);
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
    fixture.destroy();
  });
});
