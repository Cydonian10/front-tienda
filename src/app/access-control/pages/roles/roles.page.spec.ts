import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { RolesApi } from '../../../api/access-control/roles-api';
import { PERMISSION_CODES, Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { SystemApi } from '../../../api/access-control/system-api';
import { AuthStore } from '../../../store/auth/auth.store';
import { findSystemsQueryKey } from '../../actions/systems/find-systems-action';
import { getPermisosQueryKey } from '../../actions/permisos/get-permisos-action';
import { rolesQueryKey } from '../../actions/roles/roles-actions';
import RolesPage from './roles.page';

const systems = [
  { id: 'system-1', code: 'INVENTARIO', name: 'Inventario', description: 'Productos y stock', active: true, order: 1 },
  { id: 'system-2', code: 'VENTAS', name: 'Ventas', description: 'Ventas', active: true, order: 2 },
];
const roles = [
  { id: 'role-1', systemId: 'system-1', code: 'INVENTARIO_SUPERVISOR', name: 'Supervisor', description: 'Supervisa inventario', permissions: [] },
  { id: 'role-2', systemId: 'system-2', code: 'VENTAS_VENDEDOR', name: 'Vendedor', description: 'Registra ventas', permissions: [] },
];
const permissions: Permiso[] = [
  { id: 'permission-1', systemId: 'system-1', systemCode: 'INVENTARIO', systemName: 'Inventario', resourceCode: 'PRODUCTOS', actionCode: 'LEER', name: 'Ver productos', code: PERMISSION_CODES.ROLES_READ },
  { id: 'permission-2', systemId: 'system-1', systemCode: 'INVENTARIO', systemName: 'Inventario', resourceCode: 'PRODUCTOS', actionCode: 'EDITAR', name: 'Editar productos', code: PERMISSION_CODES.ROLES_UPDATE },
];

describe('RolesPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], systems);
    client.setQueryData([...rolesQueryKey], roles);
    client.setQueryData([...getPermisosQueryKey, 'INVENTARIO'], permissions);
    client.setQueryData([...getPermisosQueryKey, 'role', 'role-1'], [permissions[0]]);
    const create = vi.fn().mockResolvedValue({ ...roles[0], id: 'role-3' });
    const assign = vi.fn().mockResolvedValue({});
    const remove = vi.fn().mockResolvedValue(undefined);
    const findPermisos = vi.fn().mockImplementation(({ rolId }: { rolId?: string }) =>
      Promise.resolve(rolId ? [permissions[0]] : permissions),
    );
    const auth = new AuthStore();
    auth.setProfile({
      id: 'user-1', email: 'user@example.com', nickName: 'Admin', emailVerified: true, active: true,
      person: { id: 'person-1', firstName: 'Admin', lastName: 'Atlas', dateOfBirth: '', identityDocument: '', active: true },
      roles: [],
      permissions: [PERMISSION_CODES.ROLES_CREATE, PERMISSION_CODES.ROLES_ASSIGN_PERMISSION].map((code) => ({ id: code, code, name: code, resourceCode: 'ROLES', actionCode: 'CREAR' })),
    });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: AuthStore, useValue: auth },
      { provide: SystemApi, useValue: { findAllSystems: vi.fn().mockResolvedValue(systems) } },
      { provide: RolesApi, useValue: { findAll: vi.fn().mockResolvedValue(roles), create, assign, remove } },
      { provide: PermisosApi, useValue: { findPermisos } },
    ] });
    const fixture = TestBed.createComponent(RolesPage);
    fixture.detectChanges();
    return { page: fixture.componentInstance, fixture, client, create, assign, remove, findPermisos };
  }

  it('muestra solo los roles del sistema seleccionado', () => {
    const { page, fixture } = setup();
    expect(page.visibleRoles().map((role) => role.name)).toEqual(['Supervisor']);
    page.selectSystem('system-2');
    fixture.detectChanges();
    expect(page.visibleRoles().map((role) => role.name)).toEqual(['Vendedor']);
  });

  it('crea el rol con nombre y descripción; el backend genera el código', async () => {
    const { page, create } = setup();
    page.createName.set('  Jefe de almacén  ');
    page.createDescription.set('  Gestiona almacén  ');
    await page.createRole(new Event('submit'));
    expect(create).toHaveBeenCalledWith('system-1', 'Jefe de almacén', 'Gestiona almacén');
  });

  it('guarda solo diferencias y exige decisión al salir con cambios', async () => {
    const { page, fixture, assign, remove, findPermisos } = setup();
    page.openRole('role-1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(page.draftIds().has('permission-1')).toBe(true));
    page.togglePermission(permissions[1], true);
    expect(page.dirty()).toBe(true);
    const dialog = fixture.nativeElement.querySelectorAll('dialog')[1] as HTMLDialogElement;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    const navigation = page.confirmNavigation();
    expect(navigation).toBeInstanceOf(Promise);
    page.decideLeave('cancel');
    expect(await navigation).toBe(false);
    expect(findPermisos).not.toHaveBeenCalledWith({ rolId: 'role-2' });
    await page.save();
    expect(assign).toHaveBeenCalledWith('role-1', 'permission-2');
    expect(remove).not.toHaveBeenCalled();
  });

  it('conserva los cambios pendientes cuando falla una asignación', async () => {
    const { page, fixture, assign } = setup();
    page.openRole('role-1');
    fixture.detectChanges();
    await vi.waitFor(() => expect(page.draftIds().has('permission-1')).toBe(true));
    page.togglePermission(permissions[1], true);
    assign.mockRejectedValueOnce(new Error('Sin conexión'));

    expect(await page.save()).toBe(false);
    expect(page.dirty()).toBe(true);
    expect(page.draftIds().has('permission-2')).toBe(true);
  });
});
