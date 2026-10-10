import { Component, DestroyRef, HostListener, computed, inject, linkedSignal } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { useSystemsQuery } from '../../../system-portal/actions/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  HeaderSystemRolPage,
  StepActiveProps,
} from './components/header-system-rol/header-system-rol';
import { findRolesQuery, handleRoles, rolesQueryKey } from '../../actions/roles/roles-actions';
import { SystemSelector } from './components/system-selector/system-selector';
import { SystemRolesPanel } from './components/system-roles-panel/system-roles-panel';
import { Dialog } from '@angular/cdk/dialog';
import { Role } from '../../../api/interfaces/access-control/role.interface';
import { CreateRoleDialog } from './components/create-role-dialog/create-role-dialog';
import { getPermisosQuery, getPermisosQueryKey } from '../../actions/permisos/get-permisos-action';
import { Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { RolePermissionPreview } from './components/role-permission-preview/role-permission-preview';
import { PermissionActionsPage } from './components/permission-action/permission-action';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { PendingPermissionsGuard } from './guards/pending-permission/pending-permissions.guard';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { UpdateRoleDialog } from './components/update-role-dialog/update-role.dialog';

@Component({
  imports: [
    TitleHeaderAdmin,
    HeaderSystemRolPage,
    SystemSelector,
    SystemRolesPanel,
    EmptyState,
    RolePermissionPreview,
    PermissionActionsPage,
  ],
  selector: 'app-system-roles',
  templateUrl: './system-roles.page.html',
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = useSystemsQuery();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);
  private readonly queryClient = inject(QueryClient);
  private readonly pendingPermissions = inject(PendingPermissionsGuard);

  constructor() {
    const stopWatching = this.pendingPermissions.watch(() => this.hasPermissionChanges());
    inject(DestroyRef).onDestroy(stopWatching);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (!this.hasPermissionChanges()) return;
    event.preventDefault();
  }

  readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  setSelectedSystem(system: System) {
    const deselect = this.selectedSystem()?.code === system.code;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        system: deselect ? null : system.code,
        roleCode: null,
        step: deselect ? 'system' : 'roles',
      },
      queryParamsHandling: 'merge',
    });
  }

  readonly selectedSystem = computed(
    () =>
      this.systemQuery.data()?.find((system) => system.code === this.queryParams().get('system')) ??
      null,
  );

  protected readonly stepActive = computed<StepActiveProps>(() => {
    if (!this.selectedSystem()) return 'system';
    const requested = this.queryParams().get('step');
    if (requested === 'system' || requested === 'roles') return requested;
    if (requested === 'permisos' || (!requested && this.queryParams().has('roleCode'))) {
      return this.selectedRol() ? 'permisos' : 'roles';
    }
    return 'roles';
  });

  goToStep(step: StepActiveProps) {
    if (step === 'roles' && !this.selectedSystem()) return;
    if (step === 'permisos' && !this.selectedRol()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step },
      queryParamsHandling: 'merge',
    });
  }

  // LOGICA RELACIONA A LOS * ROLES *

  readonly rolesQuery = findRolesQuery(() => this.selectedSystem()?.id);
  readonly mutationDeleteRole = handleRoles().mutationDeleteRole;

  openCreateRoleDialog(system: System) {
    const id = `create-role-${system.id}`;
    this.dialog
      .open<Role, System, CreateRoleDialog>(CreateRoleDialog, {
        id,
        data: system,
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaModal: true,
        ariaLabelledBy: `${id}-title`,
        autoFocus: '[data-dialog-cancel]',
        restoreFocus: true,
        closeOnNavigation: true,
      })
      .closed.subscribe((role) => {
        if (role) {
          this.queryClient.setQueryData<Role[]>([...rolesQueryKey, role.systemId], (roles) =>
            roles ? [...roles, role] : roles,
          );
        }
      });
  }

  openUpdateRolesDialog(role: Role) {
    const id = `update-role-${role.id}`;

    this.dialog
      .open<Role, Role, UpdateRoleDialog>(UpdateRoleDialog, {
        id,
        data: role,
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaModal: true,
        ariaLabelledBy: `${id}-title`,
        autoFocus: '[data-dialog-cancel]',
        restoreFocus: true,
        closeOnNavigation: true,
      })
      .closed.subscribe((updatedRole) => {
        if (!updatedRole) return;

        this.queryClient.setQueryData<Role[]>([...rolesQueryKey, updatedRole.systemId], (roles) =>
          roles?.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
        );
        this.toastService.success('Rol actulizado correctamente', {
          duration: 1000,
        });
      });
  }

  handleDeleteRol(role: Role) {
    this.confirmation
      .confirm({
        title: '¿Eliminar este rol?',
        message: `Se eliminará el rol «${role.name}». Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar rol',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed || this.mutationDeleteRole.isPending()) return;
        this.mutationDeleteRole.mutate(role.id, {
          onSuccess: () => {
            this.queryClient.setQueryData<Role[]>([...rolesQueryKey, role.systemId], (roles) =>
              roles?.filter((item) => item.id !== role.id),
            );
            if (this.selectedRol()?.id === role.id) this.clearSelectedRole();
            this.toastService.success('Rol eliminado correctamente');
          },
          onError: () => this.toastService.error('No se pudo eliminar el rol'),
        });
      });
  }

  // LOGICA RELACIONA A LOS * PERMISOS *

  setSelectedRol(role: Role) {
    const deselect = this.selectedRol()?.id === role.id;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { roleCode: deselect ? null : role.code, step: deselect ? 'roles' : 'permisos' },
      queryParamsHandling: 'merge',
    });
  }

  clearSelectedRole() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { roleCode: null, step: 'roles' },
      queryParamsHandling: 'merge',
    });
  }

  readonly selectedRol = computed(
    () =>
      this.rolesQuery
        .data()
        ?.find(
          (role) =>
            role.systemId === this.selectedSystem()?.id &&
            role.code === this.queryParams().get('roleCode'),
        ) ?? undefined,
  );

  readonly pemrisosQuery = getPermisosQuery(() => {
    const role = this.selectedRol();
    return role && this.stepActive() === 'permisos' ? { roleId: role.id } : undefined;
  });

  readonly selectedPermissionIds = linkedSignal(
    () =>
      new Set(
        (this.pemrisosQuery.data() ?? [])
          .filter((permission) => permission.assigned === true)
          .map((permission) => permission.id),
      ),
  );

  readonly selectedPermissions = computed(() =>
    (this.pemrisosQuery.data() ?? []).filter((permission) =>
      this.selectedPermissionIds().has(permission.id),
    ),
  );

  onPermissionSelectionChange(change: { id: string; assigned: boolean }) {
    this.selectedPermissionIds.update((current) => {
      const next = new Set(current);
      if (change.assigned) next.add(change.id);
      else next.delete(change.id);
      return next;
    });
  }

  onVisiblePermissionsChange(change: { ids: string[]; assigned: boolean }) {
    this.selectedPermissionIds.update((current) => {
      const next = new Set(current);
      for (const id of change.ids) {
        if (change.assigned) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  readonly originalPermissionIds = computed(
    () =>
      new Set(
        (this.pemrisosQuery.data() ?? [])
          .filter((permission) => permission.assigned)
          .map((permission) => permission.id),
      ),
  );

  readonly hasPermissionChanges = computed(() => {
    const selected = this.selectedPermissionIds();
    const original = this.originalPermissionIds();

    return selected.size !== original.size || [...selected].some((id) => !original.has(id));
  });

  readonly mutationReplacePermission = handleRoles().mutationReplacePermission;

  cancelPermissionChanges() {
    this.selectedPermissionIds.set(new Set(this.originalPermissionIds()));
  }

  async saveReplacePermissions() {
    const role = this.selectedRol();
    if (!role || !this.hasPermissionChanges() || this.mutationReplacePermission.isPending()) return;

    const permissionIds = [...this.selectedPermissionIds()];
    try {
      const result = await this.mutationReplacePermission.mutateAsync({
        rolId: role.id,
        permissionIds,
      });
      const savedIds = new Set(result.permissionIds);
      this.queryClient.setQueryData<Permiso[]>(
        [...getPermisosQueryKey, { roleId: role.id, systemCode: undefined }],
        (permissions) =>
          permissions?.map((permission) => ({
            ...permission,
            assigned: savedIds.has(permission.id),
          })),
      );
      this.toastService.success('Permisos guardados correctamente');
    } catch {
      this.toastService.error('No se pudieron guardar los permisos');
    }
  }
}
