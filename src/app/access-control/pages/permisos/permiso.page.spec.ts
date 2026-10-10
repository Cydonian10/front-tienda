import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { SystemApi } from '../../../api/access-control/system-api';
import { getPermisosQueryKey } from '../../actions/permisos/get-permisos-action';
import { findSystemsQueryKey } from '../../../system-portal/actions/find-systems-action';
import PermisosPage from './permiso.page';

const permissions: Permiso[] = [
  {
    id: 'permission-1',
    name: 'Leer permisos',
    systemId: 'system-1',
    systemCode: 'ACCESS_CONTROL',
    systemName: 'Control de acceso',
    resourceCode: 'PERMISOS',
    actionCode: 'LEER',
    code: 'PERMISOS_LEER',
  },
  {
    id: 'permission-2',
    name: 'Leer roles',
    systemId: 'system-1',
    systemCode: 'ACCESS_CONTROL',
    systemName: 'Control de acceso',
    resourceCode: 'ROLES',
    actionCode: 'LEER',
    code: 'ROLES_LEER',
  },
  {
    id: 'permission-3',
    name: 'Leer usuarios',
    systemId: 'system-2',
    systemCode: 'VENTAS',
    systemName: 'Ventas',
    resourceCode: 'USUARIOS',
    actionCode: 'LEER',
    code: 'USUARIOS_LEER',
  },
];

describe('PermisosPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup(data: Permiso[] = permissions) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...findSystemsQueryKey], [
      { code: 'ACCESS_CONTROL', name: 'Control de acceso' },
      { code: 'VENTAS', name: 'Ventas' },
    ]);
    client.setQueryData(
      [...getPermisosQueryKey, 'ACCESS_CONTROL'],
      data.filter((permission) => permission.systemCode === 'ACCESS_CONTROL'),
    );
    client.setQueryData(
      [...getPermisosQueryKey, 'VENTAS'],
      data.filter((permission) => permission.systemCode === 'VENTAS'),
    );
    const findPermisos = vi.fn().mockResolvedValue(data);
    const findAllSystems = vi.fn().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: PermisosApi, useValue: { findPermisos } },
        { provide: SystemApi, useValue: { findAllSystems } },
      ],
    });
    const fixture = TestBed.createComponent(PermisosPage);
    fixture.detectChanges();
    return {
      page: fixture.componentInstance,
      fixture,
      element: fixture.nativeElement as HTMLElement,
      findPermisos,
    };
  }

  it('obtiene los sistemas de su consulta y no carga permisos sin selección', () => {
    const { page, element, findPermisos } = setup();
    expect(page.systems()).toEqual([
      { value: 'ACCESS_CONTROL', label: 'Control de acceso' },
      { value: 'VENTAS', label: 'Ventas' },
    ]);
    expect(page.resources()).toEqual([]);
    expect(element.textContent).toContain('Selecciona un sistema para ver sus permisos');
    expect(findPermisos).not.toHaveBeenCalled();
  });

  it('filtra en cliente, limita los recursos al sistema y permite restablecer los filtros', () => {
    const { page, fixture, element, findPermisos } = setup();
    page.systemControl.setValue('ACCESS_CONTROL');
    page.onSystemChange();
    fixture.detectChanges();
    expect(page.resources().map((option) => option.value)).toEqual(['PERMISOS', 'ROLES']);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);

    page.resourceControl.setValue('ROLES');
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.querySelector('tbody')?.textContent).toContain('Leer roles');

    page.systemControl.setValue('VENTAS');
    page.onSystemChange();
    fixture.detectChanges();
    expect(page.resourceControl.value).toBeNull();
    expect(element.querySelector('tbody')?.textContent).toContain('Leer usuarios');

    page.clearFilters();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(element.textContent).toContain('Selecciona un sistema');
    expect(findPermisos).not.toHaveBeenCalled();
  });

  it('distingue el catálogo vacío de una búsqueda sin coincidencias', () => {
    const empty = setup([]);
    empty.page.systemControl.setValue('ACCESS_CONTROL');
    empty.fixture.detectChanges();
    expect(empty.element.textContent).toContain('No hay permisos disponibles');
    TestBed.resetTestingModule();

    const { page, fixture, element } = setup();
    page.systemControl.setValue('ACCESS_CONTROL');
    page.resourceControl.setValue('NO_EXISTE');
    fixture.detectChanges();
    expect(element.textContent).toContain('Sin coincidencias');
  });

  it('solicita permisos únicamente para el sistema seleccionado', async () => {
    const { page, fixture, findPermisos } = setup();
    expect(findPermisos).not.toHaveBeenCalled();

    page.systemControl.setValue('OTRO');
    fixture.detectChanges();
    await vi.waitFor(() => expect(findPermisos).toHaveBeenCalledWith({ systemCode: 'OTRO' }));

    page.clearFilters();
    fixture.detectChanges();
    expect(findPermisos).toHaveBeenCalledTimes(1);
  });
});
