import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../api/inventario/existencia-api';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../store/auth/auth.store';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { ProductoApi } from '../api/inventario/product-api';
import { ConfirmDialogService } from '../shared/services/confirm-dialog/confirm-dialog.service';
import inventarioRoutes from './inventario.routes';

@Component({ template: '' })
class EmptyPage {}

describe('rutas de inventario', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { listUnidades: vi.fn().mockResolvedValue([]) } },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn() } },
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
});
