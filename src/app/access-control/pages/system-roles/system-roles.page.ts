import { Component, computed, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';

@Component({
  imports: [Icon, TitleHeaderAdmin],
  selector: 'app-system-roles',
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <div
      class="flex items-center gap-2 text-xs font-semibold text-base-content/60"
      aria-label="Etapas de configuración"
    >
      <span class="text-primary">Sistema</span><span class="h-px w-6 bg-base-300"></span>
      <span class="text-primary">Roles</span><span class="h-px w-6 bg-base-300"></span>
      <span>Permisos</span>
    </div>

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
          />
        </div>
        <div class="max-h-130 space-y-1 overflow-auto px-2 pb-4">
          @for (system of filteredSystem(); track system.id) {
            <button
              type="button"
              class="flex min-h-15 w-full items-center gap-3 rounded-field p-3 text-left"
              [class.bg-primary/15]="system.id === selectedSystem()?.id"
              [attr.aria-current]="system.id === selectedSystem()?.id ? 'true' : null"
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
              @if (system.id === selectedSystem()?.id) {
                <app-icon name="chevron-right" [size]="16" class="text-primary" />
              }
            </button>
          }
        </div>
        <p class="border-t border-base-300 p-4 text-xs text-base-content/70">
          Los sistema son solo lectura
        </p>
      </section>
    </div>
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = findSystemsQuery();

  protected selectedSystem = signal<System | null>(null);
  protected searchSystem = signal('');

  setSelectedSystem(system: System) {
    this.selectedSystem.set(system);
  }

  filteredSystem = computed(() => {
    const filter = this.searchSystem();
    return this.systemQuery.data()?.filter((system) => system.name.includes(filter));
  });
}
