import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import type {
  Almacen,
  CreateAlmacenDto,
} from '../../../../api/interfaces/inventario/almacen.interface';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../shared/components/field-errors/field-errors';
import { useAlmacenes } from '../../../actions/use-almacenes-action';

@Component({
  selector: 'app-almacen-form-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  templateUrl: './almacen-form-dialog.html',
  host: { class: 'block min-w-0' },
})
export class AlmacenFormDialog {
  readonly almacen = inject<Almacen | null>(DIALOG_DATA, { optional: true });
  readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  private readonly actions = useAlmacenes({
    page: () => 1,
    limit: () => 10,
    nombre: () => '',
    activo: () => undefined,
    enabled: false,
  });
  readonly createMutation = this.actions.createMutation;
  readonly updateMutation = this.actions.updateMutation;
  readonly serverError = signal('');
  readonly model = signal<CreateAlmacenDto>({
    nombre: this.almacen?.nombre ?? '',
    activo: this.almacen?.activo ?? true,
  });
  readonly warehouseForm = form(this.model, (path) => {
    validate(path.nombre, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'Este campo es obligatorio.' },
    );
    maxLength(path.nombre, 150, { message: 'Máximo 150 caracteres.' });
  });

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.createMutation.isPending() || this.updateMutation.isPending()) return;
    await submit(this.warehouseForm, async (state) => {
      this.serverError.set('');
      this.dialogRef.disableClose = true;
      try {
        const value = state().value();
        const dto = { nombre: value.nombre.trim(), activo: value.activo };
        const result = this.almacen
          ? await this.updateMutation.mutateAsync({ id: this.almacen.id, dto })
          : await this.createMutation.mutateAsync(dto);
        this.dialogRef.close(result.id);
      } catch (error) {
        this.serverError.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'Ya existe un almacén con ese nombre. Escribe otro nombre.'
            : `No se pudo ${this.almacen ? 'actualizar' : 'crear'} el almacén. Comprueba la conexión e inténtalo de nuevo.`,
        );
      } finally {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
