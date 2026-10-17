import { TestBed } from '@angular/core/testing';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { AuthPerfil } from '../../api/interfaces/access-control/auth.interface';
import { AuthStore } from '../../store/auth/auth.store';
import { usePermissions } from './use-permissions';

describe('usePermissions', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reacciona a cambios de perfil y comprueba también el sistema', () => {
    const permissions = TestBed.runInInjectionContext(() =>
      usePermissions('INVENTARIO', {
        create: PERMISSION_CODES.ATRIBUTOS_CREATE,
        edit: PERMISSION_CODES.ATRIBUTOS_UPDATE,
      }),
    );
    const store = TestBed.inject(AuthStore);
    const profile: AuthPerfil = {
      id: 'user-1',
      email: 'user@example.com',
      nickName: 'user',
      emailVerified: true,
      active: true,
      person: {
        id: 'person-1',
        firstName: 'User',
        lastName: 'Test',
        dateOfBirth: '2000-01-01',
        identityDocument: '123',
        active: true,
      },
      roles: [],
      permissions: [],
    };

    expect(permissions.create()).toBe(false);
    store.setProfile({
      ...profile,
      permissions: [
        {
          id: 'permission-1',
          code: PERMISSION_CODES.ATRIBUTOS_CREATE,
          systemCode: 'OTRO',
          name: 'Crear',
          resourceCode: 'ATRIBUTOS',
          actionCode: 'CREAR',
        },
      ],
    });
    expect(permissions.create()).toBe(false);

    store.setProfile({
      ...profile,
      permissions: [
        {
          id: 'permission-1',
          code: PERMISSION_CODES.ATRIBUTOS_CREATE,
          systemCode: 'INVENTARIO',
          name: 'Crear',
          resourceCode: 'ATRIBUTOS',
          actionCode: 'CREAR',
        },
      ],
    });
    expect(permissions.create()).toBe(true);
    expect(permissions.edit()).toBe(false);

    store.setProfile({ ...profile, isSuperAdmin: true });
    expect(permissions.edit()).toBe(true);

    store.clear();
    expect(permissions.create()).toBe(false);
    expect(permissions.edit()).toBe(false);
  });
});
