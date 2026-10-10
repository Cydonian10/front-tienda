import { Component, computed, signal } from '@angular/core';
import { UsuariosList } from './components/usuarios-list/usuarios-list';
import { useUsuariosQuery } from '../../actions/usuarios/use-usuarios-api';

@Component({
  imports: [UsuariosList],
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  host: { class: 'block min-w-0 space-y-6' },
})
export default class UsuariosPage {
  readonly findUserQuery = useUsuariosQuery().findUsuariosQuery;

  protected readonly search = signal('');
  protected readonly status = signal('all');

  protected readonly filteredUsers = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('es');
    const usuarios = this.findUserQuery.data() ?? [];
    return usuarios.filter(
      (user) =>
        (this.status() === 'all' || (this.status() === 'active') === user.active) &&
        (!term ||
          [
            user.person.firstName,
            user.person.lastName,
            user.email,
            user.person.identityDocument,
            user.nickName,
          ].some((value) => value.toLocaleLowerCase('es').includes(term))),
    );
  });
}
