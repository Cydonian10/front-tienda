import { Component, input, output } from '@angular/core';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import type { ExistenciaItem } from '../../../../api/interfaces/inventario/existencia.interface';
import { usePermissions } from '../../../../auth/services/use-permissions';
import { decimalCompacto } from '../../../../shared/formatters/decimal';

@Component({
  selector: 'app-existencia-minimo',
  templateUrl: './existencia-minimo.html',
  host: { class: 'block min-w-0' },
})
export class ExistenciaMinimo {
  readonly fila = input.required<ExistenciaItem>();
  readonly access = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM });
  readonly editRequested = output<ExistenciaItem>();
  readonly decimalCompacto = decimalCompacto;

  abrir(): void {
    if (!this.access.edit()) return;
    this.editRequested.emit(this.fila());
  }
}
