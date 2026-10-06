import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../api/interfaces/access-control/role.interface';
import { System } from '../../../../api/interfaces/access-control/system.interface';
import { CreateRolMutation } from '../../../actions/roles/create-role-action';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import { FieldErrors } from '../../../../shared/components/field-errors/field-errors';

@Component({
  selector: 'app-create-role-dialog',
  imports: [DialogShell, FormsModule, FormField, FieldErrors],
  template: `
    <app-dialog-shell title="Nuevo rol" [titleId]="titleId">
      <form [id]="formId" (ngSubmit)="save()" class="space-y-4" novalidate>
        <p class="text-sm text-base-content/70">Crear un rol para {{ system.name }}.</p>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Nombre</span>
          <input
            type="text"
            class="input w-full"
            [class.input-error]="createForm.name().touched() && createForm.name().invalid()"
            autocomplete="off"
            [formField]="createForm.name"
            [attr.aria-describedby]="
              createForm.name().touched() && createForm.name().invalid() ? nameErrorId : null
            "
          />
          <app-field-errors [field]="createForm.name()" [errorId]="nameErrorId" />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Descripción</span>
          <textarea
            class="textarea w-full"
            rows="3"
            [formField]="createForm.description"
            [class.textarea-error]="
              createForm.description().touched() && createForm.description().invalid()
            "
            [attr.aria-describedby]="
              createForm.description().touched() && createForm.description().invalid()
                ? descriptionErrorId
                : null
            "
          ></textarea>
          <app-field-errors [field]="createForm.description()" [errorId]="descriptionErrorId" />
        </label>

        @if (createRole.isError()) {
          <p class="text-sm text-error" role="alert">
            No se pudo crear el rol. Comprueba los datos e inténtalo de nuevo.
          </p>
        }
      </form>

      <div dialog-actions class="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          class="btn"
          data-dialog-cancel
          [disabled]="createRole.isPending()"
          (click)="dialogRef.close()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [attr.form]="formId"
          [disabled]="createRole.isPending()"
        >
          {{ createRole.isPending() ? 'Guardando…' : 'Guardar rol' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  host: { class: 'block min-w-0' },
})
export class CreateRoleDialog {
  readonly system = inject<System>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<Role>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly nameErrorId = `${this.dialogRef.id}-name-errors`;
  readonly descriptionErrorId = `${this.dialogRef.id}-description-errors`;

  protected model = signal({
    name: '',
    description: '',
  });

  protected createForm = form(this.model, (path) => {
    validate(path.name, ({ value }) => {
      const name = value().trim();
      if (!name) return { kind: 'required', message: 'El nombre es obligatorio.' };
      if (name.length < 2) {
        return { kind: 'minLength', message: 'El nombre debe tener al menos 2 caracteres.' };
      }
      return null;
    });
    maxLength(path.name, 100, { message: 'El nombre no puede superar los 100 caracteres.' });
    maxLength(path.description, 500, {
      message: 'La descripción no puede superar los 500 caracteres.',
    });
  });

  readonly createRole = CreateRolMutation();

  async save() {
    await submit(this.createForm, async (field) => {
      const { name, description } = field().value();

      this.dialogRef.disableClose = true;

      try {
        const role = await this.createRole.mutateAsync({
          systemId: this.system.id,
          name: name.trim(),
          description: description.trim(),
        });
        this.dialogRef.close(role);
      } finally {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
