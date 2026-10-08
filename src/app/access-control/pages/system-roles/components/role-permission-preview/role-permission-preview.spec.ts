import { TestBed } from '@angular/core/testing';
import { Permiso } from '../../../../api/interfaces/access-control/permision.interface';
import { RolePermissionPreview } from './role-permission-preview/role-permission-preview';

describe('RolePermissionPreview', () => {
  it('agrupa el resumen por recurso y actualiza los seleccionados', () => {
    const permissions: Permiso[] = [
      {
        id: 'read',
        name: 'Leer usuarios',
        systemCode: 'ADMIN',
        systemName: 'Admin',
        systemId: 'system-1',
        resourceCode: 'USUARIOS',
        actionCode: 'LEER',
        code: 'USUARIOS_LEER',
        assigned: true,
      },
      {
        id: 'create',
        name: 'Crear usuarios',
        systemCode: 'ADMIN',
        systemName: 'Admin',
        systemId: 'system-1',
        resourceCode: 'USUARIOS',
        actionCode: 'CREAR',
        code: 'USUARIOS_CREAR',
        assigned: false,
      },
      {
        id: 'status',
        name: 'Estado personas',
        systemCode: 'ADMIN',
        systemName: 'Admin',
        systemId: 'system-1',
        resourceCode: 'PERSONAS',
        actionCode: 'ESTADO',
        code: 'PERSONAS_ESTADO',
        assigned: false,
      },
    ];
    const fixture = TestBed.createComponent(RolePermissionPreview);
    fixture.componentRef.setInput('roleName', 'Administrador');
    fixture.componentRef.setInput('systemName', 'Admin');
    fixture.componentRef.setInput('permissions', permissions);
    fixture.componentRef.setInput('selectedPermissionIds', new Set(['read']));
    fixture.detectChanges();

    const summary = () => fixture.nativeElement.querySelector('aside')!.textContent as string;
    expect(summary()).toMatch(/USUARIOS\s*1\s*\/\s*2/);
    expect(summary()).toMatch(/PERSONAS\s*0\s*\/\s*1/);

    fixture.componentRef.setInput('selectedPermissionIds', new Set(['read', 'create', 'status']));
    fixture.detectChanges();
    expect(summary()).toMatch(/USUARIOS\s*2\s*\/\s*2/);
    expect(summary()).toMatch(/PERSONAS\s*1\s*\/\s*1/);

    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'crear';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.visiblePermissions().map((permission) => permission.id)).toEqual([
      'create',
    ]);
    expect(fixture.nativeElement.querySelector('tbody')!.textContent).not.toContain('Leer usuarios');

    fixture.componentInstance.currentResourceCode.set('PERSONAS');
    fixture.detectChanges();
    expect(fixture.componentInstance.visiblePermissions()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay permisos que coincidan');

    search.value = 'estado';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.visiblePermissions().map((permission) => permission.id)).toEqual([
      'status',
    ]);
  });
});
