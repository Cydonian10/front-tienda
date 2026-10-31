import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import type { Caja, CrearCajaDto } from '../../../../../api/interfaces/ventas/caja.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../../shared/components/field-errors/field-errors';
import { useCajas } from '../../../../actions/use-cajas-action';

@Component({
  selector: 'app-crear-caja-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  templateUrl: './crear-caja-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CrearCajaDialog {
  readonly dialogRef = inject<DialogRef<Caja>>(DialogRef);

  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly errorId = `${this.dialogRef.id}-nombre-errors`;

  readonly serverError = signal('');
  readonly createMutation = useCajas().createMutation;
  readonly model = signal<CrearCajaDto>({ nombre: '' });

  readonly cajaForm = form(this.model, (path) => {
    validate(path.nombre, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'Este campo es obligatorio.' },
    );
    maxLength(path.nombre, 150, { message: 'Máximo 150 caracteres.' });
  });

  async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    if (this.createMutation.isPending()) return;
    await submit(this.cajaForm, async (state) => {
      this.serverError.set('');
      this.dialogRef.disableClose = true;
      try {
        const caja = await this.createMutation.mutateAsync({
          nombre: state().value().nombre.trim(),
        });
        this.dialogRef.close(caja);
      } catch {
        this.serverError.set(
          'No se pudo crear la caja. Comprueba la conexión e inténtalo de nuevo.',
        );
      } finally {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
