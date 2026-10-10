import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject, of } from 'rxjs';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import { SystemApi } from '../../../api/access-control/system-api';
import { Usuario } from '../../../api/interfaces/access-control/usuario.interface';
import { findSystemsQueryKey } from '../../../system-portal/actions/find-systems-action';
import { useUsuariosQueryKey } from '../../actions/usuarios/use-usuarios-api';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';
import UsuariosPage from './usuarios.page';

describe('UsuariosPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('restaura el usuario de la URL y actualiza la selección al cambiar el query param', () => {
    const users: Usuario[] = [
      {
        id: 'user-1', email: 'ana@example.com', nickName: 'ana', emailVerified: true,
        active: true, person: {
          id: 'person-1', firstName: 'Ana', lastName: 'Rojas', identityDocument: '12345678',
          dateOfBirth: '1990-01-31', active: true,
        }, roles: [],
      },
      {
        id: 'user-2', email: 'luis@example.com', nickName: 'luis', emailVerified: false,
        active: true, person: {
          id: 'person-2', firstName: 'Luis', lastName: 'Pérez', identityDocument: '87654321',
          dateOfBirth: '1992-01-31', active: true,
        }, roles: [],
      },
    ];
    const params = new BehaviorSubject(convertToParamMap({ usuario: 'user-2' }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...useUsuariosQueryKey], users);
    const systems = [
      { id: 'system-1', code: 'VENTAS', name: 'Ventas', description: '', active: true, order: 1 },
    ];
    client.setQueryData([...findSystemsQueryKey], systems);
    const navigate = vi.fn().mockResolvedValue(true);
    const open = vi.fn().mockReturnValue({ closed: of('user-1') });
    const route = { queryParamMap: params, snapshot: { queryParamMap: params.value } };

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: { navigate } },
        { provide: Dialog, useValue: { open } },
        { provide: UsuariosApi, useValue: { findUsuarios: vi.fn().mockResolvedValue(users) } },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn().mockResolvedValue(systems) } },
      ],
    });

    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Detalle del usuario"]')?.textContent)
      .toContain('Luis Pérez');
    expect(fixture.nativeElement.querySelector('[aria-label="Ver detalle de Luis Pérez"]')
      ?.getAttribute('aria-pressed')).toBe('true');

    (fixture.nativeElement.querySelector('[aria-label="Ver detalle de Ana Rojas"]') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { usuario: 'user-1' },
      queryParamsHandling: 'merge',
    });

    params.next(convertToParamMap({ usuario: 'user-1' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Detalle del usuario"]')?.textContent)
      .toContain('Ana Rojas');

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalled();
    (fixture.nativeElement.querySelector('app-usuario-detail button') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      id: 'assign-role-user-1', data: { user: users[0], systems },
    }));
    (fixture.nativeElement.querySelector('app-usuario-detail button:last-child') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      id: 'edit-user-user-1', data: users[0],
    }));
    fixture.destroy();
  });

  it('confirma antes de quitar un rol y actualiza la lista al eliminarlo', async () => {
    const user: Usuario = {
      id: 'user-1', email: 'ana@example.com', nickName: 'ana', emailVerified: true,
      active: true, person: {
        id: 'person-1', firstName: 'Ana', lastName: 'Rojas', identityDocument: '12345678',
        dateOfBirth: '1990-01-31', active: true,
      }, roles: [{ id: 'assignment-1', name: 'Administrador', inicio: null, fin: null }],
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([...useUsuariosQueryKey], [user]);
    client.setQueryData([...findSystemsQueryKey], []);
    const confirm = vi.fn().mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    const removeRoles = vi.fn().mockResolvedValue(undefined);
    const success = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ActivatedRoute, useValue: {
          queryParamMap: of(convertToParamMap({ usuario: user.id })),
          snapshot: { queryParamMap: convertToParamMap({ usuario: user.id }) },
        } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Dialog, useValue: { open: vi.fn() } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: ToastService, useValue: { success, error: vi.fn() } },
        { provide: UsuariosApi, useValue: {
          findUsuarios: vi.fn().mockResolvedValue([user]), removeRoles,
        } },
        { provide: SystemApi, useValue: { findAllSystems: vi.fn().mockResolvedValue([]) } },
      ],
    });

    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const removeButton = fixture.nativeElement.querySelector('[aria-label="Quitar rol Administrador"]') as HTMLButtonElement;
    removeButton.click();
    expect(removeRoles).not.toHaveBeenCalled();
    removeButton.click();
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }));
    await vi.waitFor(() => expect(success).toHaveBeenCalled());
    expect(removeRoles).toHaveBeenCalledWith('user-1', 'assignment-1');
    expect(client.getQueryData<Usuario[]>([...useUsuariosQueryKey])?.[0].roles).toEqual([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Este usuario aún no tiene roles asignados.');
    fixture.destroy();
  });
});
