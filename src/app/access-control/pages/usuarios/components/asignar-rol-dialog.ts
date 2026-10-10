import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { DemoRole, DemoSystem, DemoUser, demoFullName, demoToday } from '../usuarios-demo.data';

export interface AssignRoleData {
  user: DemoUser;
  systems: DemoSystem[];
  roles: DemoRole[];
}
export interface AssignRoleResult {
  roleId: string;
  validFrom: string;
  validUntil: string | null;
}

@Component({
  selector: 'app-asignar-rol-dialog',
  imports: [DialogShell, ReactiveFormsModule],
  host: { class: 'block min-w-0' },
  template: `
    <app-dialog-shell title="Asignar rol" [titleId]="titleId">
      <form [id]="formId" [formGroup]="form" (ngSubmit)="save()" class="space-y-5" novalidate>
        <p class="text-sm text-base-content/70">
          Asigna un rol a <strong>{{ fullName(data.user) }}</strong> dentro del sistema elegido.
        </p>
        <label class="block space-y-2 text-sm font-semibold"
          >Sistema
          <select class="select w-full" formControlName="systemId" (change)="systemChanged()">
            @for (system of data.systems; track system.id) {
              <option [value]="system.id">{{ system.name }}</option>
            }
          </select>
        </label>
        <label class="block space-y-2 text-sm font-semibold"
          >Rol
          <select
            class="select w-full"
            formControlName="roleId"
            [attr.aria-invalid]="form.controls.roleId.invalid && form.controls.roleId.touched"
          >
            <option value="">Selecciona un rol</option>
            @for (role of availableRoles; track role.id) {
              <option [value]="role.id">{{ role.name }} · {{ role.code }}</option>
            }
          </select>
        </label>
        @if (!availableRoles.length) {
          <p class="text-sm text-base-content/70">
            No hay roles disponibles para asignar en este sistema.
          </p>
        }
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2 text-sm font-semibold"
            >Válido desde
            <input
              class="input w-full"
              type="date"
              formControlName="validFrom"
              [attr.aria-invalid]="
                form.controls.validFrom.invalid && form.controls.validFrom.touched
              "
            />
          </label>
          <label class="block space-y-2 text-sm font-semibold"
            >Válido hasta <span class="text-xs font-normal text-base-content/70">(opcional)</span>
            <input
              class="input w-full"
              type="date"
              formControlName="validUntil"
              [min]="form.controls.validFrom.value"
            />
          </label>
        </div>
        @if (invalidDates) {
          <p role="alert" class="text-sm text-error">
            La fecha final no puede ser anterior a la inicial.
          </p>
        }
        @if (form.invalid && form.touched) {
          <p role="alert" class="text-sm text-error">Selecciona un rol y una fecha de inicio.</p>
        }
        <p class="text-xs text-base-content/70">Asignación de prueba: no se envía a la API.</p>
      </form>
      <div dialog-actions class="flex flex-col gap-2 sm:flex-row">
        <button type="button" class="btn" data-dialog-cancel (click)="dialogRef.close()">
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [attr.form]="formId"
          [disabled]="!availableRoles.length"
        >
          Asignar rol
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class AsignarRolDialog {
  readonly data = inject<AssignRoleData>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<AssignRoleResult>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  protected readonly fullName = demoFullName;
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    systemId: [this.data.systems[0]?.id ?? '', Validators.required],
    roleId: ['', Validators.required],
    validFrom: [demoToday(), Validators.required],
    validUntil: [''],
  });
  protected invalidDates = false;

  protected get availableRoles(): DemoRole[] {
    return this.data.roles.filter(
      (role) =>
        role.systemId === this.form.controls.systemId.value &&
        !this.data.user.roles.some((assignment) => assignment.roleId === role.id),
    );
  }

  systemChanged(): void {
    this.form.controls.roleId.setValue('');
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { roleId, validFrom, validUntil } = this.form.getRawValue();
    this.invalidDates = !!validUntil && validUntil < validFrom;
    if (this.invalidDates || !this.availableRoles.some((role) => role.id === roleId)) return;
    this.dialogRef.close({ roleId, validFrom, validUntil: validUntil || null });
  }
}
