import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  DemoAssignment,
  DemoRole,
  DemoSystem,
  DemoUser,
  demoFullName,
  demoInitials,
  demoToday,
} from '../usuarios-demo.data';

@Component({
  selector: 'app-usuario-detail',
  imports: [FormsModule, Icon],
  host: { class: 'block min-w-0' },
  template: `
    <section
      class="overflow-hidden rounded-box border border-base-300 bg-base-100"
      aria-label="Detalle del usuario"
    >
      <header
        class="flex flex-wrap items-center gap-3 border-b border-base-300 p-4 sm:gap-4 sm:p-6"
      >
        <span
          class="grid size-13 shrink-0 place-items-center rounded-box bg-primary/15 font-bold text-primary"
          aria-hidden="true"
          >{{ initials(user()) }}</span
        >
        <div class="min-w-0 flex-1">
          <h2 class="truncate text-lg font-semibold sm:text-xl">{{ fullName(user()) }}</h2>
          <p class="truncate text-sm text-base-content/70">{{ user().email }}</p>
        </div>
        <span
          class="badge badge-sm badge-soft"
          [class.badge-success]="user().active"
          [class.badge-error]="!user().active"
          >{{ user().active ? 'Activo' : 'Inactivo' }}</span
        >
        <button type="button" class="btn btn-sm" (click)="edit.emit()">Editar</button>
      </header>

      <dl
        class="grid gap-4 border-b border-base-300 p-4 text-sm sm:grid-cols-2 sm:p-6 xl:grid-cols-4"
      >
        <div>
          <dt class="text-xs text-base-content/60">NOMBRE COMPLETO</dt>
          <dd class="mt-1 font-semibold">{{ fullName(user()) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/60">DOCUMENTO</dt>
          <dd class="mt-1 font-semibold tabular-nums">{{ user().person.identityDocument }}</dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/60">NACIMIENTO</dt>
          <dd class="mt-1 font-semibold tabular-nums">{{ user().person.dateOfBirth }}</dd>
        </div>
        <div>
          <dt class="text-xs text-base-content/60">CORREO</dt>
          <dd class="mt-1 font-semibold">
            {{ user().emailVerified ? 'Verificado' : 'Pendiente' }}
          </dd>
        </div>
      </dl>

      <div class="p-4 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold">
              Roles asignados
              <span class="badge badge-ghost badge-sm ml-1 tabular-nums">{{
                user().roles.length
              }}</span>
            </h3>
            <p class="mt-1 text-sm text-base-content/70">
              Define el acceso de {{ user().person.firstName }} en cada sistema.
            </p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" (click)="assign.emit()">
            <app-icon name="plus" [size]="17" /> Asignar rol
          </button>
        </div>

        <label class="mt-5 flex items-center gap-3 text-sm">
          <span>Sistema</span>
          <select
            class="select max-w-55"
            aria-label="Filtrar roles por sistema"
            [ngModel]="systemFilter()"
            (ngModelChange)="systemFilter.set($event)"
          >
            <option value="all">Todos los sistemas</option>
            @for (system of systems(); track system.id) {
              <option [value]="system.id">{{ system.name }}</option>
            }
          </select>
        </label>

        <ul class="mt-5 space-y-2">
          @for (item of visibleAssignments(); track item.assignment.id) {
            <li
              class="flex items-start gap-3 rounded-box border border-base-300 bg-base-200/40 p-3 sm:p-4"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-field border border-base-300 text-base-content/70"
                aria-hidden="true"
                ><app-icon name="shield-check" [size]="19"
              /></span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="text-sm">{{ item.role.name }}</strong
                  ><span
                    class="badge badge-soft badge-sm"
                    [class.badge-success]="state(item.assignment) === 'Vigente'"
                    [class.badge-warning]="state(item.assignment) === 'Pendiente'"
                    >{{ state(item.assignment) }}</span
                  >
                </div>
                <p class="mt-1 break-words text-xs text-base-content/70">
                  {{ item.system.name }} · {{ item.role.code }}
                </p>
                <p class="mt-2 text-xs text-base-content/60 tabular-nums">
                  Desde {{ item.assignment.validFrom }} ·
                  {{
                    item.assignment.validUntil
                      ? 'Hasta ' + item.assignment.validUntil
                      : 'Sin fecha de fin'
                  }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm shrink-0"
                [attr.aria-label]="'Quitar rol ' + item.role.name"
                (click)="remove.emit(item.assignment.id)"
              >
                <app-icon name="close" [size]="16" />
              </button>
            </li>
          } @empty {
            <li
              class="rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-base-content/70"
            >
              {{
                user().roles.length
                  ? 'No hay roles en este sistema.'
                  : 'Este usuario aún no tiene roles asignados.'
              }}
            </li>
          }
        </ul>
      </div>
      <p class="border-t border-base-300 px-4 py-4 text-xs text-base-content/70 sm:px-6">
        <app-icon name="info" [size]="15" class="mr-1 inline-block align-middle" /> Datos de
        ejemplo. Los cambios se reinician al recargar la página.
      </p>
    </section>
  `,
})
export class UsuarioDetail {
  readonly user = input.required<DemoUser>();
  readonly systems = input.required<DemoSystem[]>();
  readonly roles = input.required<DemoRole[]>();
  readonly edit = output<void>();
  readonly assign = output<void>();
  readonly remove = output<string>();
  protected readonly fullName = demoFullName;
  protected readonly initials = demoInitials;
  protected readonly systemFilter = signal('all');
  protected readonly visibleAssignments = computed(() =>
    this.user().roles.flatMap((assignment) => {
      const role = this.roles().find((item) => item.id === assignment.roleId);
      const system = this.systems().find((item) => item.id === role?.systemId);
      return role && system && (this.systemFilter() === 'all' || system.id === this.systemFilter())
        ? [{ assignment, role, system }]
        : [];
    }),
  );

  protected state(assignment: DemoAssignment): string {
    const today = demoToday();
    if (assignment.validFrom > today) return 'Pendiente';
    if (assignment.validUntil && assignment.validUntil < today) return 'Vencido';
    return 'Vigente';
  }
}
