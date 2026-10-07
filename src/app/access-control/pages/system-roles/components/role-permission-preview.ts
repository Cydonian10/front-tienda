import { Component, input, output } from '@angular/core';
import { Permiso } from '../../../../api/interfaces/access-control/permision.interface';

@Component({
  imports: [],
  selector: 'role-permission-preview',
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold">Permisos del rol</h3>
        <p class="mt-1 text-sm text-base-content/70">{{ roleName() }} · {{ systemName() }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" (click)="deselectRole.emit()">
        Deseleccionar rol
      </button>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <section
        class="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100"
        aria-label="Permisos de ejemplo"
      >
        <div class="space-y-4 border-b border-base-300 p-4 sm:p-5">
          <div class="flex flex-wrap gap-3">
            <input
              class="input min-w-0 flex-1"
              type="search"
              aria-label="Buscar permiso"
              placeholder="Buscar permiso o acción…"
              disabled
            />
            <select class="select" aria-label="Filtrar por asignación" disabled>
              <option>Todos los permisos</option>
              <option>Asignados</option>
              <option>Sin asignar</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por recurso">
            <button type="button" class="btn btn-sm btn-primary" disabled>Todos</button>
            <button type="button" class="btn btn-sm btn-ghost" disabled>PRODUCTOS</button>
            <button type="button" class="btn btn-sm btn-ghost" disabled>INVENTARIO</button>
            <button type="button" class="btn btn-sm btn-ghost" disabled>MOVIMIENTOS</button>
          </div>
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-base-content/70 sm:px-5"
        >
          <!-- <span class="tabular-nums">
                  {{ permissionPreview.totalCount }} 
                  permisos · Inventario
                </span> -->
          <button type="button" class="btn btn-ghost btn-sm" disabled>
            Seleccionar / desmarcar visibles
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-sm min-w-140">
            <thead class="bg-base-200/60">
              <tr>
                <th scope="col">Permiso</th>
                <th scope="col">Recurso</th>
                <th scope="col">Acción</th>
                <th scope="col">Asignado</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr>
                  <td colspan="4" class="py-8 text-center" role="status">Cargando permisos…</td>
                </tr>
              } @else if (error()) {
                <tr>
                  <td colspan="4" class="py-8 text-center" role="alert">
                    No se pudieron cargar los permisos.
                    <button type="button" class="btn btn-ghost btn-sm" (click)="retry.emit()">
                      Reintentar
                    </button>
                  </td>
                </tr>
              } @else if (!permissions().length) {
                <tr>
                  <td colspan="4" class="py-8 text-center">Este rol todavía no tiene permisos.</td>
                </tr>
              } @else {
                @for (permission of permissions(); track permission.id) {
                  <tr class="border-base-300">
                    <td class="font-semibold">{{ permission.name }}</td>
                    <td>
                      <span class="badge badge-ghost badge-sm">{{ permission.resourceCode }}</span>
                    </td>
                    <td class="text-xs text-base-content/70">{{ permission.actionCode }}</td>
                    <td>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary checkbox-sm"
                        [attr.aria-label]="'Asignado: ' + permission.name"
                        [checked]="permission.assigned"
                        disabled
                      />
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>

      <aside
        class="h-fit rounded-box border border-base-300 bg-base-100 p-5"
        aria-label="Resumen de acceso"
      >
        <h3 class="font-semibold">Resumen de acceso</h3>
        <p class="mt-5 text-3xl font-semibold tabular-nums text-primary">
          <!-- {{ permissionPreview.assignedCount }}
              <span class="text-base text-base-content/60">/ {{ permissionPreview.totalCount }}</span> -->
        </p>
        <p class="mt-1 text-xs text-base-content/70">permisos seleccionados</p>
        <div class="mt-5 space-y-2 border-t border-base-300 pt-4">
          <!-- @for (resource of permissionPreview.resources; track resource.code) {
                <div class="flex justify-between gap-3 text-xs">
                  <span class="truncate text-base-content/70">{{ resource.code }}</span>
                  <strong class="tabular-nums">{{ resource.selected }} / {{ resource.total }}</strong>
                </div>
              } -->
        </div>
        <p class="mt-5 rounded-field bg-base-200 p-3 text-xs text-base-content/70">
          Datos de ejemplo. No se aplican cambios.
        </p>
      </aside>
    </div>

    <ng-content select="[actions]" />
  `,
  host: { class: 'block space-y-4', 'aria-label': 'Vista previa de permisos' },
})
export class RolePermissionPreview {
  readonly roleName = input.required<string>();
  readonly systemName = input.required<string>();
  readonly permissions = input<Permiso[]>([]);
  readonly loading = input(false);
  readonly error = input(false);

  readonly deselectRole = output<void>();
  readonly retry = output<void>();
}
