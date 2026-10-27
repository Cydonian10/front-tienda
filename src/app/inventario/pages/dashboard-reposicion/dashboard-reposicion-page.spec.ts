import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CompraApi } from '../../../api/inventario/compra-api';
import { ExistenciaApi } from '../../../api/inventario/existencia-api';
import { MovimientoApi } from '../../../api/inventario/movimiento-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';
import routes from '../../inventario.routes';
import DashboardReposicionPage, { diasActividad, rangoValido } from './dashboard-reposicion-page';

@Component({ template: '' })
class EmptyPage {}

describe('dashboard de reposición', () => {
  const listarExistencias = vi.fn();
  const listarMovimientos = vi.fn();
  const stock = vi.fn();
  const compras = vi.fn();
  const salidas = vi.fn();
  const almacenes = [{ id: 'a1', nombre: 'Principal' }, { id: 'a2', nombre: 'Secundario' }];
  beforeEach(() => {
    vi.resetAllMocks();
    listarExistencias.mockResolvedValue(almacenes);
    listarMovimientos.mockResolvedValue(almacenes);
    stock.mockResolvedValue({ bajoMinimo: 2, agotadas: 1, alertas: [] });
    compras.mockResolvedValue({ total: 3, porDia: [], recientes: [] });
    salidas.mockResolvedValue({ total: 4, porDia: [], recientes: [] });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      provideRouter([
        { path: 'admin', component: EmptyPage },
        { path: 'auth/login', component: EmptyPage },
        { path: 'admin/inventario', children: routes },
      ]),
      { provide: ExistenciaApi, useValue: { listarAlmacenes: listarExistencias, resumenReposicion: stock } },
      { provide: CompraApi, useValue: { resumenInventario: compras } },
      { provide: MovimientoApi, useValue: { listarAlmacenes: listarMovimientos, resumenSalidas: salidas } },
      { provide: AuthSessionService, useValue: { get: () => ({ accessToken: 'token' }) } },
      { provide: AuthProfileService, useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() } },
    ] });
  });
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: codes.map((code) => ({ code, systemCode: 'INVENTARIO' })) } as never);
  }

  it('permite solo compras sin cargar ni seleccionar almacenes', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?desde=2026-10-01&hasta=2026-10-30');
    const page = await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    await vi.waitFor(() => expect(compras).toHaveBeenCalledWith({ desde: '2026-10-01', hasta: '2026-10-30' }));
    expect(page.almacenId()).toBeNull();
    expect(listarExistencias).not.toHaveBeenCalled();
    expect(listarMovimientos).not.toHaveBeenCalled();
    expect(stock).not.toHaveBeenCalled();
    expect(salidas).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).not.toContain('almacenId');
    expect(harness.routeNativeElement?.textContent).toContain('Todos los almacenes');
  });

  it('elige el primero en orden de creación y conserva fechas al cambiar de almacén', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ, PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?desde=2026-10-01&hasta=2026-10-30');
    const page = await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    await vi.waitFor(() => expect(page.almacenId()).toBe('a1'));
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toContain('almacenId=a1'));
    expect(listarMovimientos).not.toHaveBeenCalled();
    expect(stock).toHaveBeenCalledWith('a1');
    expect(salidas).toHaveBeenCalledWith('a1', { desde: '2026-10-01', hasta: '2026-10-30' });
    page.cambiarAlmacen('a2');
    await vi.waitFor(() => expect(page.almacenId()).toBe('a2'));
    expect(TestBed.inject(Router).url).toContain('desde=2026-10-01');
    expect(TestBed.inject(Router).url).toContain('hasta=2026-10-30');
    expect(compras).toHaveBeenCalledTimes(1);
  });

  it('permite movimientos sin existencias usando solo su listado de almacenes', async () => {
    grant(PERMISSION_CODES.MOVIMIENTOS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?almacenId=a2&desde=2026-10-01&hasta=2026-10-30');
    const page = await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    await vi.waitFor(() => expect(salidas).toHaveBeenCalledWith('a2', { desde: '2026-10-01', hasta: '2026-10-30' }));
    expect(page.almacenId()).toBe('a2');
    expect(listarExistencias).not.toHaveBeenCalled();
    expect(stock).not.toHaveBeenCalled();
    expect(compras).not.toHaveBeenCalled();
  });

  it('no consulta fechas inválidas o invertidas y evita exponer consultas fallidas como cero', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?desde=2026-02-30&hasta=2026-02-01');
    const page = await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    expect(page.fechaError()).toContain('rango');
    expect(compras).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando compras');
    expect(rangoValido('2026-10-30', '2026-10-01')).toBe(false);
    expect(rangoValido('2026-02-30', '2026-03-01')).toBe(false);
    expect(rangoValido('2026-02-28', '2026-03-01')).toBe(true);
  });

  it('rellena días sin datos con cero sin confundir módulos ausentes con cero', () => {
    const periodo = { desde: '2026-10-29', hasta: '2026-10-31' };
    expect(diasActividad(periodo, [{ fecha: '2026-10-30', cantidad: 2 }], null)).toEqual([
      { fecha: '2026-10-29', compras: 0, salidas: null },
      { fecha: '2026-10-30', compras: 2, salidas: null },
      { fecha: '2026-10-31', compras: 0, salidas: null },
    ]);
    expect(diasActividad(periodo, null, [{ fecha: '2026-10-31', cantidad: 1 }])[2]).toEqual({ fecha: '2026-10-31', compras: null, salidas: 1 });
  });

  it('muestra los 30 días del período y permite acceder a valores exactos por teclado', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    compras.mockResolvedValue({ total: 1, porDia: [{ fecha: '2026-10-01', cantidad: 1 }], recientes: [] });
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?desde=2026-10-01&hasta=2026-10-30');
    const page = await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    await vi.waitFor(() => expect(page.serieDiaria()[0]?.compras).toBe(1));
    harness.detectChanges();
    expect(page.serieDiaria()).toHaveLength(30);
    expect(page.serieDiaria()[29]).toEqual({ fecha: '2026-10-30', compras: 0, salidas: null });
    const element = harness.routeNativeElement!;
    expect(element.querySelector('details summary')?.textContent).toContain('Ver conteos');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(30);
    expect(element.textContent).toContain('Todos los almacenes');
    expect(element.querySelectorAll('a[href*="historial"]')).toHaveLength(0);
  });

  it('enlaza hasta cinco compras y cinco salidas a sus detalles autorizados', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ);
    compras.mockResolvedValue({ total: 7, porDia: [], recientes: Array.from({ length: 7 }, (_, index) => ({ id: `c${index}`, fecha: '2026-10-01', proveedorNombre: 'Acme', tipoDocumento: null, serieDocumento: null, numeroDocumento: null, totalDocumento: null, recibida: true })) });
    salidas.mockResolvedValue({ total: 7, porDia: [], recientes: Array.from({ length: 7 }, (_, index) => ({ id: `m${index}`, fecha: '2026-10-01', almacenOrigenId: 'a1', almacenOrigenNombre: 'Principal', cantidadDetalles: 1 })) });
    const harness = await RouterTestingHarness.create('/admin/inventario/resumen?almacenId=a1&desde=2026-10-01&hasta=2026-10-30');
    await harness.navigateByUrl(TestBed.inject(Router).url, DashboardReposicionPage);
    await vi.waitFor(() => expect(salidas).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(harness.routeNativeElement?.querySelectorAll('a[href*="historial/"]')).toHaveLength(5));
    expect(harness.routeNativeElement?.querySelectorAll('a[href*="compras/"]')).toHaveLength(5);
    expect(harness.routeNativeElement?.querySelector('a[href$="compras/c0"]')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('a[href$="historial/m0"]')).not.toBeNull();
  });
});
