import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { DEMO_ROLES, DEMO_SYSTEMS, DEMO_USERS } from '../usuarios-demo.data';
import { AsignarRolDialog } from './asignar-rol-dialog';
import { UsuarioFormDialog } from './usuario-form-dialog';

describe('Diálogos de usuarios de prueba', () => {
  it('rechaza fechas invertidas y roles ya asignados', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AsignarRolDialog],
      providers: [
        { provide: DialogRef, useValue: { id: 'assign-test', close } },
        {
          provide: DIALOG_DATA,
          useValue: { user: DEMO_USERS[0], systems: DEMO_SYSTEMS, roles: DEMO_ROLES },
        },
      ],
    }).compileComponents();
    const dialog = TestBed.createComponent(AsignarRolDialog).componentInstance;
    dialog.form.setValue({
      systemId: 'system-inventory',
      roleId: 'role-inventory-operator',
      validFrom: '2026-10-10',
      validUntil: '2026-10-09',
    });
    dialog.save();
    expect(close).not.toHaveBeenCalled();
    dialog.form.patchValue({
      systemId: 'system-sales',
      roleId: 'role-sales-supervisor',
      validUntil: '',
    });
    dialog.save();
    expect(close).not.toHaveBeenCalled();
    dialog.form.patchValue({ systemId: 'system-inventory', roleId: 'role-inventory-operator' });
    dialog.save();
    expect(close).toHaveBeenCalledWith({
      roleId: 'role-inventory-operator',
      validFrom: '2026-10-10',
      validUntil: null,
    });
  });

  it('rechaza correos duplicados y nombres vacíos antes de crear', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [UsuarioFormDialog],
      providers: [
        { provide: DialogRef, useValue: { id: 'user-test', close } },
        { provide: DIALOG_DATA, useValue: { user: null, users: DEMO_USERS } },
      ],
    }).compileComponents();
    const dialog = TestBed.createComponent(UsuarioFormDialog).componentInstance;
    dialog.form.setValue({
      firstName: ' ',
      lastName: 'Prueba',
      identityDocument: '1234',
      dateOfBirth: '1990-01-01',
      email: 'nuevo@example.com',
      nickName: 'nuevo',
      active: true,
      emailVerified: false,
    });
    dialog.save();
    expect(close).not.toHaveBeenCalled();
    dialog.form.patchValue({ firstName: 'Nuevo', email: 'gabriel@example.com' });
    dialog.save();
    expect(close).not.toHaveBeenCalled();
    dialog.form.patchValue({ email: 'nuevo@example.com' });
    dialog.save();
    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nuevo@example.com', nickName: 'nuevo' }),
    );
  });
});
