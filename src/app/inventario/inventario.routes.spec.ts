import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { ExistenciaApi } from '../api/inventario/existencia-api';
import { VarianteApi } from '../api/inventario/variante-api';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../store/auth/auth.store';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { ProductoApi } from '../api/inventario/product-api';
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
  let client: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
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
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: ToastService, useValue: { success: vi.fn() } },
        {
          provide: ExistenciaApi,
          useValue: { listarAlmacenes: vi.fn().mockResolvedValue([]), listar: vi.fn() },
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

  it('valida el formulario de prueba y confirma sin enviar datos al servidor', async () => {
    setPermissions([{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/movimientos/traslado',
      MovimientosPage,
    );
    page.confirmar(new Event('submit'));
    expect(page.error()).toContain('almacén');

    page.actualizarOrigen('principal');
    page.actualizarDestino('centro');
    page.actualizarFila({ ...page.filas()[0], varianteId: 'martillo', cantidad: '2' });
    page.confirmar(new Event('submit'));
    harness.detectChanges();
    expect(page.confirmacion()).toBe(true);
    expect(harness.routeNativeElement?.textContent).toContain('Ningún dato se guardó');
  });

  it('permite gestionar productos con PRODUCTOS_LEER sin requerir PRODUCTOS_EDITAR', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' }]);

    const harness = await RouterTestingHarness.create('/admin/inventario/productos/gestion');

    expect(TestBed.inject(Router).url).toBe('/admin/inventario/productos/gestion');
    expect(harness.routeNativeElement?.textContent).toContain('Gestionar productos');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/inventario/productos',
    );
  });

  it('deniega gestionar productos sin PRODUCTOS_LEER', async () => {
    setPermissions([{ code: PERMISSION_CODES.PRODUCTS_UPDATE, systemCode: 'INVENTARIO' }]);

    await RouterTestingHarness.create('/admin/inventario/productos/gestion');

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
