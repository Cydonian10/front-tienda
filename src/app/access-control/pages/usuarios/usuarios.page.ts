import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { UsuariosList } from './components/usuarios-list/usuarios-list';
import {
  UsuarioFormDialog,
  UserFormResult,
} from './components/usuario-form-dialog/usuario-form-dialog';
import { DEMO_ROLES, DEMO_SYSTEMS, DEMO_USERS, DemoUser, demoFullName } from './usuarios-demo.data';
import {
  AssignRoleResult,
  AsignarRolDialog,
} from './components/asignar-rol-dialog/asignar-rol-dialog';
import { UsuarioDetail } from './components/user-detail/usuario-detail';

@Component({
  imports: [Icon, UsuariosList, UsuarioDetail],
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  host: { class: 'block min-w-0 space-y-6' },
})
export default class UsuariosPage {
  private readonly dialog = inject(Dialog);
  private readonly confirmation = inject(ConfirmDialogService);
  protected readonly systems = DEMO_SYSTEMS;
  protected readonly roles = DEMO_ROLES;
  protected readonly users = signal<DemoUser[]>(structuredClone(DEMO_USERS));
  protected readonly selectedId = signal<string | null>(DEMO_USERS[0]?.id ?? null);
  protected readonly search = signal('');
  protected readonly status = signal('all');
  protected readonly filteredUsers = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('es');
    return this.users().filter(
      (user) =>
        (this.status() === 'all' || (this.status() === 'active') === user.active) &&
        (!term ||
          [demoFullName(user), user.email, user.person.identityDocument, user.nickName].some(
            (value) => value.toLocaleLowerCase('es').includes(term),
          )),
    );
  });
  protected readonly selectedUser = computed(
    () => this.users().find((user) => user.id === this.selectedId()) ?? null,
  );

  protected openUserForm(user: DemoUser | null = null): void {
    const id = user ? `edit-demo-user-${user.id}` : 'create-demo-user';
    this.dialog
      .open<UserFormResult, { user: DemoUser | null; users: DemoUser[] }, UsuarioFormDialog>(
        UsuarioFormDialog,
        {
          id,
          data: { user, users: this.users() },
          width: '32rem',
          maxWidth: 'calc(100vw - 2rem)',
          ariaModal: true,
          ariaLabelledBy: `${id}-title`,
          autoFocus: '[data-dialog-cancel]',
          restoreFocus: true,
          closeOnNavigation: true,
        },
      )
      .closed.subscribe((result) => {
        if (!result) return;
        if (user) {
          this.users.update((users) =>
            users.map((item) => (item.id === user.id ? { ...item, ...result } : item)),
          );
        } else {
          const created: DemoUser = { ...result, id: crypto.randomUUID(), roles: [] };
          this.users.update((users) => [created, ...users]);
          this.selectedId.set(created.id);
          this.search.set('');
          this.status.set('all');
        }
      });
  }

  protected openAssignRole(): void {
    const user = this.selectedUser();
    if (!user) return;
    const id = `assign-demo-role-${user.id}`;
    this.dialog
      .open<
        AssignRoleResult,
        { user: DemoUser; systems: typeof DEMO_SYSTEMS; roles: typeof DEMO_ROLES },
        AsignarRolDialog
      >(AsignarRolDialog, {
        id,
        data: { user, systems: this.systems, roles: this.roles },
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaModal: true,
        ariaLabelledBy: `${id}-title`,
        autoFocus: '[data-dialog-cancel]',
        restoreFocus: true,
        closeOnNavigation: true,
      })
      .closed.subscribe((result) => {
        if (!result) return;
        this.users.update((users) =>
          users.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  roles: [...item.roles, { ...result, id: crypto.randomUUID(), userId: item.id }],
                }
              : item,
          ),
        );
      });
  }

  protected removeRole(assignmentId: string): void {
    const user = this.selectedUser();
    const assignment = user?.roles.find((item) => item.id === assignmentId);
    const role = this.roles.find((item) => item.id === assignment?.roleId);
    if (!user || !assignment || !role) return;
    this.confirmation
      .confirm({
        title: '¿Quitar este rol?',
        message: `Se quitará el rol «${role.name}» de ${demoFullName(user)} en esta demostración.`,
        confirmText: 'Quitar rol',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.users.update((users) =>
          users.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  roles: item.roles.filter((entry) => entry.id !== assignmentId),
                }
              : item,
          ),
        );
      });
  }
}
