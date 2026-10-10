import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { SystemApi } from '../../api/access-control/system-api';
import { AuthLogoutService } from '../../auth/services/auth-logout.service';
import { findSystemsQueryKey } from '../actions/find-systems-action';
import MySystemsPage from './my-systems.page';
import { AuthStore } from '../../store/auth/auth.store';

const systems = [
  {
    id: 'access',
    code: 'ACCESS_CONTROL',
    name: 'Control de acceso',
    description: 'Administra usuarios, roles y permisos.',
    active: true,
    order: 1,
  },
  {
    id: 'sales',
    code: 'SALES',
    name: 'Ventas',
    description: 'Gestiona pedidos, ventas y clientes.',
    active: true,
    order: 2,
  },
];

describe('MySystemsPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup(records = systems) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], records);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        provideRouter([]),
        { provide: SystemApi, useValue: { findAllSystems: vi.fn() } },
        { provide: AuthLogoutService, useValue: { requestLogout: vi.fn() } },
      ],
    });
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: true, permissions: [] } as never);

    const fixture = TestBed.createComponent(MySystemsPage);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('links implemented systems to an internal route and leaves other systems without a link', () => {
    const { element } = setup();
    const accessLink = element.querySelector<HTMLAnchorElement>(
      'a[href="/admin/access-control/sistemas-roles"]',
    );

    expect(accessLink).not.toBeNull();
    expect(accessLink?.textContent).toContain('Ingresar');
    expect(element.textContent).toContain('Aún no disponible');
    expect(element.querySelector('a[href^="http"]')).toBeNull();
  });

  it('filters systems by name, description, or code', () => {
    const { fixture, element } = setup();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;

    input.value = 'sales';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Ventas');
    expect(element.textContent).not.toContain('Control de acceso');
  });

  it('does not link inactive systems even when their frontend route exists', () => {
    const { element } = setup([{ ...systems[0], active: false }]);

    expect(element.textContent).toContain('Inactivo');
    expect(element.querySelector('a[href^="/admin/access-control/"]')).toBeNull();
  });

  it('does not offer entry to an implemented system without permissions', () => {
    const { fixture, element } = setup();
    TestBed.inject(AuthStore).setProfile({ permissions: [] } as never);
    fixture.detectChanges();

    expect(element.textContent).toContain('No tienes permisos para ingresar');
    expect(element.querySelector('a[href^="/admin/access-control/"]')).toBeNull();
  });
});
