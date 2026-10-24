import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject, of } from 'rxjs';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { RolesApi } from '../../../api/access-control/roles-api';
import { SystemApi } from '../../../api/access-control/system-api';
import { findSystemsQueryKey } from '../../../system-portal/actions/find-systems-action';
import { rolesQueryKey } from '../../actions/roles/roles-actions';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import SystemRolesPage from './system-roles.page';
import { AuthStore } from '../../../store/auth/auth.store';
import { ACCESS_GROUPS } from '../../models/access-groups';

describe('SystemRolesPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useFactory: () => {
            const store = new AuthStore();
            store.setProfile({ isSuperAdmin: true, permissions: [] } as never);
            return store;
          },
        },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function groupedRole(code = 'ENCARGADO') {
    const system = {
      id: 'inventory',
      code: 'INVENTARIO',
      name: 'Inventario',
      description: '',
      active: true,
      order: 1,
    };
    const role = {
      id: 'role',
      code,
      name: 'Encargado',
      description: '',
      systemId: system.id,
      permissions: [],
    };
    const permissions: Permiso[] = [
      ...new Set(
        ACCESS_GROUPS.filter((group) => group.systemCode === system.code).flatMap(
          (group) => group.codes,
        ),
      ),
    ].map((code) => ({
      id: `id-${code}`,
      code,
      name: code,
      systemCode: system.code,
      systemId: system.id,
      systemName: system.name,
      resourceCode: '',
      actionCode: '',
    }));
    const params = new BehaviorSubject(
      convertToParamMap({ system: system.code, roleCode: role.code, step: 'permisos' }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData([...findSystemsQueryKey], [system]);
    client.setQueryData([...rolesQueryKey, system.id], [role]);
    const replacePermissions = vi
      .fn()
      .mockImplementation(async (_id: string, ids: string[]) => ({ permissionIds: ids }));
    const findPermisos = vi.fn().mockResolvedValue(permissions);
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
        { provide: RolesApi, useValue: { findAll: vi.fn(), replacePermissions } },
        { provide: PermisosApi, useValue: { findPermisos } },
      ],
    });
    const fixture = TestBed.createComponent(SystemRolesPage);
    fixture.detectChanges();
    return { fixture, replacePermissions, findPermisos };
  }

  it('seleccionar un grupo guarda sus IDs reales sin incluir otros accesos', async () => {
    const { fixture, replacePermissions } = groupedRole();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#access-group-catalog-read')).toBeTruthy();
    });
    (fixture.nativeElement.querySelector('#access-group-catalog-read') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedPermissionIds()).toEqual(
      new Set(['id-PRODUCTOS_LEER', 'id-UNIDADES_LEER', 'id-ATRIBUTOS_LEER']),
    );
    expect(replacePermissions).not.toHaveBeenCalled();
    await fixture.componentInstance.saveReplacePermissions();
    expect(replacePermissions).toHaveBeenCalledWith('role', [
      'id-PRODUCTOS_LEER',
      'id-UNIDADES_LEER',
      'id-ATRIBUTOS_LEER',
    ]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.hasPermissionChanges()).toBe(false);
    });
  });

  it('un fallo al guardar conserva la selección para reintentar', async () => {
    const { fixture, replacePermissions } = groupedRole();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#access-group-stock-read')).toBeTruthy();
    });
    replacePermissions.mockRejectedValue(new Error('Error de red'));
    (fixture.nativeElement.querySelector('#access-group-stock-read') as HTMLInputElement).click();
    await fixture.componentInstance.saveReplacePermissions();
    expect(fixture.componentInstance.selectedPermissionIds().has('id-EXISTENCIAS_LEER')).toBe(true);
    expect(fixture.componentInstance.hasPermissionChanges()).toBe(true);
  });

  it('no consulta ni permite modificar permisos de SUPER_ADMIN', async () => {
    const { fixture, findPermisos, replacePermissions } = groupedRole('SUPER_ADMIN');
    fixture.componentInstance.onVisiblePermissionsChange({ ids: ['cualquiera'], assigned: true });
    await fixture.componentInstance.saveReplacePermissions();
    expect(findPermisos).not.toHaveBeenCalled();
    expect(replacePermissions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Acceso completo a todos los sistemas');
    expect(fixture.nativeElement.querySelector('permission-actions')).toBeNull();
  });

  it('no permite mutar grupos desde manejadores si el usuario solo consulta', async () => {
    const { fixture, replacePermissions } = groupedRole();
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [] } as never);
    fixture.componentInstance.onVisiblePermissionsChange({
      ids: ['id-EXISTENCIAS_LEER'],
      assigned: true,
    });
    fixture.componentInstance.onPermissionSelectionChange({
      id: 'id-EXISTENCIAS_LEER',
      assigned: true,
    });
    await fixture.componentInstance.saveReplacePermissions();
    expect(fixture.componentInstance.selectedPermissionIds().size).toBe(0);
    expect(replacePermissions).not.toHaveBeenCalled();
  });

  it('elimina del caché solo el rol confirmado y conserva los demás', async () => {
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
    const otherRole = { ...role, id: 'role-2', code: 'LECTOR', name: 'Lector' };
    const otherSystemRole = { ...role, id: 'role-3', systemId: 'system-2' };
    const params = new BehaviorSubject(convertToParamMap({ system: system.code, step: 'roles' }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], [system]);
    client.setQueryData([...rolesQueryKey, system.id], [role, otherRole]);
    client.setQueryData([...rolesQueryKey, otherSystemRole.systemId], [otherSystemRole]);
    const confirm = vi.fn().mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    const removeRole = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params, snapshot: { queryParamMap: params.value } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Dialog, useValue: {} },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn() } },
        { provide: RolesApi, useValue: { findAll: vi.fn(), delete: removeRole } },
        { provide: PermisosApi, useValue: { findPermisos: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(SystemRolesPage);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button[aria-label="Más acciones para Administrador"]',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const deleteButton = [
      ...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    ].find((button) => button.textContent?.includes('Eliminar'))!;
    deleteButton.click();
    fixture.detectChanges();
    expect(confirm).toHaveBeenCalled();

    expect(removeRole).not.toHaveBeenCalled();
    expect(client.getQueryData([...rolesQueryKey, system.id])).toEqual([role, otherRole]);

    fixture.componentInstance.handleDeleteRol(role);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(removeRole).toHaveBeenCalledWith(role.id);
      expect(client.getQueryData([...rolesQueryKey, system.id])).toEqual([otherRole]);
    });
    expect(client.getQueryData([...rolesQueryKey, otherSystemRole.systemId])).toEqual([
      otherSystemRole,
    ]);
    fixture.destroy();
  });

  it('conserva el caché si falla la eliminación', async () => {
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
    const params = new BehaviorSubject(convertToParamMap({ system: system.code }));
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
        { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn() } },
        {
          provide: RolesApi,
          useValue: { findAll: vi.fn(), delete: vi.fn().mockRejectedValue(new Error('Error')) },
        },
        { provide: PermisosApi, useValue: { findPermisos: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(SystemRolesPage);
    fixture.detectChanges();
    fixture.componentInstance.handleDeleteRol(role);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.mutationDeleteRole.isError()).toBe(true);
    });
    expect(client.getQueryData([...rolesQueryKey, system.id])).toEqual([role]);
    fixture.destroy();
  });

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
    const replacePermissions = vi.fn().mockResolvedValue({ permissionIds: ['permission-2'] });

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
        { provide: RolesApi, useValue: { findAll: vi.fn(), replacePermissions } },
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
    const actionButtons = fixture.nativeElement.querySelectorAll(
      'permission-actions button',
    ) as NodeListOf<HTMLButtonElement>;
    expect([...actionButtons].every((button) => button.disabled)).toBe(true);
    const cleanUnload = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    fixture.componentInstance.onBeforeUnload(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
    const bulkButton = fixture.nativeElement.querySelector(
      '[data-bulk-permissions]',
    ) as HTMLButtonElement;
    expect(bulkButton.textContent).toContain('Seleccionar visibles');

    bulkButton.click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual([
      'permission-1',
      'permission-2',
    ]);
    expect(bulkButton.textContent).toContain('Desmarcar visibles');

    bulkButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedPermissionIds().size).toBe(0);
    expect([...actionButtons].every((button) => !button.disabled)).toBe(true);
    const dirtyUnload = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    fixture.componentInstance.onBeforeUnload(dirtyUnload);
    expect(dirtyUnload.defaultPrevented).toBe(true);

    actionButtons[0].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual(['permission-1']);
    expect([...actionButtons].every((button) => button.disabled)).toBe(true);

    checkboxes[1].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual([
      'permission-1',
      'permission-2',
    ]);
    expect(fixture.componentInstance.selectedPermissions()).toHaveLength(2);
    expect([...actionButtons].every((button) => !button.disabled)).toBe(true);

    actionButtons[0].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual(['permission-1']);
    expect(checkboxes[1].checked).toBe(false);
    expect([...actionButtons].every((button) => button.disabled)).toBe(true);

    checkboxes[1].click();
    fixture.detectChanges();

    checkboxes[0].click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.selectedPermissionIds()]).toEqual(['permission-2']);
    expect(
      fixture.componentInstance.selectedPermissions().map((permission) => permission.id),
    ).toEqual(['permission-2']);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);

    checkboxes[0].click();
    checkboxes[1].click();
    fixture.detectChanges();
    expect([...actionButtons].every((button) => button.disabled)).toBe(true);

    checkboxes[0].click();
    checkboxes[1].click();
    fixture.detectChanges();
    actionButtons[1].click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(replacePermissions).toHaveBeenCalledWith(role.id, ['permission-2']);
      expect([...actionButtons].every((button) => button.disabled)).toBe(true);
      expect(fixture.componentInstance.originalPermissionIds().has('permission-2')).toBe(true);
    });
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
      expect(fixture.nativeElement.textContent).toContain(
        'No hay acciones configuradas para este sistema',
      );
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
