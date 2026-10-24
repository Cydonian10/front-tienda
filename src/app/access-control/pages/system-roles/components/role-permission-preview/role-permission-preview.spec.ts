import { TestBed } from '@angular/core/testing';
import { Permiso } from '../../../../../api/interfaces/access-control/permision.interface';
import { RolePermissionPreview } from './role-permission-preview';

const permissions: Permiso[] = [
  {
    id: 'read',
    name: 'Leer usuarios',
    systemCode: 'ACCESS_CONTROL',
    systemName: 'Administración',
    systemId: 'system',
    resourceCode: 'USUARIOS',
    actionCode: 'LEER',
    code: 'USUARIOS_LEER',
  },
  {
    id: 'create',
    name: 'Crear usuarios',
    systemCode: 'ACCESS_CONTROL',
    systemName: 'Administración',
    systemId: 'system',
    resourceCode: 'USUARIOS',
    actionCode: 'CREAR',
    code: 'USUARIOS_CREAR',
  },
];

describe('RolePermissionPreview', () => {
  afterEach(() => TestBed.resetTestingModule());
  function setup() {
    const fixture = TestBed.createComponent(RolePermissionPreview);
    fixture.componentRef.setInput('roleName', 'Encargado');
    fixture.componentRef.setInput('systemName', 'Administración');
    fixture.componentRef.setInput('systemCode', 'ACCESS_CONTROL');
    fixture.componentRef.setInput('permissions', permissions);
    fixture.componentRef.setInput('selectedPermissionIds', new Set(['read']));
    fixture.detectChanges();
    return fixture;
  }

  it('muestra grupos y deja los permisos individuales en un detalle cerrado', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain('Administrar usuarios');
    expect(fixture.nativeElement.querySelector('details').open).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Parcial');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('conserva selección y búsqueda de excepciones individuales', () => {
    const fixture = setup();
    const change = vi.fn();
    fixture.componentInstance.permissionSelectionChange.subscribe(change);
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'crear';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(
      fixture.componentInstance.visiblePermissions().map((permission) => permission.id),
    ).toEqual(['create']);
    (
      fixture.nativeElement.querySelector('[data-individual-permission]') as HTMLInputElement
    ).click();
    expect(change).toHaveBeenCalledWith({ id: 'create', assigned: true });
    expect(fixture.componentInstance.selectedPermissionIds()).toEqual(new Set(['read']));
  });

  it('explica el acceso total del superadministrador sin ofrecer edición', () => {
    const fixture = setup();
    fixture.componentRef.setInput('protectedRole', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Acceso completo a todos los sistemas');
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('details')).toBeNull();
  });

  it('bloquea también los eventos de edición cuando es de consulta', () => {
    const fixture = setup();
    const change = vi.fn();
    fixture.componentInstance.permissionSelectionChange.subscribe(change);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]',
    ) as NodeListOf<HTMLInputElement>;
    expect([...checkboxes].every((input) => input.disabled)).toBe(true);
    fixture.componentInstance.onPermissionChange('create', {
      target: { checked: true },
    } as unknown as Event);
    expect(change).not.toHaveBeenCalled();
  });
});
