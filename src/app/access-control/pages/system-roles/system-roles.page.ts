import {
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderSystemRolPage, StepActiveProps } from './components/header-system-rol';

@Component({
  imports: [Icon, TitleHeaderAdmin, FormsModule, HeaderSystemRolPage],
  selector: 'app-system-roles',
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <header-system-rol [stepActive]="stepActive()" />

    <div class="grid gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
      <section
        class="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100"
        aria-label="Sistemas"
      >
        <div class="p-4 sm:p-5">
          <h3 class="font-semibold">
            Sistemas
            <span class="badge badge-ghost badge-sm ml-1">{{ systemQuery.data()?.length }}</span>
          </h3>
          <input
            type="search"
            class="input mt-4 w-full"
            placeholder="Buscar sistema…"
            aria-label="Buscar sistema"
            [ngModel]="searchSystem()"
            (ngModelChange)="searchSystem.set($event)"
          />
        </div>
        <div class="max-h-130 space-y-1 overflow-auto px-2 pb-4">
          @for (system of filteredSystem(); track system.id) {
            <button
              type="button"
              class="flex min-h-15 w-full items-center gap-3 rounded-field p-3 text-left"
              [class.bg-primary/15]="system.code === selectedSystem()?.code"
              [attr.aria-current]="system.code === selectedSystem()?.code ? 'true' : null"
              (click)="setSelectedSystem(system)"
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-primary"
              >
                <app-icon name="grid" [size]="18" />
              </span>
              <span class="min-w-0 flex-1">
                <strong class="block truncate text-sm">{{ system.name }}</strong>
                <small class="block truncate text-xs text-base-content/70">
                  {{ system.code }}
                </small>
              </span>
              @if (system.code === selectedSystem()?.code) {
                <app-icon name="chevron-right" [size]="16" class="text-primary" />
              }
            </button>
          }
        </div>
        <p class="border-t border-base-300 p-4 text-xs text-base-content/70">
          Los sistema son solo lectura
        </p>
      </section>

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
              <!-- <h3 class="text-lg font-semibold">{{ selectedSystem.name }}</h3>
              <p class="mt-1 text-xs text-base-content/70">{{ selectedSystem.description }}</p> -->
            </div>
            <button type="button" class="btn btn-primary" disabled>
              <app-icon name="plus" [size]="17" /> Nuevo rol
            </button>
          </div>

          <div class="p-4 sm:p-5">
            <input
              class="input w-full sm:max-w-sm"
              type="search"
              aria-label="Buscar rol"
              placeholder="Buscar por nombre o código…"
              disabled
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
                <!-- @for (role of roles; track role.id) {
                  <tr class="border-base-300">
                    <td>
                      <strong class="block text-sm">{{ role.name }}</strong>
                      <small class="text-xs text-base-content/70">{{ role.description }}</small>
                    </td>
                    <td>{{ selectedSystem.name }}</td>
                    <td class="break-all text-xs">{{ role.code }}</td>
                    <td>
                      <button type="button" class="btn btn-ghost btn-sm text-primary" disabled>
                        <app-icon name="key" [size]="16" /> Permisos
                      </button>
                    </td>
                  </tr>
                } -->
              </tbody>
            </table>
          </div>

          <!-- <p class="border-t border-base-300 p-4 text-xs text-base-content/70">
            Roles de ejemplo del sistema {{ selectedSystem.name }}.
          </p> -->
        </section>
      }
    </div>
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = findSystemsQuery();
  protected stepActive = signal<StepActiveProps>('system');

  protected searchSystem = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly systemCode = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  setSelectedSystem(system: System) {
    this.stepActive.set('roles');
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

  filteredSystem = computed(() => {
    const filter = this.searchSystem();
    return this.systemQuery
      .data()
      ?.filter((system) => system.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  });

  changesSelectesSystem = effect(() => {
    if (this.selectedSystem()) {
      this.stepActive.set('roles');
    }
  });
}
