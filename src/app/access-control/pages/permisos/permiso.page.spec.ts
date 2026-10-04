import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { getPermisosQueryKey } from '../../actions/permisos/get-permisos-action';
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
    client.setQueryData([...getPermisosQueryKey, {}], data);
    const findPermisos = vi.fn().mockResolvedValue(data);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: PermisosApi, useValue: { findPermisos } },
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

  it('genera las opciones de la consulta y muestra todos los campos de los permisos', () => {
    const { page, element } = setup();
    expect(page.systems()).toEqual([
      { value: 'ACCESS_CONTROL', label: 'Control de acceso' },
      { value: 'VENTAS', label: 'Ventas' },
    ]);
    expect(page.resources().map((option) => option.value)).toEqual([
      'PERMISOS',
      'ROLES',
      'USUARIOS',
    ]);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.textContent).toContain('Control de acceso');
    expect(element.textContent).toContain('PERMISOS_LEER');
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
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(findPermisos).not.toHaveBeenCalled();
  });

  it('distingue el catálogo vacío de una búsqueda sin coincidencias', () => {
    expect(setup([]).element.textContent).toContain('No hay permisos disponibles');
    TestBed.resetTestingModule();

    const { page, fixture, element } = setup();
    page.resourceControl.setValue('NO_EXISTE');
    fixture.detectChanges();
    expect(element.textContent).toContain('Sin coincidencias');
  });
});
