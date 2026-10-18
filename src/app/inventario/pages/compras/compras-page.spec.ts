import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { CompraApi } from '../../../api/inventario/compra-api';
import type { CompraListadoResponse } from '../../../api/interfaces/inventario/compra.interface';
import { AuthProfileService } from '../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';
import routes from '../../inventario.routes';
import ComprasPage, { documentoCompra, formatTotalPEN } from './compras-page';

@Component({ template: '' })
class EmptyPage {}

describe('ruta y acciones de compras', () => {
  const profile = { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() };
  const list = vi.fn();
  const getById = vi.fn();
  const empty = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  const compra: CompraListadoResponse = {
    id: 'c1',
    fecha: '2026-10-17',
    fechaRegistro: '2026-10-17T12:00:00Z',
    tipoDocumento: 'factura',
    serieDocumento: 'F001',
    numeroDocumento: '123',
    totalDocumento: '1200.500000',
    proveedor: { id: 'p1', nombre: 'Acero Norte' },
    almacen: { id: 'a1', nombre: 'Principal' },
    cantidadRenglones: 2,
  };
  beforeEach(() => {
    vi.resetAllMocks();
    profile.load.mockResolvedValue(undefined);
    list.mockResolvedValue(empty);
    getById.mockResolvedValue({
      ...compra,
      observaciones: null,
      ingreso: { id: 'm1', fecha: '2026-10-17T12:00:00Z', estado: 'confirmado' },
      renglones: [],
      comprobante: null,
    });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: CompraApi, useValue: { list, getById } },
        provideRouter([
          { path: 'admin', component: EmptyPage },
          { path: 'auth/login', component: EmptyPage },
          { path: 'admin/inventario', children: routes },
        ]),
        {
          provide: AuthSessionService,
          useValue: { get: () => ({ accessToken: 'token' }), clear: vi.fn() },
        },
        { provide: AuthProfileService, useValue: profile },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ systemCode: 'INVENTARIO', code })),
    } as never);
  }

  it('bloquea navegación directa sin COMPRAS_LEER y permite consultar con ese permiso', async () => {
    grant(PERMISSION_CODES.COMPRAS_CREATE);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    expect(TestBed.inject(Router).url).toBe('/admin');

    grant(PERMISSION_CODES.COMPRAS_READ);
    await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/compras');
    expect(profile.load).toHaveBeenCalled();
  });

  it('oculta crear sin permiso y lo vuelve a comprobar al ejecutar la acción', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    const page = await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).not.toBeNull();

    grant(PERMISSION_CODES.COMPRAS_READ);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).toBeNull();
    page.openCreate();
    expect(page.showCreate()).toBe(false);

    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.COMPRAS_CREATE);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button.btn-primary')).not.toBeNull();
    page.openCreate();
    expect(page.showCreate()).toBe(true);
  });

  it('muestra compras reales, busca en la API y pagina sin recalcular totales', async () => {
    list.mockImplementation((page: number, limit: number, q?: string) =>
      Promise.resolve({
        data: [compra],
        meta: { page, limit, total: 21, totalPages: Math.ceil(21 / limit) },
      }),
    );
    grant(PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    const page = await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    await vi.waitFor(() => expect(page.query.data()?.data).toEqual([compra]));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('table')?.textContent).toContain(
      'Factura F001-123',
    );
    expect(harness.routeNativeElement?.querySelector('table')?.textContent).toContain(
      'Acero Norte',
    );
    expect(harness.routeNativeElement?.querySelector('table')?.textContent).toContain('Principal');
    expect(harness.routeNativeElement?.querySelector('table')?.textContent).toContain(
      'S/ 1,200.50',
    );
    expect(
      harness.routeNativeElement?.querySelector('ul[aria-label="Listado de compras"]'),
    ).not.toBeNull();

    page.searchDraft.set(' Acero ');
    page.searchCompras(new Event('submit'));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, 'Acero'));
    page.page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 10, 'Acero'));
    page.changePageSize(20);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, 'Acero'));
    page.clearSearch();
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, undefined));
  });

  it('distingue carga, error con reintento, vacío y búsqueda sin coincidencias', async () => {
    let reject!: (reason: Error) => void;
    list.mockReturnValueOnce(
      new Promise((_, fail) => {
        reject = fail;
      }),
    );
    grant(PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    const page = await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Cargando compras');

    reject(new Error('sin conexión'));
    await vi.waitFor(() => expect(page.query.isError()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No pudimos cargar la información');
    list.mockResolvedValue(empty);
    await page.query.refetch();
    await vi.waitFor(() => expect(page.query.isSuccess()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Todavía no hay compras');

    page.searchDraft.set('ausente');
    page.searchCompras(new Event('submit'));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, 'ausente'));
    await vi.waitFor(() => expect(page.query.isSuccess()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No encontramos resultados');
  });

  it('conserva importes decimales y distingue documentos antiguos sin número', () => {
    expect(formatTotalPEN('1234567.123456')).toBe('S/ 1,234,567.123456');
    expect(formatTotalPEN('0.000000')).toBe('S/ 0.00');
    expect(formatTotalPEN(null)).toBe('—');
    expect(
      documentoCompra({
        ...compra,
        tipoDocumento: null,
        serieDocumento: null,
        numeroDocumento: null,
      }),
    ).toBe('Documento sin número');
  });

  it('busca el número documental en el listado sin volver a confirmar la compra', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras');
    const page = await harness.navigateByUrl('/admin/inventario/compras', ComprasPage);
    page.page.set(3);
    page.findDocument('123');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, '123'));
    expect(page.searchDraft()).toBe('123');
    expect(page.showCreate()).toBe(false);
  });

  it('protege la ruta de detalle con COMPRAS_LEER y consulta la compra solicitada', async () => {
    grant(PERMISSION_CODES.COMPRAS_CREATE);
    const harness = await RouterTestingHarness.create('/admin/inventario/compras/c1');
    expect(TestBed.inject(Router).url).toBe('/admin');
    grant(PERMISSION_CODES.COMPRAS_READ);
    await harness.navigateByUrl('/admin/inventario/compras/c1');
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/compras/c1');
    await vi.waitFor(() => expect(getById).toHaveBeenCalledWith('c1'));
    harness.detectChanges();
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Factura F001-123');
    });
  });
});
