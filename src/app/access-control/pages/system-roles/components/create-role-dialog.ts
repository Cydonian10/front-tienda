import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../api/interfaces/access-control/role.interface';
import { System } from '../../../../api/interfaces/access-control/system.interface';
import { CreateRolMutation } from '../../../actions/roles/create-role-action';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { form, FormField, submit } from '@angular/forms/signals';

@Component({
  selector: 'app-create-role-dialog',
  imports: [DialogShell, FormsModule, FormField],
  template: `
    <app-dialog-shell title="Nuevo rol" [titleId]="titleId">
      <form (ngSubmit)="save()" class="space-y-4">
        <p class="text-sm text-base-content/70">Crear un rol para {{ system.name }}.</p>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Nombre</span>
          <input
            type="text"
            class="input w-full"
            autocomplete="off"
            [formField]="createForm.name"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Descripción</span>
          <textarea
            class="textarea w-full"
            rows="3"
            [formField]="createForm.description"
          ></textarea>
        </label>

        @if (error()) {
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
          [disabled]="save()"
          (click)="dialogRef.close()"
        >
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Guardando…' : 'Guardar rol' }}
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

  protected model = signal({
    name: '',
    description: '',
  });
  protected createForm = form(this.model, (path) => {});

  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  private readonly createRole = CreateRolMutation();

  async save() {
    submit(this.createForm, async (field) => {
      const { name, description } = field().value();
      try {
        const role = await this.createRole.mutateAsync({
          systemId: this.system.id,
          name,
          description: description.trim(),
        });
        this.dialogRef.close(role);
      } catch {
        this.error.set(true);
      } finally {
        this.saving.set(false);
        this.dialogRef.disableClose = false;
      }
    });
  }
}
