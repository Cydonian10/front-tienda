import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { DemoUser, DemoSystem, DemoRole, demoFullName, demoToday } from '../../usuarios-demo.data';

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
  templateUrl: './asignar-rol-dialog.html',
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
