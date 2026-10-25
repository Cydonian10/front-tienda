import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProveedorApi } from '../../../api/inventario/proveedor-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';
import routes from '../../inventario.routes';
import ProveedorDetallePage from './proveedor-detalle-page';

@Component({ template: '' })
class EmptyPage {}

describe('informe de compras de un proveedor', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  const url = `/admin/inventario/proveedores/${id}`;
  const listCompras = vi.fn();
  const result = {
    proveedor: { id, nombre: 'Acero Norte', documento: '204', contacto: null },
    resumen: { cantidadCompras: 25, totalDocumento: null },
    data: [{
      id: 'c1', fecha: '2026-10-25', tipoDocumento: 'factura',
      serieDocumento: 'F001', numeroDocumento: '123', totalDocumento: null,
    }],
    meta: { page: 1, limit: 20, total: 25, totalPages: 2 },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listCompras.mockResolvedValue(result);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: ProveedorApi, useValue: { listCompras } },
        provideRouter([
          { path: 'admin', component: EmptyPage },
          { path: 'auth/login', component: EmptyPage },
          { path: 'admin/inventario', children: routes },
        ]),
        { provide: AuthSessionService, useValue: { get: () => ({ accessToken: 'token' }), clear: vi.fn() } },
        { provide: AuthProfileService, useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() } },
      ],
    });
    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.COMPRAS_READ);
  });

  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ code, systemCode: 'INVENTARIO' })),
    } as never);
  }

  it('muestra identidad, conteo global y total nulo sin enlazar las compras', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, ProveedorDetallePage);
    await vi.waitFor(() => expect(page.informe.data()).toEqual(result));
    expect(listCompras).toHaveBeenCalledWith(id, { page: 1, limit: 20 });
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    expect(root.textContent).toContain('Acero Norte');
    expect(root.textContent).toContain('204');
    expect(root.textContent).toContain('25');
    expect(root.querySelector('.stats')?.textContent).toContain('No disponible');
    expect(root.querySelector('table')?.textContent).toContain('Factura F001-123');
    expect(root.querySelector('ul[aria-label="Compras del proveedor"]')?.textContent).toContain('No disponible');
    expect(root.querySelector('table a')).toBeNull();
    expect(root.querySelector('#proveedor-desde')).not.toBeNull();
  });

  it('filtra fechas inclusivas y cambia de página conservando URL de regreso', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      `${url}?listaNombre=Acero&listaDocumento=204&listaPage=3&listaLimit=10&page=2&limit=10`,
      ProveedorDetallePage,
    );
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, { page: 2, limit: 10 }));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('header a')?.getAttribute('href')).toBe(
      '/admin/inventario/proveedores?nombre=Acero&documento=204&page=3&limit=10',
    );
    page.fechaDesde.set('2026-10-01');
    page.fechaHasta.set('2026-10-25');
    page.applyDates(new Event('submit'));
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, {
      desde: '2026-10-01', hasta: '2026-10-25', page: 1, limit: 10,
    }));
    expect(TestBed.inject(Router).url).toContain('desde=2026-10-01&hasta=2026-10-25');
    expect(TestBed.inject(Router).url).not.toContain('&page=2');
    page.changePage(2);
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, {
      desde: '2026-10-01', hasta: '2026-10-25', page: 2, limit: 10,
    }));
    page.changePageSize(20);
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, {
      desde: '2026-10-01', hasta: '2026-10-25', page: 1, limit: 20,
    }));
    page.clearDates();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).not.toContain('desde='));
  });

  it('no consulta cuando las fechas son imposibles o están invertidas', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(`${url}?desde=2026-02-30`, ProveedorDetallePage);
    harness.detectChanges();
    expect(page.fechaError()).toContain('fechas válidas');
    expect(listCompras).not.toHaveBeenCalled();
    await TestBed.inject(Router).navigateByUrl(`${url}?desde=2026-10-25&hasta=2026-10-24`);
    harness.detectChanges();
    expect(page.fechaError()).toContain('posterior');
    expect(listCompras).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.textContent).not.toContain('Acero Norte');
  });

  it('distingue carga, proveedor inexistente y error recuperable', async () => {
    let reject!: (error: Error) => void;
    listCompras.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, ProveedorDetallePage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Cargando compras del proveedor');
    reject(new Error('Sin conexión'));
    await vi.waitFor(() => expect(page.informe.isError()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No se pudo cargar el informe');
    listCompras.mockResolvedValue(result);
    await page.informe.refetch();
    await vi.waitFor(() => expect(page.informe.isSuccess()).toBe(true));
    listCompras.mockRejectedValueOnce(new HttpErrorResponse({ status: 404 }));
    await TestBed.inject(Router).navigateByUrl(`${url}?desde=2026-01-01`);
    await vi.waitFor(() => expect(page.noEncontrado()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Proveedor no encontrado');
    expect(harness.routeNativeElement?.textContent).not.toContain('Acero Norte');
  });

  it('distingue ausencia de compras y muestra cero sin inventar un total nulo', async () => {
    listCompras.mockResolvedValue({
      ...result,
      resumen: { cantidadCompras: 0, totalDocumento: '0' },
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, ProveedorDetallePage);
    await vi.waitFor(() => expect(page.informe.isSuccess()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Sin compras en este período');
    expect(harness.routeNativeElement?.querySelector('.stats')?.textContent).toContain('S/ 0.00');
    expect(harness.routeNativeElement?.querySelector('app-pagination')).toBeNull();
  });

  it('impide mostrar compras tras revocar un permiso y trata ID inválido como no encontrado', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, ProveedorDetallePage);
    await vi.waitFor(() => expect(page.informe.isSuccess()).toBe(true));
    grant(PERMISSION_CODES.PROVEEDORES_READ);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Sin acceso al informe');
    expect(harness.routeNativeElement?.textContent).not.toContain('Acero Norte');
    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.COMPRAS_READ);
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/proveedores/invalido');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Proveedor no encontrado');
    expect(listCompras).toHaveBeenCalledTimes(1);
  });
});
