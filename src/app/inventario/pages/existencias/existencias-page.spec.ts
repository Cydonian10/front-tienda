import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../../api/inventario/existencia-api';
import ExistenciasPage, { promedio, soles } from './existencias-page';

describe('ExistenciasPage', () => {
  const listarAlmacenes = vi.fn();
  const listar = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    listarAlmacenes.mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    listar.mockImplementation(async (filtro: { almacenId: string; page: number }) => ({
      items: [],
      page: filtro.page,
      limit: 20,
      totalItems: 0,
      totalValorCosto: filtro.almacenId === 'todos' ? '120.000000' : '50.000000',
    }));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ExistenciaApi, useValue: { listarAlmacenes, listar } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('no pide saldos al entrar; requiere selección explícita y muestra el total del almacén', async () => {
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(listarAlmacenes).toHaveBeenCalledOnce());
    await vi.waitFor(() =>
      expect(fixture.componentInstance.almacenes.data()).toEqual([
        { id: 'a1', nombre: 'Principal' },
      ]),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.almacenId()).toBeNull();
    expect(listar).not.toHaveBeenCalled();
    const select = fixture.nativeElement.querySelector('#existencias-almacen') as HTMLSelectElement;
    expect(select.value).toBe('');

    select.value = 'a1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({ almacenId: 'a1', page: 1 })),
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.totalValorCosto).toBe('50.000000'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 50.00');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Valor del inventario a costo"]')
        .textContent,
    ).toContain('Principal');
    const total = fixture.nativeElement.querySelector(
      '[aria-label="Valor del inventario a costo"]',
    ) as HTMLElement;
    const filtros = fixture.nativeElement.querySelector('#filtros-existencias-title')
      .parentElement as HTMLElement;
    expect(total.compareDocumentPosition(filtros) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);

    fixture.componentInstance.page.set(2);
    fixture.componentInstance.elegirAlmacen('todos');
    expect(fixture.componentInstance.page()).toBe(1);
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({ almacenId: 'todos', page: 1 })),
    );
  });

  it('distingue la ausencia de almacenes de la ausencia de filas sin pedir saldos', async () => {
    listarAlmacenes.mockResolvedValue([]);
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()).toEqual([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay almacenes activos');
    expect(listar).not.toHaveBeenCalled();
  });

  it('formatea PEN a dos decimales sin convertir cadenas monetarias a number', () => {
    expect(soles('123456789012345678.125000')).toContain('123,456,789,012,345,678.13');
    expect(soles('0.000000')).toBe('S/ 0.00');
    expect(promedio(null)).toBe('—');
    expect(promedio('0.123457')).toBe('S/ 0.12');
    expect(promedio('0.125000')).toBe('S/ 0.13');
    expect(promedio('12.999999')).toBe('S/ 13.00');
  });

  it('filtra búsqueda y disponibilidad, reinicia página y conserva el total del almacén', async () => {
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    const page = fixture.componentInstance;
    page.elegirAlmacen('a1');
    page.page.set(3);
    page.searchDraft.set('Tornillo');
    page.buscar(new Event('submit'));
    expect(page.page()).toBe(1);
    expect(page.filtro()?.q).toBe('Tornillo');

    page.page.set(2);
    page.elegirDisponibilidad('sin_stock');
    expect(page.page()).toBe(1);
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(
        expect.objectContaining({
          almacenId: 'a1',
          q: 'Tornillo',
          disponibilidad: 'sin_stock',
          page: 1,
        }),
      ),
    );
    await vi.waitFor(() => expect(page.existencias.data()?.totalValorCosto).toBe('50.000000'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 50.00');
    expect(fixture.nativeElement.textContent).toContain('No hay resultados para estos filtros');

    page.limpiarFiltros();
    expect(page.filtro()).toMatchObject({
      q: '',
      disponibilidad: 'todas',
      page: 1,
    });
  });

  it('identifica variantes inactivas con saldo y muestra el valor del almacén, no la suma de filas', async () => {
    listar.mockResolvedValue({
      items: [
        {
          producto: {
            id: 'p1',
            nombre: 'Tornillo',
            activo: false,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
          },
          variante: { id: 'v1', sku: 'TOR-M8', activo: false, valores: [], precioVenta: '12.00' },
          almacen: { id: 'a1', nombre: 'Principal' },
          cantidadBase: '3.120000',
          valorCosto: '6.000000',
          costoPromedioBase: '2.000000',
          costoRegistradoCero: false,
          unidadesSecundarias: [],
        },
      ],
      page: 1,
      limit: 20,
      totalItems: 1,
      totalValorCosto: '500.000000',
    });
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    fixture.componentInstance.elegirAlmacen('a1');
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.items.length).toBe(1),
    );
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Inactivo con stock');
    expect(text).toContain('S/ 500.00');
    expect(text).toContain('3.12 u');
  });

  it('cambia la presentación por fila sin alterar el saldo base, el valor ni solicitar nuevos datos', async () => {
    listar.mockResolvedValue({
      items: [
        {
          producto: {
            id: 'p1',
            nombre: 'Tornillo',
            activo: true,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
          },
          variante: { id: 'v1', sku: 'TOR-M8', activo: true, valores: [], precioVenta: '12.00' },
          almacen: { id: 'a1', nombre: 'Principal' },
          cantidadBase: '25.000000',
          valorCosto: '75.000000',
          costoPromedioBase: '3.000000',
          costoRegistradoCero: false,
          unidadesSecundarias: [
            { id: 'caja', nombre: 'Caja', simbolo: 'cja', factorABase: '12.00000000' },
          ],
        },
      ],
      page: 1,
      limit: 20,
      totalItems: 1,
      totalValorCosto: '900.000000',
    });
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    fixture.componentInstance.elegirAlmacen('a1');
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.items.length).toBe(1),
    );
    fixture.detectChanges();
    const original = fixture.componentInstance.existencias.data();
    const select = fixture.nativeElement.querySelector(
      'app-existencia-unidad select',
    ) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.options[1].textContent).toContain('× 12');
    expect(select.options[1].textContent).not.toContain('12.00000000');

    select.value = 'caja';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2 cajas + 1 unidad base');
    expect(text).toContain('25 u');
    expect(text).toContain('S/ 900.00');
    expect(fixture.componentInstance.existencias.data()).toBe(original);
    expect(listar).toHaveBeenCalledOnce();
    expect(
      (
        fixture.nativeElement.querySelectorAll(
          'app-existencia-unidad select',
        )[1] as HTMLSelectElement
      ).value,
    ).toBe('caja');

    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('2 cajas + 1 unidad base');
    expect(fixture.nativeElement.textContent).toContain('25 u');
  });

  it('muestra saldos sin stock y costo cero por separado del precio de venta en escritorio y móvil', async () => {
    listar.mockResolvedValue({
      items: [
        {
          producto: {
            id: 'p1',
            nombre: 'Tuerca',
            activo: true,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
          },
          variante: { id: 'v1', sku: 'TUE-1', activo: true, valores: [], precioVenta: '9.500000' },
          almacen: { id: 'a1', nombre: 'Principal' },
          cantidadBase: '0.000000',
          valorCosto: '0.000000',
          costoPromedioBase: null,
          costoRegistradoCero: false,
          unidadesSecundarias: [],
        },
        {
          producto: {
            id: 'p2',
            nombre: 'Perno',
            activo: true,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
          },
          variante: { id: 'v2', sku: 'PER-1', activo: true, valores: [], precioVenta: '8.000000' },
          almacen: { id: 'a1', nombre: 'Principal' },
          cantidadBase: '5.000000',
          valorCosto: '0.000000',
          costoPromedioBase: '0.000000',
          costoRegistradoCero: true,
          unidadesSecundarias: [],
        },
      ],
      page: 1,
      limit: 20,
      totalItems: 2,
      totalValorCosto: '0.000000',
    });
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    fixture.componentInstance.elegirAlmacen('a1');
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.items.length).toBe(2),
    );
    fixture.detectChanges();

    const desktopRows = fixture.nativeElement.querySelectorAll(
      'tbody tr',
    ) as NodeListOf<HTMLElement>;
    const mobileRows = fixture.nativeElement.querySelectorAll(
      'ul[aria-label="Saldos de existencias"] li',
    ) as NodeListOf<HTMLElement>;
    expect(desktopRows).toHaveLength(2);
    expect(mobileRows).toHaveLength(2);
    for (const rows of [desktopRows, mobileRows]) {
      expect(rows[0].textContent).toContain('—');
      expect(rows[0].textContent).toContain('S/ 9.50');
      expect(rows[1].textContent).toContain('Costo registrado en cero');
      expect(rows[1].textContent).toContain('S/ 0.00');
      expect(rows[1].textContent).toContain('S/ 8.00');
    }
    expect(fixture.nativeElement.textContent).toContain('Valor del inventario a costo · PEN');
  });

  it('distingue la carga y el error de almacenes y permite reintentar', async () => {
    let fail!: (error: Error) => void;
    listarAlmacenes.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando almacenes');
    expect(listar).not.toHaveBeenCalled();
    fail(new Error('sin conexión'));
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#existencias-almacen')).toBeNull();
    const reintentar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Reintentar'))!;
    reintentar.click();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    expect(listarAlmacenes).toHaveBeenCalledTimes(2);
    expect(listar).not.toHaveBeenCalled();
  });

  it('muestra carga, error y reintento del listado para el almacén elegido', async () => {
    let fail!: (error: Error) => void;
    listar.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    fixture.componentInstance.elegirAlmacen('a1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando existencias');
    expect(fixture.nativeElement.querySelector('#filtros-existencias-title')).not.toBeNull();
    fail(new Error('sin conexión'));
    await vi.waitFor(() => expect(fixture.componentInstance.existencias.isError()).toBe(true));
    fixture.detectChanges();
    const reintentar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Reintentar'))!;
    reintentar.click();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.totalValorCosto).toBe('50.000000'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 50.00');
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('permite recorrer y usar con teclado los controles de alcance, búsqueda y disponibilidad', async () => {
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()?.length).toBe(1));
    fixture.detectChanges();
    const almacen = fixture.nativeElement.querySelector(
      '#existencias-almacen',
    ) as HTMLSelectElement;
    expect(almacen.labels?.[0]?.textContent).toContain('Almacén');
    almacen.value = 'todos';
    almacen.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.totalValorCosto).toBe('120.000000'),
    );
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('#existencias-busqueda') as HTMLInputElement;
    const disponibilidad = fixture.nativeElement.querySelector(
      '#existencias-disponibilidad',
    ) as HTMLSelectElement;
    expect(search.labels?.[0]?.textContent).toContain('Producto o SKU');
    expect(disponibilidad.labels?.[0]?.textContent).toContain('Disponibilidad');
    search.value = 'Tuerca';
    search.dispatchEvent(new Event('input'));
    search.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    disponibilidad.value = 'con_stock';
    disponibilidad.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(
        expect.objectContaining({
          almacenId: 'todos',
          q: 'Tuerca',
          disponibilidad: 'con_stock',
        }),
      ),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 120.00');
  });
});
