import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { ExistenciaApi } from '../api/inventario/existencia-api';
import { MovimientoApi } from '../api/inventario/movimiento-api';
import { VarianteApi } from '../api/inventario/variante-api';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../store/auth/auth.store';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { ProductoApi } from '../api/inventario/product-api';
import { CategoriaApi } from '../api/inventario/categoria-api';
import { ConfirmDialogService } from '../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../shared/services/toast/toast.service';
import GestionProductosPage from './pages/productos/gestion-productos-page';
import MovimientosPage from './pages/movimientos/movimientos-page';
import inventarioRoutes from './inventario.routes';

@Component({ template: '' })
class EmptyPage {}

describe('rutas de inventario', () => {
  const getProduct = vi.fn();
  const confirm = vi.fn();
  const listVariants = vi.fn().mockResolvedValue([]);
  const listarAlmacenesMovimiento = vi.fn();
  const listarHistorial = vi.fn();
  const obtenerHistorial = vi.fn();
  const historialId = '550e8400-e29b-41d4-a716-446655440000';
  let client: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
    listarAlmacenesMovimiento.mockResolvedValue([]);
    listarHistorial.mockResolvedValue({
      data: [{ id: historialId, fecha: '2026-10-21T15:40:00Z', tipo: 'traslado', estado: 'confirmado',
        almacenOrigen: 'Principal', almacenDestino: 'Sucursal', cantidadDetalles: 1, valorCosto: null }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    obtenerHistorial.mockImplementation((id: string) => id === historialId
      ? Promise.resolve({ id, fecha: '2026-10-21T15:40:00Z', tipo: 'traslado', estado: 'confirmado',
        almacenOrigen: 'Principal', almacenDestino: 'Sucursal', cantidadDetalles: 1, valorCosto: null,
        usuario: 'operador', compraId: null, motivo: null,
        detalles: [{ id: 'linea-1', producto: 'Taladro', sku: 'TAL-1', cantidad: '1',
          unidad: 'Unidad', factorABase: '1', cantidadBase: '1', costoTotal: null, costoAplicado: null }] })
      : Promise.reject(new HttpErrorResponse({ status: 404 })));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        {
          provide: ProductoApi,
          useValue: {
            getById: getProduct,
            listUnidades: vi.fn().mockResolvedValue([{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]),
            listAttributes: vi.fn().mockResolvedValue([]),
            getImage: vi.fn(),
          },
        },
        { provide: VarianteApi, useValue: { list: listVariants } },
        { provide: CategoriaApi, useValue: { list: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, totalItems: 0 }) } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: ToastService, useValue: { success: vi.fn() } },
        {
          provide: ExistenciaApi,
          useValue: { listarAlmacenes: vi.fn().mockResolvedValue([]), listar: vi.fn() },
        },
        {
          provide: MovimientoApi,
          useValue: { listarAlmacenes: listarAlmacenesMovimiento, listarHistorial, obtenerHistorial },
        },
        provideRouter([
          {
            path: 'admin',
            children: [
              { path: '', pathMatch: 'full', component: EmptyPage },
              { path: 'inventario', children: inventarioRoutes },
            ],
          },
          { path: 'auth/login', component: EmptyPage },
        ]),
        {
          provide: AuthProfileService,
          useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() },
        },
        {
          provide: AuthSessionService,
          useValue: {
            get: vi.fn().mockReturnValue({ accessToken: 'secret', tokenType: 'Bearer' }),
            clear: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  function setPermissions(permissions: { code: string; systemCode: string }[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions } as never);
  }

  it('permite Existencias con EXISTENCIAS_LEER sin exigir ALMACENES_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.EXISTENCIAS_READ, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/existencias');

    expect(TestBed.inject(Router).url).toBe('/admin/inventario/existencias');
    expect(TestBed.inject(AuthProfileService).load).toHaveBeenCalled();
  });

  it('deniega la ruta si solo se tiene ALMACENES_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.ALMACENES_READ, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/existencias');

    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('abre el listado de proveedores solo con PROVEEDORES_LEER de INVENTARIO', async () => {
    setPermissions([{ code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'INVENTARIO' }]);
    await RouterTestingHarness.create('/admin/inventario/proveedores');
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/proveedores');
  });

  it('deniega el listado sin lectura aunque se tenga alta o permiso de otro sistema', async () => {
    setPermissions([{ code: PERMISSION_CODES.PROVEEDORES_CREATE, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/proveedores');
    expect(TestBed.inject(Router).url).toBe('/admin');

    setPermissions([{ code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'ACCESS_CONTROL' }]);
    await harness.navigateByUrl('/admin/inventario/proveedores');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('protege el informe directo con PROVEEDORES_LEER y COMPRAS_LEER juntos', async () => {
    const detail = '/admin/inventario/proveedores/123e4567-e89b-12d3-a456-426614174000';
    const harness = await RouterTestingHarness.create();
    for (const code of [PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.COMPRAS_READ]) {
      setPermissions([{ code, systemCode: 'INVENTARIO' }]);
      await harness.navigateByUrl(detail);
      expect(TestBed.inject(Router).url).toBe('/admin');
    }
    setPermissions([
      { code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'INVENTARIO' },
      { code: PERMISSION_CODES.COMPRAS_READ, systemCode: 'ACCESS_CONTROL' },
    ]);
    await harness.navigateByUrl(detail);
    expect(TestBed.inject(Router).url).toBe('/admin');

    setPermissions([
      { code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'INVENTARIO' },
      { code: PERMISSION_CODES.COMPRAS_READ, systemCode: 'INVENTARIO' },
    ]);
    await harness.navigateByUrl(detail);
    expect(TestBed.inject(Router).url).toBe(detail);
  });

  it('redirige Movimientos a Salida y permite navegar entre las tres vistas con MOVIMIENTOS_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/movimientos');
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/movimientos/salida');
    expect(harness.routeNativeElement?.textContent).toContain('Nueva salida');
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/movimientos/traslado');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Nuevo traslado');
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/movimientos/ajuste');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Nuevo ajuste');
  });

  it('deniega las tres rutas con solo EXISTENCIAS_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.EXISTENCIAS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create();
    for (const tipo of ['salida', 'traslado', 'ajuste']) {
      await harness.navigateByUrl(`/admin/inventario/movimientos/${tipo}`);
      expect(TestBed.inject(Router).url).toBe('/admin');
    }
  });

  it('no acepta MOVIMIENTOS_LEER de otro sistema', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'ACCESS_CONTROL' }]);
    await RouterTestingHarness.create('/admin/inventario/movimientos/salida');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('abre Historial solo con MOVIMIENTOS_LEER de INVENTARIO sin alterar Movimientos', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/historial');
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/historial');
    await vi.waitFor(() => expect(listarHistorial).toHaveBeenCalledWith({ page: 1, limit: 20 }));
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('1 resultado');
    });
    expect(harness.routeNativeElement?.textContent).not.toContain('Datos de demostración');
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/movimientos/salida');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Nueva salida');
  });

  it('deniega Historial sin permiso o con MOVIMIENTOS_LEER de otro sistema', async () => {
    setPermissions([{ code: PERMISSION_CODES.EXISTENCIAS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/historial');
    expect(TestBed.inject(Router).url).toBe('/admin');

    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'ACCESS_CONTROL' }]);
    await harness.navigateByUrl('/admin/inventario/historial');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('abre el detalle por ID, mantiene el regreso y muestra el estado de ID inexistente', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create(`/admin/inventario/historial/${historialId}?tipo=traslado`);
    expect(TestBed.inject(Router).url).toBe(`/admin/inventario/historial/${historialId}?tipo=traslado`);
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Taladro');
    });
    expect(harness.routeNativeElement?.textContent).toContain('Principal');
    expect(harness.routeNativeElement?.textContent).toContain('Sucursal');
    expect(harness.routeNativeElement?.textContent).toContain('No disponible');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/inventario/historial?tipo=traslado',
    );

    await TestBed.inject(Router).navigateByUrl('/admin/inventario/historial/desconocido');
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Movimiento no encontrado');
    });
    expect(harness.routeNativeElement?.textContent).not.toContain('Taladro');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/inventario/historial',
    );
  });

  it('protege también la ruta directa de detalle con MOVIMIENTOS_LEER de INVENTARIO', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'ACCESS_CONTROL' }]);
    await RouterTestingHarness.create('/admin/inventario/historial/MOV-2026-010');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('navega mediante Ver detalle y vuelve al listado mediante el enlace', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/historial');
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('table tbody a')).toBeTruthy();
    });
    (harness.routeNativeElement?.querySelector('table tbody a') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe(`/admin/inventario/historial/${historialId}`);
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Variantes incluidas');
    });

    (harness.routeNativeElement?.querySelector('a') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/historial');
  });

  it('muestra almacenes consultados por la API y reintenta una consulta fallida', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    listarAlmacenesMovimiento
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValueOnce([{ id: 'almacen-real', nombre: 'Depósito central' }]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/movimientos/traslado',
      MovimientosPage,
    );
    await vi.waitFor(() => expect(page.almacenes.isError()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar',
    );

    (
      harness.routeNativeElement?.querySelector('app-datos-movimiento button') as HTMLButtonElement
    ).click();
    await vi.waitFor(() =>
      expect(page.almacenes.data()).toEqual([{ id: 'almacen-real', nombre: 'Depósito central' }]),
    );
    harness.detectChanges();
    const options = harness.routeNativeElement?.querySelectorAll('#movimiento-origen option');
    expect(options?.[1]?.textContent).toContain('Depósito central');
    expect(listarAlmacenesMovimiento).toHaveBeenCalledTimes(2);
  });

  it('deniega registrar con solo permiso de lectura aunque se ejecute la acción directamente', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/movimientos/traslado',
      MovimientosPage,
    );
    await page.confirmar(new Event('submit'));
    expect(page.error()).toContain('No tienes permiso');
    harness.detectChanges();
    expect(page.confirmacion()).toBeNull();
  });

  it('no acepta filas duplicadas y limpia variantes al cambiar de almacén', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/movimientos/salida',
      MovimientosPage,
    );
    page.agregar();
    page.actualizarFila({ ...page.filas()[0], varianteId: 'v1', unidadId: 'u1' });
    page.actualizarFila({ ...page.filas()[1], varianteId: 'v1', unidadId: 'u1' });
    expect(page.filas()[1].varianteId).toBe('');

    page.actualizarOrigen('almacen-nuevo');
    expect(page.filas()[0].varianteId).toBe('');
    expect(page.filas()[0].unidadId).toBe('');
  });

  it('permite gestionar productos con PRODUCTOS_LEER sin requerir PRODUCTOS_EDITAR', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' }]);

    const harness = await RouterTestingHarness.create('/admin/inventario/productos/gestion');

    expect(TestBed.inject(Router).url).toBe('/admin/inventario/productos/gestion');
    expect(harness.routeNativeElement?.textContent).toContain('Gestionar productos');
    expect(harness.routeNativeElement?.querySelector('a[href="/admin/inventario/productos"]')).toBeNull();
  });

  it('deniega gestionar productos sin PRODUCTOS_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_UPDATE, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/productos/gestion');

    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('permite consultar marcas y categorías con PRODUCTOS_LEER de INVENTARIO', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/marcas');
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/marcas');
    expect(harness.routeNativeElement?.textContent).toContain('Marcas');
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/categorias');
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/admin/inventario/categorias');
    expect(harness.routeNativeElement?.textContent).toContain('Categorías');
  });

  it('deniega ambas rutas sin PRODUCTOS_LEER de INVENTARIO', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'ACCESS_CONTROL' }]);
    const harness = await RouterTestingHarness.create('/admin/inventario/marcas');
    expect(TestBed.inject(Router).url).toBe('/admin');
    await harness.navigateByUrl('/admin/inventario/categorias');
    expect(TestBed.inject(Router).url).toBe('/admin');

    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_UPDATE, systemCode: 'INVENTARIO' }]);
    await harness.navigateByUrl('/admin/inventario/categorias');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it('al cambiar de producto cancelar conserva el formulario y aceptar descarta solo el borrador', async () => {
    setPermissions([
      { code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' },
      { code: PERMISSION_CODES.PRODUCTS_UPDATE, systemCode: 'INVENTARIO' },
    ]);
    const firstId = 'c5319711-9d10-48e5-8493-9810facd686c';
    const secondId = '1438642a-e762-4302-9a86-4885f73a260e';
    getProduct.mockImplementation(async (id: string) => ({
      id,
      nombre: id === firstId ? 'Martillo' : 'Clavos',
      descripcion: null,
      unidadBaseId: 'u1',
      activo: true,
      imagenes: [],
      puedeCambiarUnidadBase: true,
      marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
    }));
    const firstUrl = `/admin/inventario/productos/gestion?productoId=${firstId}`;
    const secondUrl = `/admin/inventario/productos/gestion?productoId=${secondId}`;
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(firstUrl, GestionProductosPage);
    await vi.waitFor(() => expect(page.generalData()).toBeDefined());
    page.generalData()!.startEdit();
    page.generalData()!.model.update((value) => ({ ...value, nombre: 'Pendiente' }));
    expect(page.hasUnsavedChanges()).toBe(true);
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));

    expect(await TestBed.inject(Router).navigateByUrl(secondUrl)).toBe(false);
    expect(TestBed.inject(Router).url).toBe(firstUrl);
    expect(page.generalData()?.model().nombre).toBe('Pendiente');
    expect(await TestBed.inject(Router).navigateByUrl(secondUrl)).toBe(true);
    await vi.waitFor(() => expect(page.productQuery.data()?.nombre).toBe('Clavos'));
    harness.detectChanges();
    expect(page.hasUnsavedChanges()).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('confirma la salida a otra ruta si hay una variante modificada', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' }]);
    const id = 'c5319711-9d10-48e5-8493-9810facd686c';
    getProduct.mockResolvedValue({
      id,
      nombre: 'Martillo',
      descripcion: null,
      unidadBaseId: 'u1',
      activo: true,
      imagenes: [],
      puedeCambiarUnidadBase: true,
      marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
    });
    listVariants.mockResolvedValue([
      {
        id: 'v1',
        productoId: id,
        sku: 'SKU-1',
        precio: '10.00',
        codigoBarras: null,
        activo: true,
        valores: [],
        imagenes: [],
      },
    ]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      `/admin/inventario/productos/gestion?productoId=${id}`,
      GestionProductosPage,
    );
    await vi.waitFor(() => expect(page.variantsQuery.data()?.length).toBe(1));
    harness.detectChanges();
    page.variantCards()[0].setPrice({ target: { value: '12.00' } } as unknown as Event);
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));

    expect(await TestBed.inject(Router).navigateByUrl('/admin')).toBe(false);
    expect(page.variantCards()[0].model().precio).toBe('12.00');
    expect(await TestBed.inject(Router).navigateByUrl('/admin')).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/admin');
  });
});
