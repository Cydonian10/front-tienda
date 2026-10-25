import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../../api/inventario/movimiento-api';
import type { HistorialMovimientoDetalle } from '../../../api/interfaces/inventario/historial-movimiento.interface';
import HistorialDetallePage from './historial-detalle-page';
import HistorialPage from './historial-page';

describe('HistorialDetallePage', () => {
  let client: QueryClient;
  const obtenerHistorial = vi.fn();
  const listarHistorial = vi.fn();
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const registro: HistorialMovimientoDetalle = {
    id, fecha: '2026-10-21T15:40:00Z', tipo: 'ingreso', estado: 'confirmado',
    almacenOrigen: null, almacenDestino: 'Principal', cantidadDetalles: 2, valorCosto: null,
    usuario: 'operador', compraId: 'compra-1', motivo: null,
    detalles: [
      { id: 'linea-1', producto: 'Tornillo', sku: 'TOR-1', cantidad: '2.500000',
        unidad: 'Caja', factorABase: '12.00000000', cantidadBase: '30.000000',
        costoTotal: null, costoAplicado: null },
      { id: 'linea-2', producto: 'Brocha', sku: 'BRO-1', cantidad: '1.000000',
        unidad: 'Unidad', factorABase: '1.00000000', cantidadBase: '1.000000',
        costoTotal: '5.000000', costoAplicado: '5.000000' },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    obtenerHistorial.mockResolvedValue(registro);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideRouter([
        { path: 'admin/inventario/historial', component: HistorialPage },
        { path: 'admin/inventario/historial/:id', component: HistorialDetallePage },
      ]),
      provideTanStackQuery(client),
      { provide: MovimientoApi, useValue: { obtenerHistorial, listarHistorial } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  async function mostrar(url = `/admin/inventario/historial/${id}?q=tornillo&tipo=ingreso&page=2&limit=5`) {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, HistorialDetallePage);
    await vi.waitFor(() => expect(page.movimiento.isPending()).toBe(false));
    harness.detectChanges();
    return { harness, page, element: harness.routeNativeElement! };
  }

  it('muestra líneas completas, costo y motivo nulos, compra sin enlace y regreso con filtros', async () => {
    const { element } = await mostrar();
    expect(obtenerHistorial).toHaveBeenCalledExactlyOnceWith(id);
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('30.000000');
    expect(element.textContent).toContain('No disponible');
    expect(element.textContent).toContain('compra-1');
    expect(element.querySelector('a[href*="compra-1"]')).toBeNull();
    expect(element.querySelector('ul[aria-label="Variantes incluidas en el movimiento"] li')).toBeTruthy();
    expect(element.querySelector('header a')?.getAttribute('href')).toBe(
      '/admin/inventario/historial?q=tornillo&tipo=ingreso&page=2&limit=5',
    );
    expect(element.textContent).not.toContain('Datos de demostración');
  });

  it.each([400, 404])('trata el HTTP %s como movimiento no encontrado', async (status) => {
    obtenerHistorial.mockRejectedValueOnce(new HttpErrorResponse({ status }));
    const { element } = await mostrar();
    expect(element.textContent).toContain('Movimiento no encontrado');
    expect(element.textContent).not.toContain('Reintentar');
    expect(element.querySelector('a[href*="q=tornillo"]')).toBeTruthy();
  });

  it('ofrece reintento para otros errores y conserva los filtros al volver', async () => {
    obtenerHistorial.mockRejectedValueOnce(new HttpErrorResponse({ status: 500 }));
    const { harness, page, element } = await mostrar();
    expect(element.textContent).toContain('No se pudo cargar el movimiento');
    const boton = [...element.querySelectorAll('button')].find((b) => b.textContent?.includes('Reintentar'))!;
    boton.click();
    await vi.waitFor(() => expect(page.movimiento.data()).toEqual(registro));
    harness.detectChanges();
    expect(element.textContent).toContain('Tornillo');
    listarHistorial.mockResolvedValue({ data: [], meta: { page: 2, limit: 5, total: 0, totalPages: 0 } });
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/historial?q=tornillo&tipo=ingreso&page=2&limit=5');
    expect(TestBed.inject(Router).url).toContain('page=2');
  });
});
