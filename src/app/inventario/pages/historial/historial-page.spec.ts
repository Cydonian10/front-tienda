import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../../api/inventario/movimiento-api';
import type { FiltroHistorialMovimientos, HistorialMovimientoResumen } from '../../../api/interfaces/inventario/historial-movimiento.interface';
import HistorialPage from './historial-page';

describe('HistorialPage', () => {
  let client: QueryClient;
  const listarHistorial = vi.fn();
  const fila: HistorialMovimientoResumen = {
    id: '550e8400-e29b-41d4-a716-446655440000', fecha: '2026-10-21T15:40:00Z',
    tipo: 'traslado', estado: 'confirmado', almacenOrigen: 'Principal',
    almacenDestino: 'Sucursal', cantidadDetalles: 3, valorCosto: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listarHistorial.mockImplementation((filtro: FiltroHistorialMovimientos) => Promise.resolve({
      data: [fila], meta: { page: filtro.page, limit: filtro.limit, total: 1, totalPages: 1 },
    }));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'admin/inventario/historial', component: HistorialPage }]),
      provideTanStackQuery(client), { provide: MovimientoApi, useValue: { listarHistorial } },
    ] });
  });

  afterEach(() => {
    delete document.documentElement.dataset['theme'];
    client.clear();
    TestBed.resetTestingModule();
  });

  async function mostrar(url = '/admin/inventario/historial') {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, HistorialPage);
    await vi.waitFor(() => expect(page.historial.data()).toBeDefined());
    harness.detectChanges();
    return { harness, page, element: harness.routeNativeElement! };
  }

  function cambiar(element: Element, value: string, tipo: 'input' | 'change') {
    (element as HTMLInputElement).value = value;
    element.dispatchEvent(new Event(tipo, { bubbles: true }));
  }

  it('presenta solo resúmenes reales, total remoto y variante contabilizada, también en móvil', async () => {
    const { element, harness } = await mostrar();
    expect(listarHistorial).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(1);
    expect(element.querySelector('table')?.textContent).toContain('3 variantes');
    expect(element.querySelector('table')?.textContent).toContain('No disponible');
    expect(element.textContent).toContain('1 resultado');
    expect(element.querySelector('ul[aria-label="Movimientos registrados"] li')).toBeTruthy();
    expect(element.textContent).not.toContain('Datos de demostración');
    for (const tema of ['ferreteria', 'light']) {
      document.documentElement.dataset['theme'] = tema;
      harness.detectChanges();
      expect(element.querySelector('.bg-base-100')).toBeTruthy();
      expect(element.querySelector('label[for="historial-busqueda"]')).toBeTruthy();
      expect(element.querySelector('label[for="historial-desde"]')).toBeTruthy();
    }
    const input = element.querySelector<HTMLInputElement>('#historial-busqueda')!;
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('normaliza URL inválida antes de consultar y mantiene los filtros válidos al abrir detalle', async () => {
    const { page, harness, element } = await mostrar(
      '/admin/inventario/historial?q=%20tornillo%20&tipo=traslado&desde=2026-02-29&hasta=2026-10-24&page=0&limit=7&extra=x',
    );
    expect(listarHistorial).toHaveBeenCalledWith({ q: 'tornillo', tipo: 'traslado', hasta: '2026-10-24', page: 1, limit: 20 });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe(
      '/admin/inventario/historial?q=tornillo&tipo=traslado&hasta=2026-10-24',
    ));
    harness.detectChanges();
    expect(page.desde()).toBe('');
    expect(element.querySelector('table tbody a')?.getAttribute('href')).toContain(
      `${fila.id}?q=tornillo&tipo=traslado&hasta=2026-10-24`,
    );
  });

  it('combina filtros, restablece página y difiere búsqueda; un carácter no se envía', async () => {
    const { page, harness, element } = await mostrar();
    page.cambiarPage(2);
    page.cambiarLimit(5);
    page.cambiarTipo('salida');
    page.cambiarDesde('2026-10-01');
    page.cambiarHasta('2026-10-24');
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledWith({
      tipo: 'salida', desde: '2026-10-01', hasta: '2026-10-24', page: 1, limit: 5,
    }));
    const busqueda = element.querySelector<HTMLInputElement>('#historial-busqueda')!;
    const antes = listarHistorial.mock.calls.length;
    cambiar(busqueda, 't', 'input');
    harness.detectChanges();
    expect(element.textContent).toContain('Escribe al menos 2 caracteres');
    expect(page.filtro()?.q).toBeUndefined();
    cambiar(busqueda, ' tor', 'input');
    harness.detectChanges();
    expect(listarHistorial).toHaveBeenCalledTimes(antes);
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledWith({
      q: 'tor', tipo: 'salida', desde: '2026-10-01', hasta: '2026-10-24', page: 1, limit: 5,
    }), { timeout: 2000 });
    expect(TestBed.inject(Router).url).toContain('q=tor');
  });

  it('no consulta con rango invertido y distingue vacío inicial, sin resultados y error recuperable', async () => {
    listarHistorial.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    const { page, element, harness } = await mostrar();
    expect(element.textContent).toContain('Todavía no hay movimientos');
    page.cambiarTipo('ajuste');
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledWith({ tipo: 'ajuste', page: 1, limit: 20 }));
    await vi.waitFor(() => expect(page.historial.data()?.meta.total).toBe(0));
    harness.detectChanges();
    expect(element.textContent).toContain('Sin coincidencias');
    page.cambiarDesde('2026-10-24');
    page.cambiarHasta('2026-10-01');
    harness.detectChanges();
    expect(page.filtro()).toBeNull();
    expect(element.textContent).toContain('La fecha «Desde»');
  });

  it('corrige una página superior a la última si hay resultados y actualiza la URL', async () => {
    const { page } = await mostrar('/admin/inventario/historial?page=9');
    await vi.waitFor(() => expect(page.page()).toBe(1));
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/inventario/historial'));
    expect(listarHistorial).toHaveBeenCalledWith({ page: 9, limit: 20 });
  });

  it('permite volver a una URL filtrada y restablece su estado navegable', async () => {
    const { page, harness } = await mostrar('/admin/inventario/historial?tipo=ingreso&limit=10');
    expect(page.tipo()).toBe('ingreso');
    await harness.navigateByUrl('/admin/inventario/historial?tipo=ajuste&desde=2026-10-01', HistorialPage);
    await vi.waitFor(() => expect(page.tipo()).toBe('ajuste'));
    expect(page.desde()).toBe('2026-10-01');
    await harness.navigateByUrl('/admin/inventario/historial?tipo=ingreso&limit=10', HistorialPage);
    await vi.waitFor(() => expect(page.tipo()).toBe('ingreso'));
    expect(page.desde()).toBe('');
    expect(page.limit()).toBe(10);
  });

  it('cambia tamaño desde la paginación compartida y resetea página', async () => {
    listarHistorial.mockImplementation((filtro: FiltroHistorialMovimientos) => Promise.resolve({
      data: [fila], meta: { page: filtro.page, limit: filtro.limit, total: 21, totalPages: Math.ceil(21 / filtro.limit) },
    }));
    const { harness, page, element } = await mostrar('/admin/inventario/historial?page=2&limit=10');
    const selector = element.querySelector<HTMLSelectElement>('select[aria-label="Elementos por página"]')!;
    cambiar(selector, '5', 'change');
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledWith({ page: 1, limit: 5 }));
    harness.detectChanges();
    expect(page.page()).toBe(1);
    expect(TestBed.inject(Router).url).toContain('limit=5');
    expect(TestBed.inject(Router).url).not.toContain('page=2');
  });

  it('ofrece reintento después de un error HTTP', async () => {
    listarHistorial.mockRejectedValueOnce(new Error('Fallo de red'));
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/inventario/historial', HistorialPage);
    await vi.waitFor(() => expect(page.historial.isError()).toBe(true));
    harness.detectChanges();
    const boton = [...harness.routeNativeElement!.querySelectorAll('button')].find((b) => b.textContent?.includes('Reintentar'))!;
    expect(boton).toBeTruthy();
    boton.click();
    await vi.waitFor(() => expect(page.historial.data()?.data).toEqual([fila]));
  });

  it('omite q de un carácter, recorta espacios y limita búsquedas a 200 caracteres', async () => {
    const { harness, page, element } = await mostrar('/admin/inventario/historial?q=x');
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/inventario/historial'));
    expect(listarHistorial).toHaveBeenCalledWith({ page: 1, limit: 20 });
    const busqueda = element.querySelector<HTMLInputElement>('#historial-busqueda')!;
    cambiar(busqueda, ' t ', 'input');
    harness.detectChanges();
    expect(element.textContent).toContain('Escribe al menos 2 caracteres');
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(page.filtro()?.q).toBeUndefined();
    const limite = 'x'.repeat(200);
    cambiar(busqueda, ` ${limite} `, 'input');
    harness.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(page.filtro()?.q).toBe(limite);
    expect(listarHistorial).toHaveBeenCalledWith({ q: limite, page: 1, limit: 20 });
  });

  it('bloquea el GET de un rango invertido en un enlace directo', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/historial?desde=2026-10-24&hasta=2026-10-01', HistorialPage,
    );
    harness.detectChanges();
    expect(page.filtro()).toBeNull();
    expect(listarHistorial).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.textContent).toContain('La fecha «Desde»');
  });
});
