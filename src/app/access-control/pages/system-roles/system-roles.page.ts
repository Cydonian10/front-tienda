import { Component, computed, inject } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderSystemRolPage, StepActiveProps } from './components/header-system-rol';
import { findRolesQuery, rolesQueryKey } from '../../actions/roles/roles-actions';
import { SystemSelector } from './components/system-selector';
import { SystemRolesPanel } from './components/system-roles-panel';
import { Dialog } from '@angular/cdk/dialog';
import { Role } from '../../../api/interfaces/access-control/role.interface';
import { CreateRoleDialog } from './components/create-role-dialog';
import { getPermisosQuery } from '../../actions/permisos/get-permisos-action';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { RolePermissionPreview } from './components/role-permission-preview';
import { PermissionActionsPage } from './components/permission-action';

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
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <header-system-rol
      [stepActive]="stepActive()"
      [hasSystem]="!!selectedSystem()"
      [hasRole]="!!selectedRol()"
      (stepSelected)="goToStep($event)"
    />

    @if (stepActive() !== 'permisos') {
      <div class="grid gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
        <system-selector
          [systems]="systemQuery.data() ?? []"
          [selectedSystemCode]="selectedSystem()?.code ?? null"
          (systemSelected)="setSelectedSystem($event)"
        />

        @if (stepActive() === 'roles' && selectedSystem(); as system) {
          <system-roles-panel
            [system]="system"
            [roles]="rolesQuery.data() ?? []"
            [loading]="rolesQuery.isLoading()"
            [error]="rolesQuery.isError()"
            [selectedRoleId]="selectedRol()?.id ?? null"
            (retry)="rolesQuery.refetch()"
            (createRole)="openCreateRoleDialog(system)"
            (roleSelected)="setSelectedRol($event)"
          />
        } @else {
          <app-empty-state
            [title]="
              selectedSystem() ? 'Sistema seleccionado' : 'Todavía no hay un sistema seleccionado'
            "
            [description]="
              selectedSystem()
                ? 'Selecciona Roles en la cabecera o elige otro sistema.'
                : 'Selecciona un sistema para ver sus roles.'
            "
          ></app-empty-state>
        }
      </div>
    } @else {
      <role-permission-preview
        [roleName]="selectedRol()?.name ?? ''"
        [systemName]="selectedSystem()?.name ?? ''"
        [permissions]="pemrisosQuery.data() ?? []"
        [loading]="pemrisosQuery.isPending()"
        [error]="pemrisosQuery.isError()"
        (deselectRole)="clearSelectedRole()"
        (retry)="pemrisosQuery.refetch()"
      >
        <permission-actions actions />
      </role-permission-preview>
    }
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = findSystemsQuery();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly queryClient = inject(QueryClient);

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

  // Roles logica

  readonly rolesQuery = findRolesQuery(() => this.selectedSystem()?.id);

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

  openUpdateRolesDialog(system: System) {
    const id = `update-role-${system.id}`;
  }

  // Permisos

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
}
