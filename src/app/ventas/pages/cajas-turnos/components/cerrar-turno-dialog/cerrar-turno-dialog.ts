import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { useResumenTurno } from '../../../../actions/use-caja-turnos-action';

@Component({
  selector: 'app-cerrar-turno-dialog',
  imports: [DialogShell],
  templateUrl: './cerrar-turno-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CerrarTurnoDialog {
  readonly data = inject<{ cajaId: string; nombre: string; turnoId: string }>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly efectivoContado = signal('');
  readonly observacionCierre = signal('');
  readonly resumenQuery = useResumenTurno(() => this.data.cajaId, () => this.data.turnoId);

  get turnoCerrado(): boolean {
    const error = this.resumenQuery.error();
    return error instanceof HttpErrorResponse && error.status === 409;
  }
}
