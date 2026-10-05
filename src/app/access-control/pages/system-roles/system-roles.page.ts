import { Component, computed, inject, linkedSignal, OnDestroy, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [Icon, TitleHeaderAdmin, FormsModule],
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
    </div>
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage implements OnDestroy {
  readonly systemQuery = findSystemsQuery();

  // protected selectedSystem = signal<System | null>(null);
  protected searchSystem = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly systemId = toSignal(this.route.queryParamMap, {
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
      this.systemQuery.data()?.find((system) => system.code === this.systemId().get('system')) ??
      null,
  );

  filteredSystem = computed(() => {
    const filter = this.searchSystem();
    return this.systemQuery
      .data()
      ?.filter((system) => system.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  });

  ngOnDestroy(): void {}
}
