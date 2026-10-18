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

  it('formatea PEN sin convertir cadenas monetarias a number y conserva seis decimales del promedio', () => {
    expect(soles('123456789012345678.125000')).toContain('123,456,789,012,345,678.13');
    expect(soles('0.000000')).toBe('S/ 0.00');
    expect(promedio(null)).toBe('—');
    expect(promedio('0.123457')).toBe('S/ 0.123457');
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
          cantidadBase: '3.000000',
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
    expect(text).toContain('3.000000 u');
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

    select.value = 'caja';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2 cajas + 1 unidad base');
    expect(text).toContain('25.000000 u');
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
    expect(fixture.nativeElement.textContent).toContain('25.000000 u');
  });
});
