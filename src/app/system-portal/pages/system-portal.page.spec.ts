import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { SystemApi } from '../../api/access-control/system-api';
import { AuthLogoutService } from '../../auth/services/auth-logout.service';
import { findSystemsQueryKey } from '../actions/find-systems-action';
import SystemPortalPage from './system-portal.page';

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

describe('SystemPortalPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], systems);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        provideRouter([]),
        { provide: SystemApi, useValue: { findAllSystems: vi.fn() } },
        { provide: AuthLogoutService, useValue: { requestLogout: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(SystemPortalPage);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('links implemented systems to an internal route and leaves other systems without a link', () => {
    const { element } = setup();
    const accessLink = element.querySelector<HTMLAnchorElement>('a[href="/admin/access-control"]');

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
});
