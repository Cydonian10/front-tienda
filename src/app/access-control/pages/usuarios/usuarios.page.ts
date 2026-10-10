import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Icon } from '../../../shared/components/icon/icon';
import { UsuariosList } from './components/usuarios-list/usuarios-list';
import { UsuarioDetail } from './components/user-detail/usuario-detail';
import { UsuarioFormDialog } from './components/usuario-form-dialog/usuario-form-dialog';
import { useUsuariosApi } from '../../actions/usuarios/use-usuarios-api';
import { Usuario } from '../../../api/interfaces/access-control/usuario.interface';

@Component({
  imports: [Icon, UsuariosList, UsuarioDetail],
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  host: { class: 'block min-w-0 space-y-6' },
})
export default class UsuariosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  readonly findUserQuery = useUsuariosApi().findUsuariosQuery;

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

  protected openCreateUser(): void {
    this.dialog
      .open<string>(UsuarioFormDialog, {
        id: 'create-user',
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaModal: true,
        ariaLabelledBy: 'create-user-title',
        autoFocus: '[data-dialog-cancel]',
        restoreFocus: true,
        closeOnNavigation: true,
      })
      .closed.subscribe((id) => {
        if (!id) return;
        this.search.set('');
        this.status.set('all');
        this.selectUser(id);
      });
  }

  protected openEditUser(user: Usuario): void {
    const id = `edit-user-${user.id}`;
    this.dialog.open<string, Usuario, UsuarioFormDialog>(UsuarioFormDialog, {
      id,
      data: user,
      width: '36rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
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
