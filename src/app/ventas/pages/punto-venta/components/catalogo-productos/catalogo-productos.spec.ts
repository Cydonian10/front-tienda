import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CatalogoApi } from '../../../../../api/ventas/catalogo/catalogo-api';
import { CatalogoProductos } from './catalogo-productos';
import { CarritoVentaService } from '../../carrito-venta.service';

describe('CatalogoProductos', () => {
  it('abre el modal y agrega la unidad elegida al carrito de la página', async () => {
    // Preparar una variante con unidades y un carrito propio del componente.
    const client = new QueryClient();
    const carrito = new CarritoVentaService();
    const variante = {
      id: 'v1', productoId: 'p1', nombre: 'Tornillo', sku: 'TOR', precio: '0.50', stock: '30', atributos: [],
      unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
      unidades: [{ id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' }, { id: 'u2', nombre: 'Caja', simbolo: 'caja', factorABase: '12' }],
    };
    TestBed.configureTestingModule({
      imports: [CatalogoProductos],
      providers: [provideTanStackQuery(client), { provide: CatalogoApi, useValue: { list: vi.fn().mockResolvedValue({ items: [variante], page: 1, limit: 5, totalItems: 1 }) } }],
    });
    TestBed.overrideComponent(CatalogoProductos, { add: { providers: [{ provide: CarritoVentaService, useValue: carrito }] } });
    const fixture = TestBed.createComponent(CatalogoProductos);
    fixture.componentRef.setInput('almacenId', 'a1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isSuccess()).toBe(true));
    fixture.detectChanges();

    // Elegir cajas, introducir una cantidad y confirmar en el diálogo.
    (fixture.nativeElement.querySelector('article button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialogo = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialogo.textContent).toContain('Tornillo');
    const unidad = dialogo.querySelector('select') as HTMLSelectElement;
    unidad.value = 'u2';
    unidad.dispatchEvent(new Event('change'));
    const cantidad = dialogo.querySelector('input') as HTMLInputElement;
    cantidad.value = '3';
    cantidad.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const errorStock = dialogo.textContent;
    const confirmar = dialogo.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(errorStock).toContain('supera el stock');
    expect(confirmar.disabled).toBe(true);
    expect(carrito.lineas()).toHaveLength(0);
    cantidad.value = '2';
    cantidad.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const formulario = dialogo.querySelector('form') as HTMLFormElement;
    formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    const lineas = carrito.lineas();
    expect(lineas).toHaveLength(1);
    expect(lineas[0].cantidad).toBe('2');
    expect(lineas[0].subtotalCentavos).toBe(1200n);
    fixture.destroy();
    client.clear();
  });
  it('muestra una tarjeta por variante aunque pertenezcan al mismo producto', async () => {
    // Preparar dos variantes con precio y stock independientes.
    const client = new QueryClient();
    const listar = vi.fn().mockResolvedValue({
      items: [
        { id: 'v1', productoId: 'p1', nombre: 'Martillo', sku: 'MAR-16', precio: '10.00', stock: '3', atributos: [{ nombre: 'Peso', valor: '16 oz' }] },
        { id: 'v2', productoId: 'p1', nombre: 'Martillo', sku: 'MAR-20', precio: '12.00', stock: '0', atributos: [{ nombre: 'Peso', valor: '20 oz' }] },
      ],
      page: 1, limit: 5, totalItems: 2,
    });
    TestBed.configureTestingModule({
      imports: [CatalogoProductos],
      providers: [provideTanStackQuery(client), { provide: CatalogoApi, useValue: { list: listar } }],
    });
    const fixture = TestBed.createComponent(CatalogoProductos);
    fixture.componentRef.setInput('almacenId', 'almacen-1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isSuccess()).toBe(true));
    fixture.detectChanges();

    // Comprobar que cada variante conserva su identidad, atributos y precio.
    const tarjetas = Array.from(fixture.nativeElement.querySelectorAll('article')) as HTMLElement[];
    const primeraTarjeta = tarjetas[0].textContent;
    const segundaTarjeta = tarjetas[1].textContent;
    expect(tarjetas).toHaveLength(2);
    expect(primeraTarjeta).toContain('16 oz');
    expect(primeraTarjeta).toContain('MAR-16');
    expect(primeraTarjeta).toContain('10.00');
    expect(segundaTarjeta).toContain('20 oz');
    expect(segundaTarjeta).toContain('MAR-20');
    expect(segundaTarjeta).toContain('12.00');
    expect(segundaTarjeta).toContain('Stock (unidad base): 0');
    fixture.destroy();
    client.clear();
  });

  it('consulta el almacén y usa la paginación compartida', async () => {
    // Preparar respuestas paginadas para el catálogo.
    const client = new QueryClient();
    const listar = vi.fn().mockImplementation(async ({ page }: { page: number }) => ({
      items: [
        {
          id: `p${page}`,
          productoId: 'producto-1',
          nombre: `Producto ${page}`,
          sku: `SKU-${page}`,
          precio: '10.00',
          stock: '3',
          atributos: [{ nombre: 'Tamaño', valor: `${page} pulgadas` }],
        },
      ],
      page,
      limit: 5,
      totalItems: 6,
    }));
    TestBed.configureTestingModule({
      imports: [CatalogoProductos],
      providers: [
        provideTanStackQuery(client),
        { provide: CatalogoApi, useValue: { list: listar } },
      ],
    });
    const fixture = TestBed.createComponent(CatalogoProductos);
    fixture.componentRef.setInput('almacenId', 'almacen-1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isSuccess()).toBe(true));
    fixture.detectChanges();
    const contenidoInicial = fixture.nativeElement.textContent as string;
    expect(contenidoInicial).toContain('Producto 1');
    expect(contenidoInicial).toContain('SKU-1');
    expect(contenidoInicial).toContain('Tamaño: 1 pulgadas');
    expect(contenidoInicial).toContain('S/ 10.00');
    expect(listar).toHaveBeenCalledWith({ almacenId: 'almacen-1', q: '', page: 1, limit: 5 });

    // Navegar a la segunda página mediante el componente compartido.
    const siguiente = fixture.nativeElement.querySelector(
      '[aria-label="Página siguiente"]',
    ) as HTMLButtonElement;
    siguiente.click();
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith({ almacenId: 'almacen-1', q: '', page: 2, limit: 5 }),
    );
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.data()?.page).toBe(2));
    fixture.detectChanges();
    const contenidoPaginaDos = fixture.nativeElement.textContent as string;
    expect(contenidoPaginaDos).toContain('Producto 2');

    // Escribir varias letras no consulta hasta que se aplique el término completo.
    const busqueda = fixture.nativeElement.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;
    for (const texto of ['m', 'mar', 'martillo']) {
      busqueda.value = texto;
      busqueda.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
    const consultasAntesDelDebounce = listar.mock.calls.length;
    expect(consultasAntesDelDebounce).toBe(2);
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith({
        almacenId: 'almacen-1',
        q: 'martillo',
        page: 1,
        limit: 5,
      }),
    );
    const filtrosConsultados = listar.mock.calls.map(([filtros]) => filtros);
    expect(filtrosConsultados).toHaveLength(3);
    expect(filtrosConsultados[2]).toEqual({
      almacenId: 'almacen-1',
      q: 'martillo',
      page: 1,
      limit: 5,
    });
    fixture.destroy();
    client.clear();
  });

  it('muestra el error y permite reintentar la consulta', async () => {
    // Preparar un fallo seguido de una respuesta vacía.
    const client = new QueryClient();
    const listar = vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue({
      items: [],
      page: 1,
      limit: 5,
      totalItems: 0,
    });
    TestBed.configureTestingModule({
      imports: [CatalogoProductos],
      providers: [
        provideTanStackQuery(client),
        { provide: CatalogoApi, useValue: { list: listar } },
      ],
    });
    const fixture = TestBed.createComponent(CatalogoProductos);
    fixture.componentRef.setInput('almacenId', 'almacen-1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isError()).toBe(true));
    fixture.detectChanges();
    const contenidoConError = fixture.nativeElement.textContent as string;
    expect(contenidoConError).toContain('No se pudieron cargar las variantes');

    // Reintentar muestra el estado vacío al recuperar la conexión.
    const boton = fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
    boton.click();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isSuccess()).toBe(true));
    fixture.detectChanges();
    const contenidoVacio = fixture.nativeElement.textContent as string;
    expect(contenidoVacio).toContain('No se encontraron variantes');
    fixture.destroy();
    client.clear();
  });
});
