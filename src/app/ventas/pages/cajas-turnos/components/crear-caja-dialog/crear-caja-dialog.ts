import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';

@Component({
  selector: 'app-crear-caja-dialog',
  imports: [DialogShell],
  templateUrl: './crear-caja-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CrearCajaDialog {
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
}
