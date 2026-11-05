import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CatalogoApi } from '../../../../../api/ventas/catalogo/catalogo-api';
import { CatalogoProductos } from './catalogo-productos';

describe('CatalogoProductos', () => {
  it('consulta el almacén y usa la paginación compartida', async () => {
    // Preparar respuestas paginadas para el catálogo.
    const client = new QueryClient();
    const listar = vi.fn().mockImplementation(async ({ page }: { page: number }) => ({
      items: [
        {
          id: `p${page}`,
          nombre: `Producto ${page}`,
          precioDesde: '10.00',
          variantes: 1,
          stock: '3',
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
    expect(contenidoConError).toContain('No se pudieron cargar los productos');

    // Reintentar muestra el estado vacío al recuperar la conexión.
    const boton = fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
    boton.click();
    await vi.waitFor(() => expect(fixture.componentInstance.catalogo.isSuccess()).toBe(true));
    fixture.detectChanges();
    const contenidoVacio = fixture.nativeElement.textContent as string;
    expect(contenidoVacio).toContain('No se encontraron productos');
    fixture.destroy();
    client.clear();
  });
});
