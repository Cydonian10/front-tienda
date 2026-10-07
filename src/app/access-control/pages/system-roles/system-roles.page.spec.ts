import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject } from 'rxjs';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { RolesApi } from '../../../api/access-control/roles-api';
import { SystemApi } from '../../../api/access-control/system-api';
import { findSystemsQueryKey } from '../../actions/systems/find-systems-action';
import { rolesQueryKey } from '../../actions/roles/roles-actions';
import SystemRolesPage from './system-roles.page';

describe('SystemRolesPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('consulta permisos al seleccionar un rol y no conserva la selección al cambiar de sistema', async () => {
    const system = {
      id: 'system-1',
      code: 'VENTAS',
      name: 'Ventas',
      description: '',
      active: true,
      order: 1,
    };
    const otherSystem = {
      ...system,
      id: 'system-2',
      code: 'INVENTARIO',
      name: 'Inventario',
    };
    const role = {
      id: 'role-1',
      systemId: system.id,
      code: 'ADMIN',
      name: 'Administrador',
      description: '',
      permissions: [],
    };
    const params = new BehaviorSubject(convertToParamMap({ system: system.code }));
    const findPermisos = vi.fn().mockResolvedValue([]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], [system, otherSystem]);
    client.setQueryData([...rolesQueryKey, system.id], [role]);
    client.setQueryData([...rolesQueryKey, otherSystem.id], []);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params, snapshot: { queryParamMap: params.value } },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn((_commands, options) => {
              params.next(
                convertToParamMap({
                  ...Object.fromEntries(
                    params.value.keys.map((key) => [key, params.value.get(key)]),
                  ),
                  ...options.queryParams,
                }),
              );
              return Promise.resolve(true);
            }),
          },
        },
        { provide: Dialog, useValue: {} },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn().mockResolvedValue([]) } },
        { provide: RolesApi, useValue: { findAll: vi.fn().mockResolvedValue([]) } },
        { provide: PermisosApi, useValue: { findPermisos } },
      ],
    });

    const fixture = TestBed.createComponent(SystemRolesPage);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('system-roles-table button')).toBeTruthy();
    });
    expect(findPermisos).not.toHaveBeenCalled();

    (fixture.nativeElement.querySelector('system-roles-table button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(findPermisos).toHaveBeenCalledWith({ roleId: role.id }));

    params.next(convertToParamMap({ system: otherSystem.code, roleCode: role.code }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedRol()).toBeUndefined();
    expect(findPermisos).toHaveBeenCalledTimes(1);
  });
});
