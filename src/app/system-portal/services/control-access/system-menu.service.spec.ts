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

  it('provides an internal route and menu for implemented systems only', () => {
    const service = TestBed.inject(SystemMenuService);

    expect(service.routeFor('ACCESS_CONTROL')).toBe('/admin/access-control');
    expect(service.menuFor('ACCESS_CONTROL')[0].items.map((item) => item.url)).toEqual([
      '/admin/access-control/sistemas-roles',
      '/admin/access-control/usuarios',
      '/admin/access-control/permisos',
    ]);
    expect(service.routeFor('SALES')).toBeNull();
    expect(service.menuFor('SALES')).toEqual([]);
  });

  it('resolves the menu using the system code declared on the route', () => {
    const route = {
      data: { systemCode: 'ACCESS_CONTROL' },
    } as unknown as ActivatedRouteSnapshot;
    const menu = TestBed.runInInjectionContext(() =>
      systemMenuResolver(route, {} as RouterStateSnapshot),
    );

    expect(menu).toEqual(TestBed.inject(SystemMenuService).menuFor('ACCESS_CONTROL'));
  });

  it('marks the group and item active from the URL, including after direct navigation', async () => {
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
});

@Component({ template: '' })
class TestPage {}
