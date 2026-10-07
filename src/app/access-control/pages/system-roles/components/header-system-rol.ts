import { Component, input, output } from '@angular/core';

export type StepActiveProps = 'system' | 'roles' | 'permisos';

@Component({
  imports: [],
  selector: 'header-system-rol',
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      [class.text-primary]="stepActive() === 'system'"
      [attr.aria-current]="stepActive() === 'system' ? 'step' : null"
      (click)="stepSelected.emit('system')"
    >
      Sistema
    </button>
    <span class="h-px w-6 bg-base-300" aria-hidden="true"></span>
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      [class.text-primary]="stepActive() === 'roles'"
      [attr.aria-current]="stepActive() === 'roles' ? 'step' : null"
      [disabled]="!hasSystem()"
      (click)="stepSelected.emit('roles')"
    >
      Roles
    </button>
    <span class="h-px w-6 bg-base-300" aria-hidden="true"></span>
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      [class.text-primary]="stepActive() === 'permisos'"
      [attr.aria-current]="stepActive() === 'permisos' ? 'step' : null"
      [disabled]="!hasRole()"
      (click)="stepSelected.emit('permisos')"
    >
      Permisos
    </button>
  `,
  host: {
    class: 'flex flex-wrap items-center gap-2 text-xs font-semibold text-base-content/70',
    'aria-label': 'Etapas de configuración',
  },
})
export class HeaderSystemRolPage {
  stepActive = input<StepActiveProps>('system');
  hasSystem = input(false);
  hasRole = input(false);
  stepSelected = output<StepActiveProps>();
}
