import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../../../api/access-control/usuarios-api';
import { Usuario } from '../../../../../api/interfaces/access-control/usuario.interface';
import { useUsuariosQueryKey } from '../../../../actions/usuarios/use-usuarios-api';
import { UsuarioFormDialog } from './usuario-form-dialog';

describe('UsuarioFormDialog', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('valida los campos y añade el usuario creado al listado sin volver a consultarlo', async () => {
    const user: Usuario = {
      id: 'nuevo', email: 'ana@example.com', nickName: 'ana', emailVerified: false,
      active: true, person: {
        id: 'persona-nueva', firstName: 'Ana', lastName: 'Rojas', identityDocument: '12345678',
        dateOfBirth: '1990-01-31', active: true,
      }, roles: [],
    };
    const create = vi.fn().mockResolvedValue(user);
    const findUsuarios = vi.fn();
    const close = vi.fn();
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    client.setQueryData([...useUsuariosQueryKey], []);

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: UsuariosApi, useValue: { create, findUsuarios } },
        { provide: DialogRef, useValue: { id: 'create-user', close, disableClose: false } },
      ],
    });
    const fixture = TestBed.createComponent(UsuarioFormDialog);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(create).not.toHaveBeenCalled();

    const fill = (selector: string, value: string) => {
      const input = form.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    fill('[autocomplete="given-name"]', 'Ana');
    fill('[autocomplete="family-name"]', 'Rojas');
    fill('input:not([type]):not([autocomplete])', '12345678');
    fill('[type="date"]', '1990-01-31');
    fill('[type="email"]', 'ana@example.com');
    fill('[autocomplete="username"]', 'ana');
    fill('[type="password"]', '12345678');
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledWith('nuevo');
    });
    expect(client.getQueryData([...useUsuariosQueryKey])).toEqual([user]);
    expect(findUsuarios).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
