import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { ConfirmDialogService } from '../shared/services/confirm-dialog/confirm-dialog.service';
import { SystemMenuService } from '../system-portal/services/control-access/system-menu.service';
import { AdminLayout } from './admin.layout';
import { AuthStore } from '../store/auth/auth.store';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';

@Component({ template: '' })
class TestPage {}

describe('AdminLayout navigation', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows links without an accordion and highlights the current item on navigation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin/access-control',
            component: AdminLayout,
            data: { systemCode: 'ACCESS_CONTROL' },
            resolve: { systemMenu: () => inject(SystemMenuService).menuFor('ACCESS_CONTROL') },
            children: [
              { path: 'usuarios', component: TestPage },
              { path: 'permisos', component: TestPage },
              { path: 'perfil', component: TestPage },
            ],
          },
        ]),
        provideTanStackQuery(new QueryClient()),
        { provide: AuthSessionService, useValue: {} },
        { provide: AuthProfileService, useValue: {} },
        { provide: ConfirmDialogService, useValue: {} },
      ],
    });

    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: true, permissions: [] } as never);

    const harness = await RouterTestingHarness.create('/admin/access-control/usuarios');
    const sidebar = () => harness.routeNativeElement!.querySelector('nav') as HTMLElement;

    expect(sidebar().querySelector('details, summary')).toBeNull();
    expect(sidebar().querySelector('.menu-title')?.textContent).toContain('Administración');
    expect(sidebar().querySelectorAll('a')).toHaveLength(3);
    expect(
      sidebar().querySelector('a[href="/admin/access-control/usuarios"]')?.classList,
    ).toContain('menu-active');

    await harness.navigateByUrl('/admin/access-control/permisos');
    expect(
      sidebar().querySelector('a[href="/admin/access-control/permisos"]')?.classList,
    ).toContain('menu-active');

    await harness.navigateByUrl('/admin/access-control/perfil');
    expect(sidebar().querySelector('.menu-active')).toBeNull();
    expect(sidebar().querySelectorAll('a')).toHaveLength(3);

    TestBed.inject(AuthStore).setProfile({
      permissions: [{ systemCode: 'ACCESS_CONTROL', code: PERMISSION_CODES.USERS_READ }],
    } as never);
    harness.fixture.detectChanges();
    expect(sidebar().querySelectorAll('a')).toHaveLength(1);
  });

  it('changes the sidebar menu when navigating between systems', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            children: [
              {
                path: 'access-control',
                component: AdminLayout,
                data: { systemCode: 'ACCESS_CONTROL' },
                children: [{ path: 'usuarios', component: TestPage }],
              },
              {
                path: 'inventario',
                component: AdminLayout,
                data: { systemCode: 'INVENTARIO' },
                children: [{ path: 'productos', component: TestPage }],
              },
            ],
          },
        ]),
        provideTanStackQuery(new QueryClient()),
        { provide: AuthSessionService, useValue: {} },
        { provide: AuthProfileService, useValue: {} },
        { provide: ConfirmDialogService, useValue: {} },
      ],
    });

    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: true, permissions: [] } as never);

    const harness = await RouterTestingHarness.create('/admin/access-control/usuarios');
    const sidebar = () => harness.routeNativeElement!.querySelector('nav') as HTMLElement;

    expect(sidebar().querySelector('a[href="/admin/access-control/usuarios"]')).toBeTruthy();
    expect(sidebar().querySelector('a[href="/admin/inventario/productos"]')).toBeNull();

    await harness.navigateByUrl('/admin/inventario/productos');

    expect(sidebar().querySelector('a[href="/admin/access-control/usuarios"]')).toBeNull();
    expect(sidebar().querySelector('a[href="/admin/inventario/productos"]')).toBeTruthy();
  });

  it('highlights Resumen only on the dashboard, including its legacy route', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin/inventario', component: AdminLayout, data: { systemCode: 'INVENTARIO' }, children: [
          { path: '', component: TestPage },
          { path: 'resumen', component: TestPage },
          { path: 'compras', component: TestPage },
        ] }]),
        provideTanStackQuery(new QueryClient()),
        { provide: AuthSessionService, useValue: {} },
        { provide: AuthProfileService, useValue: {} },
        { provide: ConfirmDialogService, useValue: {} },
      ],
    });
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: true, permissions: [] } as never);
    const harness = await RouterTestingHarness.create('/admin/inventario');
    const link = (path: string) => harness.routeNativeElement!.querySelector(`nav a[href="${path}"]`);

    expect(link('/admin/inventario')?.classList).toContain('menu-active');
    await harness.navigateByUrl('/admin/inventario/compras');
    expect(link('/admin/inventario')?.classList).not.toContain('menu-active');
    expect(link('/admin/inventario/compras')?.classList).toContain('menu-active');
    await harness.navigateByUrl('/admin/inventario/resumen');
    expect(link('/admin/inventario')?.getAttribute('aria-current')).toBe('page');
    expect(link('/admin/inventario/compras')?.classList).not.toContain('menu-active');
  });
});
