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
import DashboardReposicionPage, { rangoValido } from './dashboard-reposicion-page';

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
});
