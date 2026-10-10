import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { DemoUser, demoFullName, demoInitials } from '../usuarios-demo.data';

@Component({
  selector: 'app-usuarios-list',
  imports: [FormsModule, Icon],
  host: { class: 'block min-w-0' },
  template: `
    <section
      class="overflow-hidden rounded-box border border-base-300 bg-base-100"
      aria-label="Lista de usuarios"
    >
      <div class="border-b border-base-300 p-4 sm:p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">
            Usuarios
            <span class="badge badge-ghost badge-sm ml-1 tabular-nums">{{ users().length }}</span>
          </h2>
          <app-icon name="users" [size]="19" class="text-base-content/60" />
        </div>
        <div class="mt-4 flex flex-wrap gap-2 sm:flex-nowrap">
          <input
            class="input min-w-0 flex-1"
            type="search"
            aria-label="Buscar usuarios"
            placeholder="Buscar nombre, correo o documento…"
            [ngModel]="search()"
            (ngModelChange)="searchChange.emit($event)"
          />
          <select
            class="select w-full sm:w-28"
            aria-label="Filtrar usuarios por estado"
            [ngModel]="status()"
            (ngModelChange)="statusChange.emit($event)"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>
      <div class="max-h-150 space-y-1 overflow-y-auto p-2">
        @for (user of filteredUsers(); track user.id) {
          <button
            type="button"
            class="flex min-h-20 w-full items-center gap-3 rounded-field px-3 py-2 text-left transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            [class.bg-primary/10]="selectedId() === user.id"
            [class.ring-1]="selectedId() === user.id"
            [class.ring-primary/30]="selectedId() === user.id"
            [attr.aria-current]="selectedId() === user.id ? 'true' : null"
            (click)="selectUser.emit(user.id)"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-field bg-primary/15 text-xs font-bold text-primary"
              aria-hidden="true"
              >{{ initials(user) }}</span
            >
            <span class="min-w-0 flex-1">
              <strong class="block truncate text-sm">{{ fullName(user) }}</strong>
              <span class="block truncate text-xs text-base-content/70">{{ user.email }}</span>
              <span class="mt-1 block text-xs text-base-content/60"
                >{{ user.active ? 'Activo' : 'Inactivo' }} · {{ user.roles.length }}
                {{ user.roles.length === 1 ? 'rol' : 'roles' }}</span
              >
            </span>
            <app-icon name="chevron-right" [size]="16" class="shrink-0 text-base-content/50" />
          </button>
        } @empty {
          <p class="px-4 py-10 text-center text-sm text-base-content/70">
            No hay usuarios con estos filtros.
          </p>
        }
      </div>
    </section>
  `,
})
export class UsuariosList {
  readonly users = input.required<DemoUser[]>();
  readonly filteredUsers = input.required<DemoUser[]>();
  readonly selectedId = input<string | null>(null);
  readonly search = input('');
  readonly status = input('all');
  readonly searchChange = output<string>();
  readonly statusChange = output<string>();
  readonly selectUser = output<string>();
  protected readonly fullName = demoFullName;
  protected readonly initials = demoInitials;
}
