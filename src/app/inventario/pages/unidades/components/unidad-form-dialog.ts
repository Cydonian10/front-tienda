import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import type {
  CreateUnidadDto,
  UnidadMedida,
} from '../../../../api/interfaces/inventario/unidad.interface';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../shared/components/field-errors/field-errors';
import { useUnidadMedida } from '../../../actions/use-unidad-medida-action';

@Component({
  selector: 'app-unidad-form-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  templateUrl: './unidad-form-dialog.html',
  host: { class: 'block min-w-0' },
})
export class UnidadFormDialog {
  readonly unidad = inject<UnidadMedida | null>(DIALOG_DATA, { optional: true });
  readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  private readonly actions = useUnidadMedida({
    page: () => 1,
    limit: () => 5,
    nombre: () => '',
    enabled: false,
  });
  readonly createMutation = this.actions.createMutation;
  readonly updateMutation = this.actions.updateMutation;
  readonly serverError = signal('');
  readonly model = signal<CreateUnidadDto>({
    nombre: this.unidad?.nombre ?? '',
    simbolo: this.unidad?.simbolo ?? '',
    tipo: this.unidad?.tipo ?? '',
  });
  readonly unitForm = form(this.model, (path) => {
    for (const field of [path.nombre, path.simbolo, path.tipo]) {
      validate(field, ({ value }) =>
        value().trim() ? null : { kind: 'required', message: 'Este campo es obligatorio.' },
      );
    }
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
    maxLength(path.simbolo, 20, { message: 'Máximo 20 caracteres.' });
    maxLength(path.tipo, 30, { message: 'Máximo 30 caracteres.' });
  });

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.createMutation.isPending() || this.updateMutation.isPending()) return;
    await submit(this.unitForm, async (state) => {
      this.serverError.set('');
      this.dialogRef.disableClose = true;
      try {
        const value = state().value();
        const dto = {
          nombre: value.nombre.trim(),
          simbolo: value.simbolo.trim(),
          tipo: value.tipo.trim(),
        };
        const unidad = this.unidad
          ? await this.updateMutation.mutateAsync({ id: this.unidad.id, dto })
          : await this.createMutation.mutateAsync(dto);
        this.dialogRef.close(unidad.id);
      } catch (error) {
        this.serverError.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'Ya existe una unidad con ese nombre. Escribe otro nombre e inténtalo de nuevo.'
            : `No se pudo ${this.unidad ? 'actualizar' : 'crear'} la unidad. Comprueba tu conexión e inténtalo de nuevo.`,
        );
      } finally {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
