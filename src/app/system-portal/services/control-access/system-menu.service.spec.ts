import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { systemMenuResolver } from './system-menu.resolver';
import { SystemMenuService } from './system-menu.service';
import { AuthStore } from '../../../store/auth/auth.store';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';

describe('SystemMenuService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin/access-control/usuarios', component: TestPage },
          { path: 'admin/access-control/permisos', component: TestPage },
          { path: 'admin/inventario/proveedores/:id', component: TestPage },
        ]),
      ],
    }),
  );
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ code, systemCode: 'ACCESS_CONTROL' })),
    } as never);
  }

  it('provides an internal route and menu for implemented systems only', () => {
    grant(
      PERMISSION_CODES.SYSTEM_READ,
      PERMISSION_CODES.USERS_READ,
      PERMISSION_CODES.PERMISSIONS_READ,
    );
    const service = TestBed.inject(SystemMenuService);

    expect(service.routeFor('ACCESS_CONTROL')).toBe('/admin/access-control/sistemas-roles');
    expect(service.menuFor('ACCESS_CONTROL')[0].items.map((item) => item.url)).toEqual([
      '/admin/access-control/sistemas-roles',
      '/admin/access-control/usuarios',
      '/admin/access-control/permisos',
    ]);
    expect(service.routeFor('SALES')).toBeNull();
    expect(service.menuFor('SALES')).toEqual([]);
  });

  it('resolves the menu using the system code declared on the route', () => {
    grant(PERMISSION_CODES.USERS_READ);
    const route = {
      data: { systemCode: 'ACCESS_CONTROL' },
    } as unknown as ActivatedRouteSnapshot;
    const menu = TestBed.runInInjectionContext(() =>
      systemMenuResolver(route, {} as RouterStateSnapshot),
    );

    expect(menu).toEqual(TestBed.inject(SystemMenuService).menuFor('ACCESS_CONTROL'));
  });

  it('marks the group and item active from the URL, including after direct navigation', async () => {
    grant(
      PERMISSION_CODES.SYSTEM_READ,
      PERMISSION_CODES.USERS_READ,
      PERMISSION_CODES.PERMISSIONS_READ,
    );
    const router = TestBed.inject(Router);
    const service = TestBed.inject(SystemMenuService);
    const group = service.menuFor('ACCESS_CONTROL')[0];

    await router.navigateByUrl('/admin/access-control/usuarios?tab=activos');
    expect(service.isActiveGroup(group)).toBe(true);
    expect(service.isActiveItem(group.items[1])).toBe(true);
    expect(service.isActiveItem(group.items[2])).toBe(false);

    await router.navigateByUrl('/admin/access-control/permisos');
    expect(service.isActiveGroup(group)).toBe(true);
    expect(service.isActiveItem(group.items[1])).toBe(false);
    expect(service.isActiveItem(group.items[2])).toBe(true);
  });

  it('hides unauthorized items and empty groups', () => {
    const service = TestBed.inject(SystemMenuService);
    expect(service.menuFor('ACCESS_CONTROL')).toEqual([]);

    grant(PERMISSION_CODES.USERS_READ);
    expect(service.menuFor('ACCESS_CONTROL')[0].items.map((item) => item.label)).toEqual([
      'Usuarios',
    ]);
    expect(service.routeFor('ACCESS_CONTROL')).toBe('/admin/access-control/usuarios');
  });

  it('provides the inventory menu only with permission for that system', () => {
    const service = TestBed.inject(SystemMenuService);
    grant(PERMISSION_CODES.PRODUCTS_READ);

    expect(service.menuFor('INVENTARIO')).toEqual([]);
    expect(service.routeFor('INVENTARIO')).toBeNull();

    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' }],
    } as never);

    expect(service.isImplemented('INVENTARIO')).toBe(true);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario/productos');
    expect(service.menuFor('INVENTARIO')[0].items.map((item) => item.label)).toEqual([
      'Productos', 'Marcas', 'Categorías',
    ]);

    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.ATRIBUTOS_READ, systemCode: 'INVENTARIO' }],
    } as never);
    expect(service.menuFor('INVENTARIO')[0].items.map((item) => item.label)).toEqual(['Atributos']);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario/atributos');
  });

  it('muestra Operaciones → Compras solo con COMPRAS_LEER de INVENTARIO', () => {
    const service = TestBed.inject(SystemMenuService);
    const store = TestBed.inject(AuthStore);
    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.COMPRAS_READ, systemCode: 'ACCESS_CONTROL' }],
    } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([]);

    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.COMPRAS_CREATE, systemCode: 'INVENTARIO' }],
    } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([]);

    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.COMPRAS_READ, systemCode: 'INVENTARIO' }],
    } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([
      expect.objectContaining({ label: 'Inicio', items: [expect.objectContaining({ label: 'Resumen', url: '/admin/inventario' })] }),
      expect.objectContaining({
        label: 'Operaciones',
        items: [
          expect.objectContaining({
            label: 'Compras',
            url: '/admin/inventario/compras',
            permission: PERMISSION_CODES.COMPRAS_READ,
          }),
        ],
      }),
    ]);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario');
  });

  it('muestra Proveedores solo con PROVEEDORES_LEER de INVENTARIO', async () => {
    const service = TestBed.inject(SystemMenuService);
    const store = TestBed.inject(AuthStore);
    const items = () => service.menuFor('INVENTARIO').flatMap((group) => group.items);

    store.setProfile({ isSuperAdmin: false, permissions: [
      { code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'ACCESS_CONTROL' },
    ] } as never);
    expect(items()).toEqual([]);

    store.setProfile({ isSuperAdmin: false, permissions: [
      { code: PERMISSION_CODES.PROVEEDORES_CREATE, systemCode: 'INVENTARIO' },
      { code: PERMISSION_CODES.COMPRAS_READ, systemCode: 'INVENTARIO' },
    ] } as never);
    expect(items().map((item) => item.label)).toEqual(['Resumen', 'Compras']);

    store.setProfile({ isSuperAdmin: false, permissions: [
      { code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'INVENTARIO' },
    ] } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([
      expect.objectContaining({ label: 'Operaciones', items: [
        expect.objectContaining({
          label: 'Proveedores',
          url: '/admin/inventario/proveedores',
          permission: PERMISSION_CODES.PROVEEDORES_READ,
        }),
      ] }),
    ]);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario/proveedores');
    await TestBed.inject(Router).navigateByUrl('/admin/inventario/proveedores/123?desde=2026-10-01');
    expect(service.isActiveItem(items()[0])).toBe(true);
  });

  it('muestra Operaciones → Existencias con EXISTENCIAS_LEER, sin ALMACENES_LEER', () => {
    const service = TestBed.inject(SystemMenuService);
    const store = TestBed.inject(AuthStore);
    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.EXISTENCIAS_READ, systemCode: 'INVENTARIO' }],
    } as never);

    expect(service.menuFor('INVENTARIO')).toEqual([
      expect.objectContaining({ label: 'Inicio', items: [expect.objectContaining({ label: 'Resumen', url: '/admin/inventario' })] }),
      expect.objectContaining({
        label: 'Operaciones',
        items: [
          expect.objectContaining({
            label: 'Existencias',
            url: '/admin/inventario/existencias',
            permission: PERMISSION_CODES.EXISTENCIAS_READ,
          }),
        ],
      }),
    ]);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario');

    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'INVENTARIO' }],
    } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([
      expect.objectContaining({ label: 'Inicio', items: [expect.objectContaining({ label: 'Resumen' })] }),
      expect.objectContaining({
        label: 'Operaciones',
        items: [
          expect.objectContaining({
            label: 'Movimientos',
            url: '/admin/inventario/movimientos',
            permission: PERMISSION_CODES.MOVIMIENTOS_READ,
          }),
          expect.objectContaining({
            label: 'Historial',
            url: '/admin/inventario/historial',
            permission: PERMISSION_CODES.MOVIMIENTOS_READ,
          }),
        ],
      }),
    ]);
    expect(service.routeFor('INVENTARIO')).toBe('/admin/inventario');

    store.setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.MOVIMIENTOS_READ, systemCode: 'ACCESS_CONTROL' }],
    } as never);
    expect(service.menuFor('INVENTARIO')).toEqual([]);
  });
});

@Component({ template: '' })
class TestPage {}
