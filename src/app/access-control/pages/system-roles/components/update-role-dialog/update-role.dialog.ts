import { Component, inject, OnInit, signal } from '@angular/core';
import { Role } from '../../../../../api/interfaces/access-control/role.interface';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { form, FormField, submit } from '@angular/forms/signals';
import { handleRoles } from '../../../../actions/roles/roles-actions';

@Component({
  imports: [DialogShell, FormField],
  selector: 'update-role-dialog',
  template: `
    <app-dialog-shell title="Actualizar rol" [titleId]="titleId">
      <form class="space-y-4" )>
        <label class="block space-y-2">
          <span class="text-sm font-semibold">Nombre</span>
          <input
            type="text"
            class="input w-full"
            [class.input-error]="updateForm.name().touched() && updateForm.name().invalid()"
            autocomplete="off"
            [formField]="updateForm.name"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold">Descripción</span>
          <input
            type="text"
            class="input w-full"
            [class.input-error]="
              updateForm.description().touched() && updateForm.description().invalid()
            "
            autocomplete="off"
            [formField]="updateForm.description"
          />
        </label>
      </form>

      <div dialog-actions class="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          class="btn"
          data-dialog-cancel
          [disabled]="updateMutation.isPending()"
          (click)="dialogRef.close()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          (click)="onSubmit(); $event.preventDefault()"
          [disabled]="updateMutation.isPending()"
        >
          {{ updateMutation.isPending() ? 'Guardando…' : 'Guardar rol' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  host: { class: 'block min-w-0' },
})
export class UpdateRoleDialog {
  readonly rol = inject<Role>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<Role>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;

  protected model = signal({
    name: this.rol.name,
    description: this.rol.description,
    systemId: this.rol.systemId,
    id: this.rol.id,
  });

  protected updateForm = form(this.model, () => {});

  readonly updateMutation = handleRoles().mutationUpdate;

  async onSubmit() {
    await submit(this.updateForm, async (field) => {
      this.dialogRef.disableClose = true;

      const { description, id, name } = field().value();

      try {
        const role = await this.updateMutation.mutateAsync({
          rolId: id,
          description,
          name,
        });

        this.dialogRef.close(role);
      } catch (error) {
        this.dialogRef.disableClose = false;
      }
    });
  }
}
