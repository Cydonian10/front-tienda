import { booleanAttribute, Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'permission-actions',
  template: `
    <div
      role="group"
      aria-label="Acciones de permisos"
      class="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:justify-end"
    >
      <button
        type="button"
        class="btn w-full sm:w-auto"
        [disabled]="!hasPermission() || saving()"
        (click)="cancel.emit()"
      >
        Descartar cambios
      </button>
      <button
        type="button"
        class="btn btn-primary w-full sm:w-auto"
        [disabled]="!hasPermission() || saving()"
        (click)="save.emit()"
      >
        Guardar permisos
      </button>
    </div>
  `,
  host: {
    class:
      'fixed inset-x-0 bottom-0 z-20 border-t border-base-300 bg-base-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] lg:left-66 lg:px-8',
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
