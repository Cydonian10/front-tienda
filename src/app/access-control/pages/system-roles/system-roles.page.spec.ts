import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject } from 'rxjs';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { RolesApi } from '../../../api/access-control/roles-api';
import { SystemApi } from '../../../api/access-control/system-api';
import { findSystemsQueryKey } from '../../actions/systems/find-systems-action';
import { rolesQueryKey } from '../../actions/roles/roles-actions';
import SystemRolesPage from './system-roles.page';

describe('SystemRolesPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('mantiene los permisos seleccionados en el padre al cambiar los checkboxes', async () => {
    const system = {
      id: 'system-1',
      code: 'VENTAS',
      name: 'Ventas',
      description: '',
      active: true,
      order: 1,
    };
    const role = {
      id: 'role-1',
      systemId: system.id,
      code: 'ADMIN',
      name: 'Administrador',
      description: '',
      permissions: [],
    };
    const permissions: Permiso[] = [
      {
        id: 'permission-1',
        name: 'Leer usuarios',
        systemCode: system.code,
        systemName: system.name,
        systemId: system.id,
        resourceCode: 'USUARIOS',
        actionCode: 'LEER',
        code: 'USUARIOS_LEER',
        assigned: true,
      },
      {
        id: 'permission-2',
        name: 'Crear usuarios',
        systemCode: system.code,
        systemName: system.name,
        systemId: system.id,
        resourceCode: 'USUARIOS',
        actionCode: 'CREAR',
        code: 'USUARIOS_CREAR',
        assigned: false,
      },
    ];
    const params = new BehaviorSubject(
      convertToParamMap({ system: system.code, roleCode: role.code, step: 'permisos' }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], [system]);
    client.setQueryData([...rolesQueryKey, system.id], [role]);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params, snapshot: { queryParamMap: params.value } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Dialog, useValue: {} },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn() } },
        { provide: RolesApi, useValue: { findAll: vi.fn() } },
        {
          provide: PermisosApi,
          useValue: { findPermisos: vi.fn().mockResolvedValue(permissions) },
        },
      ],
    });

    const fixture = TestBed.createComponent(SystemRolesPage);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    });

    const checkboxes = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(
      fixture.componentInstance.selectedPermissions().map((permission) => permission.id),
    ).toEqual(['permission-1']);

    checkboxes[1].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual([
      'permission-1',
      'permission-2',
    ]);
    expect(fixture.componentInstance.selectedPermissions()).toHaveLength(2);

    checkboxes[0].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual(['permission-2']);
    expect(
      fixture.componentInstance.selectedPermissions().map((permission) => permission.id),
    ).toEqual(['permission-2']);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
  });

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
              const nextParams: Record<string, string> = Object.fromEntries(
                params.value.keys.map((key) => [key, params.value.get(key)!]),
              );
              for (const [key, value] of Object.entries(options.queryParams)) {
                if (value === null) delete nextParams[key];
                else nextParams[key] = value as string;
              }
              params.next(convertToParamMap(nextParams));
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
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Este rol todavía no tiene permisos.');
    });
    expect(fixture.componentInstance['stepActive']()).toBe('permisos');
    expect(fixture.nativeElement.querySelector('system-selector')).toBeNull();

    const stepButtons = () =>
      fixture.nativeElement.querySelectorAll(
        'header-system-rol button',
      ) as NodeListOf<HTMLButtonElement>;
    stepButtons()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance['stepActive']()).toBe('roles');
    expect(fixture.nativeElement.querySelector('system-roles-panel')).toBeTruthy();
    expect(fixture.componentInstance.selectedRol()?.id).toBe(role.id);
    stepButtons()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance['stepActive']()).toBe('permisos');

    (
      fixture.nativeElement.querySelector(
        'role-permission-preview > div button',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['stepActive']()).toBe('roles');
    expect(fixture.componentInstance.selectedRol()).toBeUndefined();
    expect(stepButtons()[2].disabled).toBe(true);

    fixture.componentInstance.setSelectedRol(role);
    fixture.detectChanges();
    stepButtons()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance['stepActive']()).toBe('system');
    expect(fixture.componentInstance.selectedRol()?.id).toBe(role.id);
    expect(fixture.nativeElement.querySelector('system-roles-panel')).toBeNull();

    fixture.componentInstance.setSelectedSystem(system);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedSystem()).toBeNull();
    expect(fixture.componentInstance.selectedRol()).toBeUndefined();
    expect(stepButtons()[1].disabled).toBe(true);

    fixture.componentInstance.setSelectedSystem(system);
    fixture.componentInstance.setSelectedRol(role);
    fixture.componentInstance.setSelectedSystem(otherSystem);
    fixture.detectChanges();
    expect(fixture.componentInstance['stepActive']()).toBe('roles');
    expect(params.value.has('roleCode')).toBe(false);
    expect(fixture.componentInstance.selectedRol()).toBeUndefined();

    params.next(convertToParamMap({ system: otherSystem.code, roleCode: role.code }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedRol()).toBeUndefined();
    expect(fixture.componentInstance['stepActive']()).toBe('roles');
    expect(findPermisos).toHaveBeenCalledTimes(1);
  });
});
