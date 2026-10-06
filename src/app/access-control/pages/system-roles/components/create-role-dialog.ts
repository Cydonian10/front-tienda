import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RolesApi } from '../../../../api/access-control/roles-api';
import { Role } from '../../../../api/interfaces/access-control/role.interface';
import { System } from '../../../../api/interfaces/access-control/system.interface';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';

@Component({
  selector: 'app-create-role-dialog',
  imports: [DialogShell, FormsModule],
  template: `
    <app-dialog-shell title="Nuevo rol" [titleId]="titleId">
      <form [id]="formId" (ngSubmit)="save()" class="space-y-4">
        <p class="text-sm text-base-content/70">Crear un rol para {{ system.name }}.</p>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Nombre</span>
          <input
            name="name"
            type="text"
            class="input w-full"
            required
            maxlength="100"
            autocomplete="off"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Descripción</span>
          <textarea
            name="description"
            class="textarea w-full"
            rows="3"
            maxlength="500"
            [ngModel]="description()"
            (ngModelChange)="description.set($event)"
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
          [disabled]="saving()"
          (click)="dialogRef.close()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [attr.form]="formId"
          [disabled]="saving() || !name().trim()"
        >
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

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  private readonly rolesApi = inject(RolesApi);

  async save() {
    const name = this.name().trim();
    if (!name || this.saving()) return;

    this.saving.set(true);
    this.dialogRef.disableClose = true;
    this.error.set(false);
    try {
      const role = await this.rolesApi.create(this.system.id, name, this.description().trim());
      this.dialogRef.close(role);
    } catch {
      this.error.set(true);
    } finally {
      this.saving.set(false);
      this.dialogRef.disableClose = false;
    }
  }
}
