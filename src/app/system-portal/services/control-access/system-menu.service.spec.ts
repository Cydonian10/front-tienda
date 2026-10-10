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
});

@Component({ template: '' })
class TestPage {}
