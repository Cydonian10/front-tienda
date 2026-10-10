import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthPerfil } from '../../../api/interfaces/access-control/auth.interface';
import { AuthStore } from '../../../store/auth/auth.store';
import PerfilPage from './perfil.page';

describe('PerfilPage', () => {
  const profile: AuthPerfil = {
    id: 'employee-1',
    email: 'alex.rivera@empresa.com',
    nickName: 'alexrivera',
    emailVerified: true,
    active: true,
    person: {
      id: 'person-1',
      firstName: 'Alex',
      lastName: 'Rivera',
      dateOfBirth: '1994-06-18T00:00:00Z',
      identityDocument: '12345678',
      active: true,
    },
    roles: [
      { id: 'role-1', code: 'ADMIN', name: 'Administrador', description: 'Gestiona accesos.' },
    ],
    permissions: [
      {
        id: 'p1',
        code: 'users.read',
        systemCode: 'ACCESS_CONTROL',
        name: 'Ver usuarios',
        resourceCode: 'users',
        actionCode: 'READ',
      },
      {
        id: 'p2',
        code: 'roles.read',
        systemCode: 'ACCESS_CONTROL',
        name: 'Ver roles',
        resourceCode: 'roles',
        actionCode: 'READ',
      },
      {
        id: 'p3',
        code: 'users.create',
        systemCode: 'ACCESS_CONTROL',
        name: 'Crear usuarios',
        resourceCode: 'users',
        actionCode: 'CREATE',
      },
    ],
  };

  afterEach(() => TestBed.resetTestingModule());

  function setup(value: AuthPerfil | null = profile) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const store = TestBed.inject(AuthStore);
    if (value) store.setProfile(value);
    const fixture = TestBed.createComponent(PerfilPage);
    fixture.detectChanges();
    return {
      fixture,
      page: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
      store,
    };
  }

  it('renders real account and personal data, initials and assigned access', () => {
    const { page, element } = setup();
    expect(page.initials()).toBe('AR');
    expect(element.querySelector('#profile-name')?.textContent?.trim()).toBe('Alex Rivera');
    expect(element.textContent).toContain('@alexrivera');
    expect(element.textContent).toContain('alex.rivera@empresa.com');
    expect(element.textContent).toContain('12345678');
    expect(element.textContent).toContain('18 de junio de 1994');
    expect(element.textContent).toContain('Administrador');
    expect(element.querySelector('[aria-label="Total de roles"]')?.textContent?.trim()).toBe('1');
    expect(element.querySelector('[aria-label="Total de permisos"]')?.textContent?.trim()).toBe(
      '3',
    );
    expect(element.querySelectorAll('.permission-chip')).toHaveLength(3);
    expect(element.querySelector('input, button')).toBeNull();
  });

  it('groups permissions by resource while preserving their names and action codes', () => {
    const { page } = setup();
    expect(page.permissionGroups().map((group) => [group.label, group.permissions.length])).toEqual(
      [
        ['Usuarios', 2],
        ['Roles', 1],
      ],
    );
    expect(page.permissionGroups()[0].permissions[1].actionCode).toBe('CREATE');
  });

  it('reacts to profile changes without keeping a stale identity', () => {
    const { fixture, page, store } = setup();
    store.setProfile({
      ...profile,
      person: { ...profile.person, firstName: 'María', lastName: 'Gómez' },
    });
    fixture.detectChanges();
    expect(page.fullName()).toBe('María Gómez');
    expect(page.initials()).toBe('MG');
    store.clear();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu perfil no está disponible');
    expect(fixture.nativeElement.textContent).not.toContain('alex.rivera@empresa.com');
  });

  it('shows inactive and unverified states instead of claiming the account is active', () => {
    const { element } = setup({
      ...profile,
      active: false,
      emailVerified: false,
      person: { ...profile.person, active: false },
    });
    expect(element.textContent).toContain('Cuenta inactiva');
    expect(element.textContent).toContain('Correo sin verificar');
    expect(element.textContent).toContain('Pendiente');
    expect(element.querySelectorAll('.badge-error')).toHaveLength(3);
  });

  it('provides honest empty states for roles and permissions', () => {
    const { element } = setup({ ...profile, roles: [], permissions: [] });
    expect(element.textContent).toContain('No tienes roles asignados.');
    expect(element.textContent).toContain('No tienes permisos asignados.');
    expect(element.querySelectorAll('.permission-chip')).toHaveLength(0);
    expect(element.querySelector('[aria-label="Total de permisos"]')?.textContent?.trim()).toBe(
      '0',
    );
  });

  it('keeps unknown resource codes visible without fabricating labels', () => {
    const { page } = setup({
      ...profile,
      permissions: [
        { ...profile.permissions[0], resourceCode: 'CUSTOM_RESOURCE' },
        { ...profile.permissions[1], resourceCode: 'constructor' },
      ],
    });
    expect(page.permissionGroups().map((group) => group.label)).toEqual([
      'CUSTOM_RESOURCE',
      'constructor',
    ]);
  });

  it.each(['', 'invalid', '1994-02-31'])(
    'handles an absent or invalid birth date (%s)',
    (value) => {
      const { page } = setup({
        ...profile,
        person: { ...profile.person, dateOfBirth: value, identityDocument: '' },
      });
      expect(page.personalRows().find((row) => row.label === 'Fecha de nacimiento')?.value).toBe(
        'No registrada',
      );
      expect(page.personalRows().find((row) => row.label === 'Documento de identidad')?.value).toBe(
        'No registrado',
      );
    },
  );

  it('provides a recovery link if the profile is unavailable', () => {
    const { element } = setup(null);
    expect(element.textContent).toContain('Tu perfil no está disponible');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/admin/access-control/perfil');
  });

  it('falls back to the username if the personal name is not recorded', () => {
    const { page } = setup({
      ...profile,
      nickName: 'maria',
      person: { ...profile.person, firstName: '', lastName: '' },
    });
    expect(page.fullName()).toBe('maria');
    expect(page.initials()).toBe('M');
  });

  it('formats a leap-day birth date without changing the calendar day', () => {
    const { page } = setup({
      ...profile,
      person: { ...profile.person, dateOfBirth: '2000-02-29' },
    });
    expect(page.personalRows().find((row) => row.label === 'Fecha de nacimiento')?.value).toBe(
      '29 de febrero de 2000',
    );
  });
});
