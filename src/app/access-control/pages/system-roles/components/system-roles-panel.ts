import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { System } from '../../../../api/interfaces/access-control/system.interface';
import { RoleRecord } from '../../../../api/interfaces/access-control/role.interface';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  imports: [FormsModule, Icon],
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
          [ngModel]="searchRole()"
          (ngModelChange)="searchRole.set($event)"
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
            @if (loading()) {
              <tr class="border-base-300">
                <td colspan="4" class="py-8 text-center text-sm text-base-content/70" role="status">
                  Cargando roles…
                </td>
              </tr>
            } @else if (error()) {
              <tr class="border-base-300">
                <td colspan="4" class="py-8 text-center" role="alert">
                  <p class="text-sm text-error">No se pudieron cargar los roles.</p>
                  <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="retry.emit()">
                    Reintentar
                  </button>
                </td>
              </tr>
            } @else if (filteredRoles().length) {
              @for (role of filteredRoles(); track role.id) {
                <tr class="border-base-300">
                  <td>
                    <strong class="block text-sm">{{ role.name }}</strong>
                    <small class="text-xs text-base-content/70">{{ role.description }}</small>
                  </td>
                  <td>{{ system().name }}</td>
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
                  {{
                    roles().length
                      ? 'No hay roles que coincidan con la búsqueda.'
                      : 'Este sistema todavía no tiene roles.'
                  }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  host: {
    class: 'block min-w-0',
  },
})
export class SystemRolesPanel {
  readonly system = input.required<System>();
  readonly roles = input<RoleRecord[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  readonly retry = output<void>();

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
