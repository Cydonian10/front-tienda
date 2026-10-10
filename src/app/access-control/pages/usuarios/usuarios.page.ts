import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuariosList } from './components/usuarios-list/usuarios-list';
import { UsuarioDetail } from './components/user-detail/usuario-detail';
import { useUsuariosQuery } from '../../actions/usuarios/use-usuarios-api';

@Component({
  imports: [UsuariosList, UsuarioDetail],
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  host: { class: 'block min-w-0 space-y-6' },
})
export default class UsuariosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly findUserQuery = useUsuariosQuery().findUsuariosQuery;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly selectedId = computed(() => this.queryParams().get('usuario'));
  protected readonly selectedUser = computed(
    () => this.findUserQuery.data()?.find((user) => user.id === this.selectedId()) ?? null,
  );

  protected selectUser(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { usuario: id },
      queryParamsHandling: 'merge',
    });
  }

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
