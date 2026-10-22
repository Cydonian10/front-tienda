import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../../../api/inventario/movimiento-api';
import type { VarianteMovimiento } from '../../../../api/interfaces/inventario/movimiento.interface';
import { nuevaFilaMovimiento } from '../movimiento-form.model';
import { DetalleMovimiento, equivalenciaBase } from './detalle-movimiento';

describe('DetalleMovimiento', () => {
  let client: QueryClient;
  const buscarVariantes = vi.fn();
  const variant: VarianteMovimiento = {
    producto: { id: 'p1', nombre: 'Tornillo M8', activo: true },
    variante: { id: 'v1', sku: 'TOR-M8', activo: true },
    cantidadBase: '15.000000',
    unidades: [
      { id: 'u1', nombre: 'Unidad', simbolo: 'und', factorABase: '1' },
      { id: 'u2', nombre: 'Caja', simbolo: 'caja', factorABase: '12.50000000' },
    ],
  };
  const response = (items: VarianteMovimiento[], page = 1, totalPages = 1) => ({
    data: items,
    meta: { page, limit: 20, total: totalPages * 20, totalPages },
  });

  beforeEach(() => {
    vi.resetAllMocks();
    buscarVariantes.mockResolvedValue(response([variant]));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: MovimientoApi, useValue: { buscarVariantes } },
      ],
    });
  });
  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  function create(tipo: 'salida' | 'traslado' | 'ajuste' = 'salida') {
    const fixture = TestBed.createComponent(DetalleMovimiento);
    fixture.componentRef.setInput('fila', nuevaFilaMovimiento(1));
    fixture.componentRef.setInput('indice', 0);
    fixture.componentRef.setInput('tipo', tipo);
    fixture.componentRef.setInput('origen', 'almacen-1');
    fixture.componentRef.setInput('variantesSeleccionadas', []);
    fixture.detectChanges();
    return fixture;
  }

  it('distingue espera de búsqueda, carga, vacío y error con reintento', async () => {
    let resolve!: (result: ReturnType<typeof response>) => void;
    buscarVariantes.mockImplementationOnce(() => new Promise((callback) => { resolve = callback; }));
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('Escribe al menos dos caracteres');
    expect(buscarVariantes).not.toHaveBeenCalled();
    fixture.componentInstance.buscar('to');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Buscando variantes');
    resolve(response([]));
    await vi.waitFor(() => expect(fixture.componentInstance.consulta.isSuccess()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron variantes');

    buscarVariantes.mockRejectedValueOnce(new Error('Sin conexión'));
    fixture.componentInstance.buscar('tu');
    await vi.waitFor(() => expect(fixture.componentInstance.consulta.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo buscar variantes');
    (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(fixture.componentInstance.consulta.isSuccess()).toBe(true));
    expect(buscarVariantes).toHaveBeenCalledTimes(3);
  });

  it('consulta por tipo y almacén y acumula páginas sin duplicar opciones', async () => {
    buscarVariantes.mockImplementation(({ page }) => Promise.resolve(response([variant], page, 2)));
    const fixture = create('traslado');
    fixture.componentInstance.buscar('TOR');
    await vi.waitFor(() => expect(fixture.componentInstance.opciones()).toHaveLength(1));
    fixture.detectChanges();
    expect(fixture.componentInstance.puedeCargarMas()).toBe(true);
    fixture.componentInstance.cargarMas();
    await vi.waitFor(() => expect(buscarVariantes).toHaveBeenCalledWith({
      tipo: 'traslado', almacenId: 'almacen-1', q: 'TOR', page: 2, limit: 20,
    }));
    await vi.waitFor(() => expect(fixture.componentInstance.pagina()).toBe(2));
    expect(fixture.componentInstance.opciones()).toHaveLength(1);
  });

  it('selecciona con teclado, usa unidades reales y muestra saldo y equivalencia exacta', async () => {
    const fixture = create();
    const changes = vi.fn();
    fixture.componentInstance.cambio.subscribe(changes);
    fixture.componentInstance.buscar('TOR');
    await vi.waitFor(() => expect(fixture.componentInstance.opciones()).toHaveLength(1));
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLInputElement;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(search.getAttribute('aria-activedescendant')).toBe('opcion-1-0');
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(changes).toHaveBeenCalledWith(expect.objectContaining({ varianteId: 'v1', unidadId: 'u1' }));
    fixture.componentRef.setInput('fila', { ...nuevaFilaMovimiento(1), varianteId: 'v1', unidadId: 'u2', cantidad: '1.2' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#unidad-1').options[2].textContent).toContain('12.50000000');
    expect(fixture.nativeElement.textContent).toContain('15.000000 und');
    expect(fixture.nativeElement.textContent).toContain('Equivalencia: 15 und');
  });

  it('permite recorrer hacia arriba y cerrar la lista con Escape', async () => {
    const fixture = create();
    fixture.componentInstance.buscar('TOR');
    await vi.waitFor(() => expect(fixture.componentInstance.opciones()).toHaveLength(1));
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLInputElement;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(fixture.componentInstance.indiceActivo()).toBe(0);
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(search.getAttribute('aria-expanded')).toBe('false');
  });

  it('bloquea variantes repetidas y restringe inactivas según la operación', async () => {
    const inactive = {
      ...variant,
      producto: { ...variant.producto, activo: false },
      variante: { ...variant.variante, activo: false },
    };
    buscarVariantes.mockResolvedValue(response([inactive]));
    const fixture = create('ajuste');
    fixture.componentInstance.buscar('TOR');
    await vi.waitFor(() => expect(fixture.componentInstance.opciones()).toHaveLength(1));
    expect(fixture.componentInstance.disponible(inactive)).toBe(false);
    fixture.componentRef.setInput('variantesSeleccionadas', ['v1']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="option"] button').disabled).toBe(true);
    fixture.componentRef.setInput('variantesSeleccionadas', []);
    fixture.componentRef.setInput('fila', { ...nuevaFilaMovimiento(1), cantidad: '-2' });
    fixture.detectChanges();
    expect(fixture.componentInstance.disponible(inactive)).toBe(true);
    fixture.componentRef.setInput('tipo', 'salida');
    fixture.detectChanges();
    expect(fixture.componentInstance.disponible(inactive)).toBe(true);
    fixture.componentRef.setInput('tipo', 'traslado');
    fixture.detectChanges();
    expect(fixture.componentInstance.disponible(inactive)).toBe(false);
  });

  it('exige costo base solo para ajuste positivo y descarta costo al pasar a negativo', () => {
    const fixture = create('ajuste');
    fixture.componentRef.setInput('fila', { ...nuevaFilaMovimiento(1), cantidad: '1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#costo-1').required).toBe(true);
    const changes = vi.fn();
    fixture.componentInstance.cambio.subscribe(changes);
    fixture.componentRef.setInput('fila', { ...nuevaFilaMovimiento(1), cantidad: '1', costoUnitarioBase: '0' });
    fixture.detectChanges();
    fixture.componentInstance.actualizar('cantidad', '-1');
    expect(changes).toHaveBeenCalledWith(expect.objectContaining({ cantidad: '-1', costoUnitarioBase: '' }));
    fixture.componentRef.setInput('fila', { ...nuevaFilaMovimiento(1), cantidad: '-1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#costo-1')).toBeNull();
  });

  it('limpia el selector al cambiar el almacén de origen', async () => {
    const fixture = create();
    fixture.componentInstance.buscar('TOR');
    await vi.waitFor(() => expect(fixture.componentInstance.opciones()).toHaveLength(1));
    fixture.componentRef.setInput('origen', 'almacen-2');
    fixture.detectChanges();
    expect(fixture.componentInstance.busqueda()).toBe('');
    expect(fixture.componentInstance.opciones()).toEqual([]);
  });

  it('conserva precisión decimal y rechaza equivalencias no representables', () => {
    expect(equivalenciaBase('1.2', '12.50000000')).toBe('15');
    expect(equivalenciaBase('-0.5', '12.50000000')).toBe('-6.25');
    expect(equivalenciaBase('1', '0.33333333')).toBeNull();
  });
});
