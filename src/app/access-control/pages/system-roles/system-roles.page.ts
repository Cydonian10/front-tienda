import { Component, computed, inject } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderSystemRolPage, StepActiveProps } from './components/header-system-rol';
import { findRolesQuery } from '../../actions/roles/roles-actions';
import { SystemSelector } from './components/system-selector';

@Component({
  imports: [Icon, TitleHeaderAdmin, HeaderSystemRolPage, SystemSelector],
  selector: 'app-system-roles',
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <header-system-rol [stepActive]="stepActive()" />

    <div class="grid gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
      <system-selector
        [systems]="systemQuery.data() ?? []"
        [selectedSystemCode]="selectedSystem()?.code ?? null"
        (systemSelected)="setSelectedSystem($event)"
      />

      @if (stepActive() === 'roles') {
        <section
          class="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100"
          aria-label="Roles del sistema"
        >
          <div class="flex flex-wrap items-center gap-3 border-b border-base-300 p-4 sm:p-5">
            <span class="grid size-11 place-items-center rounded-field bg-primary/10 text-primary">
              <app-icon name="shield-check" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-semibold">{{ selectedSystem()?.name }}</h3>
              <p class="mt-1 text-xs text-base-content/70">
                {{ selectedSystem()?.description }}
              </p>
            </div>
            <button type="button" class="btn btn-primary">
              <app-icon name="plus" [size]="17" /> Nuevo rol
            </button>
          </div>

          <div class="p-4 sm:p-5">
            <input
              class="input w-full sm:max-w-sm"
              type="search"
              aria-label="Buscar rol"
              placeholder="Buscar por nombre o código…"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="table table-sm min-w-125">
              <thead class="bg-base-200/60">
                <tr>
                  <th scope="col">Rol</th>
                  <th scope="col">Sistema</th>
                  <th scope="col">Código</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                @if (rolesQuery.isLoading()) {
                  <tr class="border-base-300">
                    <td
                      colspan="4"
                      class="py-8 text-center text-sm text-base-content/70"
                      role="status"
                    >
                      Cargando roles…
                    </td>
                  </tr>
                } @else if (rolesQuery.isError()) {
                  <tr class="border-base-300">
                    <td colspan="4" class="py-8 text-center" role="alert">
                      <p class="text-sm text-error">No se pudieron cargar los roles.</p>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm mt-2"
                        (click)="rolesQuery.refetch()"
                      >
                        Reintentar
                      </button>
                    </td>
                  </tr>
                } @else if (rolesQuery.data()?.length) {
                  @for (role of rolesQuery.data() ?? []; track role.id) {
                    <tr class="border-base-300">
                      <td>
                        <strong class="block text-sm">{{ role.name }}</strong>
                        <small class="text-xs text-base-content/70">{{ role.description }}</small>
                      </td>
                      <td>{{ selectedSystem()?.name }}</td>
                      <td class="break-all text-xs">{{ role.code }}</td>
                      <td>
                        <button type="button" class="btn btn-ghost btn-sm text-primary" disabled>
                          <app-icon name="key" [size]="16" /> Permisos
                        </button>
                      </td>
                    </tr>
                  }
                } @else {
                  <tr class="border-base-300">
                    <td colspan="4" class="py-8 text-center text-sm text-base-content/70">
                      Este sistema todavía no tiene roles.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = findSystemsQuery();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
}
