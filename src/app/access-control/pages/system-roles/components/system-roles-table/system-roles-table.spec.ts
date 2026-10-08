import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Role } from '../../../../../api/interfaces/access-control/role.interface';
import { SystemRolesTable } from './system-roles-table';

describe('SystemRolesTable', () => {
  const role: Role = {
    id: 'role-1',
    systemId: 'system-1',
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Administra el sistema',
    permissions: [],
  };

  let activeFixture: ComponentFixture<SystemRolesTable> | undefined;

  function setup() {
    const fixture = TestBed.createComponent(SystemRolesTable);
    activeFixture = fixture;
    fixture.componentRef.setInput('roles', [role]);
    fixture.componentRef.setInput('systemName', 'Control de acceso');
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  afterEach(() => {
    activeFixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('opens the row menu and emits the selected role for edit and delete', () => {
    const { fixture, component } = setup();
    const edited = vi.fn();
    const deleted = vi.fn();
    component.editRole.subscribe(edited);
    component.deleteRole.subscribe(deleted);

    const trigger = fixture.nativeElement.querySelector(
      'button[aria-label="Más acciones para Administrador"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    trigger.click();
    fixture.detectChanges();

    let menu = document.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Editar');
    expect(menu.textContent).toContain('Eliminar');

    (menu.querySelector('[role="menuitem"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(edited).toHaveBeenCalledTimes(1);
    expect(edited).toHaveBeenCalledWith(role);
    expect(document.querySelector('[role="menu"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    menu = document.querySelector('[role="menu"]') as HTMLElement;
    const deleteItem = [...menu.querySelectorAll('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('Eliminar'),
    ) as HTMLButtonElement;
    deleteItem.click();
    fixture.detectChanges();

    expect(deleted).toHaveBeenCalledTimes(1);
    expect(deleted).toHaveBeenCalledWith(role);
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('keeps the permissions action visible beside the menu trigger', () => {
    const { fixture } = setup();

    expect(fixture.nativeElement.textContent).toContain('Permisos');
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Más acciones para Administrador"]'),
    ).toBeTruthy();
  });
});
