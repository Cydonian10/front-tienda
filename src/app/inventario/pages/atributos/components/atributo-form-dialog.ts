import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import type {
  Atributo,
  AtributoDto,
} from '../../../../api/interfaces/inventario/atributo.interface';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../shared/components/field-errors/field-errors';
import { useAtributos } from '../../../actions/use-atributos-action';

@Component({
  selector: 'app-atributo-form-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  templateUrl: './atributo-form-dialog.html',
  host: { class: 'block min-w-0' },
})
export class AtributoFormDialog {
  readonly atributo = inject<Atributo | null>(DIALOG_DATA, { optional: true });
  readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  private readonly actions = useAtributos({
    page: () => 1,
    limit: () => 10,
    nombre: () => '',
    enabled: false,
  });
  readonly createMutation = this.actions.createMutation;
  readonly updateMutation = this.actions.updateMutation;
  readonly serverError = signal('');
  readonly model = signal<AtributoDto>({ nombre: this.atributo?.nombre ?? '' });
  readonly attributeForm = form(this.model, (path) => {
    validate(path.nombre, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'Escribe el nombre del atributo.' },
    );
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
  });

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.createMutation.isPending() || this.updateMutation.isPending()) return;
    await submit(this.attributeForm, async (state) => {
      this.serverError.set('');
      this.dialogRef.disableClose = true;
      try {
        const dto = { nombre: state().value().nombre.trim() };
        const atributo = this.atributo
          ? await this.updateMutation.mutateAsync({ id: this.atributo.id, dto })
          : await this.createMutation.mutateAsync(dto);
        this.dialogRef.close(atributo.id);
      } catch (error) {
        this.serverError.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'Ya existe un atributo con ese nombre. Escribe otro nombre e inténtalo de nuevo.'
            : `No se pudo ${this.atributo ? 'actualizar' : 'crear'} el atributo. Comprueba tu conexión e inténtalo de nuevo.`,
        );
      } finally {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
