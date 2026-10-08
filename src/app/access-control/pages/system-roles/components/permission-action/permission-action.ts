import { booleanAttribute, Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'permission-actions',
  template: `
    <button type="button" class="btn" [disabled]="!hasPermission() || saving()" (click)="cancel.emit()">
      Descartar cambios
    </button>
    <button type="button" class="btn btn-primary" [disabled]="!hasPermission() || saving()" (click)="save.emit()">
      Guardar permisos
    </button>
  `,
  host: {
    class:
      'flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 sm:p-4  justify-end',
  },
})
export class PermissionActionsPage {
  readonly hasPermission = input(false, {
    alias: 'hasPermissionChanges',
    transform: booleanAttribute,
  });
  readonly saving = input(false, { transform: booleanAttribute });
  readonly cancel = output<void>();
  readonly save = output<void>();
}
