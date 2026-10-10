import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SystemRecord } from '../../api/interfaces/access-control/role.interface';
import { Icon } from '../../shared/components/icon/icon';
import { SystemMenuService } from '../services/control-access/system-menu.service';

@Component({
  selector: 'app-system-card',
  imports: [Icon, RouterLink],
  template: `
    <article
      class="card card-border h-full min-w-0 bg-base-100 transition-colors duration-150 hover:border-primary/40"
    >
      <div class="card-body gap-5 p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <span
            class="grid size-12 shrink-0 place-items-center rounded-box bg-base-200 text-primary"
            aria-hidden="true"
          >
            <app-icon [name]="icon()" [size]="22" />
          </span>
          <div class="min-w-0 flex-1 pt-1">
            <h3 class="card-title text-lg leading-snug">{{ system().name }}</h3>
            <p class="mt-2 line-clamp-3 min-h-15 text-sm leading-6 text-base-content/70">
              {{ system().description || 'Sistema de trabajo' }}
            </p>
          </div>
        </div>
        <footer
          class="card-actions mt-auto items-center justify-between border-t border-base-300 pt-4"
        >
          @if (!system().active) {
            <span class="badge badge-ghost">Inactivo</span>
            <span class="text-sm text-base-content/70">Sin acceso</span>
          } @else if (route(); as destination) {
            <span class="badge badge-success badge-soft">Disponible</span>
            <a
              [routerLink]="destination"
              class="btn btn-ghost btn-sm min-h-11 gap-1"
              [attr.aria-label]="'Ingresar a ' + system().name"
            >
              Ingresar <app-icon name="chevron-right" [size]="16" />
            </a>
          } @else {
            <span class="badge badge-warning badge-soft">Aún no disponible</span>
            <span class="text-sm text-base-content/70">En este frontend</span>
          }
        </footer>
      </div>
    </article>
  `,
})
export class SystemCard {
  private readonly systemMenu = inject(SystemMenuService);
  readonly system = input.required<SystemRecord>();
  readonly route = computed(() => this.systemMenu.routeFor(this.system().code));
  readonly icon = computed(() => this.systemMenu.iconFor(this.system().code));
}
