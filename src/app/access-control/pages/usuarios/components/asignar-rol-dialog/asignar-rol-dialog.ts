import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { System } from '../../../../../api/interfaces/access-control/system.interface';
import { Role } from '../../../../../api/interfaces/access-control/role.interface';
import {
  AddUserRoleDto,
  Usuario,
} from '../../../../../api/interfaces/access-control/usuario.interface';
import { findRolesQuery } from '../../../../actions/roles/roles-actions';
import { useUsuariosApi } from '../../../../actions/usuarios/use-usuarios-api';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import {
  SearchSelect,
  SearchSelectOption,
} from '../../../../../shared/components/search-select/search-select';

export interface AssignRoleData {
  user: Usuario;
  systems: System[];
}

@Component({
  selector: 'app-asignar-rol-dialog',
  imports: [DialogShell, ReactiveFormsModule, SearchSelect],
  host: { class: 'block min-w-0' },
  templateUrl: './asignar-rol-dialog.html',
})
export class AsignarRolDialog {
  readonly data = inject<AssignRoleData>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly addRolesMutation = useUsuariosApi().addRolesMutation;
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    systemId: [this.data.systems[0]?.id ?? '', Validators.required],
    roleId: ['', Validators.required],
    validFrom: [new Date().toLocaleDateString('sv-SE'), Validators.required],
    validUntil: [''],
  });
  private readonly selectedSystemId = toSignal(this.form.controls.systemId.valueChanges, {
    initialValue: this.form.controls.systemId.value,
  });
  readonly rolesQuery = findRolesQuery(() => this.selectedSystemId() || undefined);
  protected invalidDates = false;

  protected get availableRoles(): Role[] {
    return (this.rolesQuery.data() ?? []).filter(
      (role) =>
        role.systemId === this.selectedSystemId() &&
        !this.data.user.roles.some((assignment) => assignment.roleId === role.id),
    );
  }

  protected get roleOptions(): SearchSelectOption[] {
    return this.availableRoles.map((role) => ({
      value: role.id,
      label: `${role.name}`,
    }));
  }

  systemChanged(): void {
    this.form.controls.roleId.setValue('');
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { roleId, validFrom, validUntil } = this.form.getRawValue();
    this.invalidDates = !!validUntil && validUntil < validFrom;
    if (this.invalidDates || !this.availableRoles.some((role) => role.id === roleId)) return;

    const dto: AddUserRoleDto = { roleId, validFrom, validUntil: validUntil || null };
    this.dialogRef.disableClose = true;
    try {
      await this.addRolesMutation.mutateAsync({ userId: this.data.user.id, dto });
      this.dialogRef.close();
    } catch {
      // La mutación expone el error para mostrarlo y permitir reintentar.
    } finally {
      this.dialogRef.disableClose = false;
    }
  }
}
