import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject, of } from 'rxjs';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import { Usuario } from '../../../api/interfaces/access-control/usuario.interface';
import { useUsuariosQueryKey } from '../../actions/usuarios/use-usuarios-api';
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
      id: 'edit-user-user-1', data: users[0],
    }));
    fixture.destroy();
  });
});
