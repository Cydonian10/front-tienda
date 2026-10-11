import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Icon } from '../../../shared/components/icon/icon';
import { UsuariosList } from './components/usuarios-list/usuarios-list';
import { UsuarioDetail } from './components/user-detail/usuario-detail';
import { UsuarioFormDialog } from './components/usuario-form-dialog/usuario-form-dialog';
import {
  AsignarRolDialog,
  AssignRoleData,
} from './components/asignar-rol-dialog/asignar-rol-dialog';
import { useUsuariosApi } from '../../actions/usuarios/use-usuarios-api';
import { Usuario, UsuarioRole } from '../../../api/interfaces/access-control/usuario.interface';
import { useSystemsQuery } from '../../../system-portal/actions/find-systems-action';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';

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
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly usuariosApi = useUsuariosApi();
  readonly findUserQuery = this.usuariosApi.findUsuariosQuery;
  readonly removeRolesMutation = this.usuariosApi.removeRolesMutation;
  readonly systemsQuery = useSystemsQuery();

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

  protected openAssignRole(user: Usuario): void {
    const systems = this.systemsQuery.data() ?? [];
    if (!systems.length) return;

    const id = `assign-role-${user.id}`;
    this.dialog.open<void, AssignRoleData, AsignarRolDialog>(AsignarRolDialog, {
      id,
      data: { user, systems },
      width: '36rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }

  protected removeRole(user: Usuario, role: UsuarioRole): void {
    if (this.removeRolesMutation.isPending()) return;

    this.confirmation
      .confirm({
        title: '¿Quitar este rol?',
        message: `Se quitará el rol «${role.name}» de ${user.person.firstName} ${user.person.lastName}.`,
        confirmText: 'Quitar rol',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed || this.removeRolesMutation.isPending()) return;
        this.removeRolesMutation.mutate(
          { userId: user.id, assignadoId: role.id },
          {
            onSuccess: () => this.toast.success('Rol quitado correctamente'),
          },
        );
      });
  }

  protected readonly assignRoleDisabled = computed(
    () =>
      this.systemsQuery.isPending() ||
      this.systemsQuery.isError() ||
      !this.systemsQuery.data()?.length,
  );

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
