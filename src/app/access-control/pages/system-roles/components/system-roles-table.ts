import { Component, input, output } from '@angular/core';
import { RoleRecord } from '../../../../api/interfaces/access-control/role.interface';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  imports: [Icon],
  selector: 'system-roles-table',
  template: `
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
        } @else if (roles().length) {
          @for (role of roles(); track role.id) {
            <tr class="border-base-300">
              <td>
                <strong class="block text-sm">{{ role.name }}</strong>
                <small class="text-xs text-base-content/70">{{ role.description }}</small>
              </td>
              <td>{{ systemName() }}</td>
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
                hasRoles()
                  ? 'No hay roles que coincidan con la búsqueda.'
                  : 'Este sistema todavía no tiene roles.'
              }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block' },
})
export class SystemRolesTable {
  readonly roles = input.required<RoleRecord[]>();
  readonly systemName = input.required<string>();
  readonly hasRoles = input(false);
  readonly loading = input(false);
  readonly error = input(false);
  readonly retry = output<void>();
}
