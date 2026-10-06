import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { RolesApi } from '../../../../api/access-control/roles-api';
import { Role } from '../../../../api/interfaces/access-control/role.interface';
import { CreateRoleDialog } from './create-role-dialog';

describe('CreateRoleDialog', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const create = vi.fn().mockResolvedValue({ id: 'role-1', systemId: 'system-1' } as Role);
    const close = vi.fn();
    const dialogRef = { id: 'create-role-system-1', disableClose: false, close };
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: DIALOG_DATA, useValue: { id: 'system-1', name: 'Ventas' } },
        { provide: DialogRef, useValue: dialogRef },
        { provide: RolesApi, useValue: { create } },
      ],
    });
    const fixture = TestBed.createComponent(CreateRoleDialog);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const name = element.querySelector('input')!;
    const description = element.querySelector('textarea')!;

    function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    }

    return { fixture, element, name, description, type, create, close, dialogRef };
  }

  it('muestra el error de nombre obligatorio, incluso cuando solo hay espacios', async () => {
    const { fixture, element, name, type, create } = setup();
    type(name, '   ');
    await fixture.componentInstance.save();
    fixture.detectChanges();

    expect(element.textContent).toContain('El nombre es obligatorio.');
    expect(name.getAttribute('aria-describedby')).toBe('create-role-system-1-name-errors');
    expect(create).not.toHaveBeenCalled();
  });

  it('exige dos caracteres en el nombre sin contar espacios', async () => {
    const { fixture, element, name, type, create } = setup();
    type(name, ' a ');
    await fixture.componentInstance.save();
    fixture.detectChanges();

    expect(element.textContent).toContain('El nombre debe tener al menos 2 caracteres.');
    expect(create).not.toHaveBeenCalled();
  });

  it('permite descripción vacía y envía el nombre sin espacios laterales', async () => {
    const { fixture, element, name, type, create, close } = setup();
    type(name, ' Admin ');
    await fixture.componentInstance.save();
    fixture.detectChanges();

    expect(create).toHaveBeenCalledWith({ systemId: 'system-1', name: 'Admin', description: '' });
    expect(close).toHaveBeenCalledWith({ id: 'role-1', systemId: 'system-1' });
    expect(element.querySelector('button[type="submit"]')?.getAttribute('form')).toBe(
      'create-role-system-1-form',
    );
  });
});
