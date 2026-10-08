import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { System } from '../../../../../api/interfaces/access-control/system.interface';
import { Role } from '../../../../../api/interfaces/access-control/role.interface';
import { Icon } from '../../../../../shared/components/icon/icon';
import { SystemRolesTable } from '../system-roles-table/system-roles-table';

@Component({
  imports: [FormsModule, Icon, SystemRolesTable],
  selector: 'system-roles-panel',
  template: `
    <section
      class="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100"
      aria-label="Roles del sistema"
    >
      <div class="flex flex-wrap items-center gap-3 border-b border-base-300 p-4 sm:p-5">
        <span class="grid size-11 place-items-center rounded-field bg-primary/10 text-primary">
          <app-icon name="shield-check" />
        </span>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold">{{ system().name }}</h3>
          <p class="mt-1 text-xs text-base-content/70">
            {{ system().description }}
          </p>
        </div>
        <button type="button" class="btn btn-primary" (click)="createRole.emit()">
          <app-icon name="plus" [size]="17" />
          Nuevo rol
        </button>
      </div>

      <div class="p-4 sm:p-5">
        <input
          class="input w-full sm:max-w-sm"
          type="search"
          aria-label="Buscar rol"
          placeholder="Buscar por nombre o código…"
          [ngModel]="searchRole()"
          (ngModelChange)="searchRole.set($event)"
        />
      </div>

      <div class="overflow-x-auto">
        <system-roles-table
          [roles]="filteredRoles()"
          [systemName]="system().name"
          [hasRoles]="roles().length > 0"
          [loading]="loading()"
          [error]="error()"
          [selectedRoleId]="selectedRoleId()"
          (retry)="retry.emit()"
          (roleSelected)="roleSelected.emit($event)"
        />
      </div>
    </section>
  `,
  host: {
    class: 'block min-w-0',
  },
})
export class SystemRolesPanel {
  readonly system = input.required<System>();
  readonly roles = input<Role[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  readonly retry = output<void>();
  readonly createRole = output<void>();
  readonly selectedRoleId = input<string | null>(null);
  readonly roleSelected = output<Role>();

  protected readonly searchRole = signal('');
  protected readonly filteredRoles = computed(() => {
    const filter = this.searchRole().toLocaleLowerCase().trim();
    return this.roles().filter(
      (role) =>
        role.name.toLocaleLowerCase().includes(filter) ||
        role.code.toLocaleLowerCase().includes(filter),
    );
  });
}
