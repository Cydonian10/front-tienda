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

@Component({
  imports: [TitleHeaderAdmin, HeaderSystemRolPage, SystemSelector, SystemRolesPanel, EmptyState],
  selector: 'app-system-roles',
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <header-system-rol [stepActive]="stepActive()" />

    @if (!pemrisosQuery.data()?.length) {
      <div class="grid gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
        <system-selector
          [systems]="systemQuery.data() ?? []"
          [selectedSystemCode]="selectedSystem()?.code ?? null"
          (systemSelected)="setSelectedSystem($event)"
        />

        @if (selectedSystem(); as system) {
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
            title="Todavía no ya sistema seleccionado"
            description="Los registros aparecerán cuando selecciones un systema"
          ></app-empty-state>
        }
      </div>
    } @else {
      <section class="space-y-4 w-full" aria-label="Vista previa de permisos">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">Permisos del rol</h3>
            <p class="mt-1 text-sm text-base-content/70">
              <!-- Vista previa de los permisos de {{ permissionPreview.roleName }}. -->
            </p>
          </div>
          <!-- <span class="badge badge-ghost">{{ permissionPreview.roleCode }}</span> -->
        </div>

        <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <section
            class="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100"
            aria-label="Permisos de ejemplo"
          >
            <div class="space-y-4 border-b border-base-300 p-4 sm:p-5">
              <div class="flex flex-wrap gap-3">
                <input
                  class="input min-w-0 flex-1"
                  type="search"
                  aria-label="Buscar permiso"
                  placeholder="Buscar permiso o acción…"
                  disabled
                />
                <select class="select" aria-label="Filtrar por asignación" disabled>
                  <option>Todos los permisos</option>
                  <option>Asignados</option>
                  <option>Sin asignar</option>
                </select>
              </div>
              <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por recurso">
                <button type="button" class="btn btn-sm btn-primary" disabled>Todos</button>
                <button type="button" class="btn btn-sm btn-ghost" disabled>PRODUCTOS</button>
                <button type="button" class="btn btn-sm btn-ghost" disabled>INVENTARIO</button>
                <button type="button" class="btn btn-sm btn-ghost" disabled>MOVIMIENTOS</button>
              </div>
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-base-content/70 sm:px-5"
            >
              <!-- <span class="tabular-nums">
                  {{ permissionPreview.totalCount }} 
                  permisos · Inventario
                </span> -->
              <button type="button" class="btn btn-ghost btn-sm" disabled>
                Seleccionar / desmarcar visibles
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm min-w-140">
                <thead class="bg-base-200/60">
                  <tr>
                    <th scope="col">Permiso</th>
                    <th scope="col">Recurso</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permission of pemrisosQuery.data() ?? []; track permission.id) {
                    <tr class="border-base-300">
                      <td class="font-semibold">{{ permission.name }}</td>
                      <td>
                        <span class="badge badge-ghost badge-sm">{{
                          permission.resourceCode
                        }}</span>
                      </td>
                      <td class="text-xs text-base-content/70">{{ permission.actionCode }}</td>
                      <td>
                        <input
                          type="checkbox"
                          class="checkbox checkbox-primary checkbox-sm"
                          [attr.aria-label]="'Asignar ' + permission.name"
                          [checked]="permission.assigned"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <aside
            class="h-fit rounded-box border border-base-300 bg-base-100 p-5"
            aria-label="Resumen de acceso"
          >
            <h3 class="font-semibold">Resumen de acceso</h3>
            <p class="mt-5 text-3xl font-semibold tabular-nums text-primary">
              <!-- {{ permissionPreview.assignedCount }}
              <span class="text-base text-base-content/60">/ {{ permissionPreview.totalCount }}</span> -->
            </p>
            <p class="mt-1 text-xs text-base-content/70">permisos seleccionados</p>
            <div class="mt-5 space-y-2 border-t border-base-300 pt-4">
              <!-- @for (resource of permissionPreview.resources; track resource.code) {
                <div class="flex justify-between gap-3 text-xs">
                  <span class="truncate text-base-content/70">{{ resource.code }}</span>
                  <strong class="tabular-nums">{{ resource.selected }} / {{ resource.total }}</strong>
                </div>
              } -->
            </div>
            <p class="mt-5 rounded-field bg-base-200 p-3 text-xs text-base-content/70">
              Datos de ejemplo. No se aplican cambios.
            </p>
          </aside>
        </div>

        <div
          class="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 sm:p-4"
        >
          <button type="button" class="btn" disabled>Descartar cambios</button>
          <button type="button" class="btn btn-primary" disabled>Guardar permisos</button>
        </div>
      </section>
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

  readonly systemCode = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  setSelectedSystem(system: System) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { system: system.code },
      queryParamsHandling: 'merge',
    });
  }

  readonly selectedSystem = computed(
    () =>
      this.systemQuery.data()?.find((system) => system.code === this.systemCode().get('system')) ??
      null,
  );

  protected readonly stepActive = computed<StepActiveProps>(() =>
    this.selectedSystem() ? 'roles' : 'system',
  );

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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { roleCode: role.code },
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
            role.code === this.systemCode().get('roleCode'),
        ) ?? undefined,
  );

  readonly pemrisosQuery = getPermisosQuery(() => {
    const role = this.selectedRol();
    return role ? { roleId: role.id } : undefined;
  });
}
