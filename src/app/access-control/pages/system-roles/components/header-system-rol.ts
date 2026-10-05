import { Component, input } from '@angular/core';

export type StepActiveProps = 'system' | 'roles' | 'permisos';

@Component({
  imports: [],
  selector: 'header-system-rol',
  template: `
    <span class="text-primary" [class.text-primary]="stepActive() === 'system'"> Sistema </span>
    <span class="h-px w-6 bg-base-300"> </span>

    <span class="text-primary" [class.text-primary]="stepActive() === 'roles'">Roles</span>

    <span class="h-px w-6 bg-base-300" [class.text-primary]="stepActive() === 'permisos'"></span>
    <span>Permisos</span>
  `,
  host: {
    class: 'flex items-center gap-2 text-xs font-semibold text-base-content/60',
    'aria-label': 'Etapas de configuracion',
  },
})
export class HeaderSystemRolPage {
  stepActive = input<StepActiveProps>('system');
}
