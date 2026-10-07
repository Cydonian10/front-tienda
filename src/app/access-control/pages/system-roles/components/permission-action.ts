import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'permission-actions',
  template: `
    <button type="button" class="btn" disabled>Descartar cambios</button>
    <button type="button" class="btn btn-primary" disabled>Guardar permisos</button>
  `,
  host: {
    class:
      'flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 sm:p-4',
  },
})
export class PermissionActionsPage {}
