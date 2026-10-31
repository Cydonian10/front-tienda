import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';

@Component({
  selector: 'app-crear-caja-dialog',
  imports: [DialogShell, FormField],
  templateUrl: './crear-caja-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CrearCajaDialog {
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly model = signal({ nombre: '' });
  readonly cajaForm = form(this.model);

  submitForm() {}
}
