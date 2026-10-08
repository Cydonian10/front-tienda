import { Component, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Role } from '../../../../../api/interfaces/access-control/role.interface';
import { Icon } from '../../../../../shared/components/icon/icon';

@Component({
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, Icon],
  selector: 'system-roles-table',
  template: `
    <table class="table table-sm min-w-125">
      <thead class="bg-base-200/60">
        <tr>
          <th scope="col">Rol</th>
          <th scope="col">Sistema</th>
          <th scope="col">Código</th>
          <th scope="col" class="sticky right-0 z-10 bg-base-200 text-right">Acciones</th>
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
              <td class="sticky right-0 z-10 bg-base-100">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm text-primary"
                    [attr.aria-pressed]="selectedRoleId() === role.id"
                    (click)="roleSelected.emit(role)"
                  >
                    <app-icon name="key" [size]="16" /> Permisos
                  </button>
                  <button
                    type="button"
                    class="btn btn-square border border-base-300 bg-base-200 text-base-content hover:border-primary hover:text-primary"
                    [cdkMenuTriggerFor]="roleActionsMenu"
                    [cdkMenuPosition]="menuPositions"
                    [attr.aria-label]="'Más acciones para ' + role.name"
                  >
                    <app-icon name="more-horizontal" [size]="20" [strokeWidth]="4" />
                  </button>
                  <ng-template #roleActionsMenu>
                    <ul
                      cdkMenu
                      class="menu menu-sm w-44 rounded-box border border-base-300 bg-base-100 p-1 text-base-content shadow-lg"
                    >
                      <li>
                        <button
                          type="button"
                          cdkMenuItem
                          class="min-h-11 w-full flex items-center"
                          (click)="editRole.emit(role)"
                        >
                          Editar
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          cdkMenuItem
                          class="min-h-11 w-full text-error flex items-center"
                          (click)="deleteRole.emit(role)"
                        >
                          Eliminar
                        </button>
                      </li>
                    </ul>
                  </ng-template>
                </div>
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
  readonly roles = input.required<Role[]>();
  readonly systemName = input.required<string>();
  readonly hasRoles = input(false);
  readonly loading = input(false);
  readonly error = input(false);
  readonly retry = output<void>();
  readonly selectedRoleId = input<string | null>(null);
  readonly roleSelected = output<Role>();
  readonly editRole = output<Role>();
  readonly deleteRole = output<Role>();

  protected readonly menuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];
}
