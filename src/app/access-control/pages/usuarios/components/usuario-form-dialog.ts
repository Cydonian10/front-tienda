import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogShell } from '../../../../shared/components/dialog-shell/dialog-shell';
import { DemoUser, demoToday } from '../usuarios-demo.data';

export interface UserFormData {
  user: DemoUser | null;
  users: DemoUser[];
}

export type UserFormResult = Pick<
  DemoUser,
  'email' | 'nickName' | 'active' | 'emailVerified' | 'person'
>;

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [DialogShell, ReactiveFormsModule],
  host: { class: 'block min-w-0' },
  template: `
    <app-dialog-shell [title]="data.user ? 'Editar usuario' : 'Nuevo usuario'" [titleId]="titleId">
      <form [id]="formId" [formGroup]="form" (ngSubmit)="save()" class="space-y-4" novalidate>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2 text-sm font-semibold"
            >Nombres
            <input
              class="input w-full"
              formControlName="firstName"
              autocomplete="given-name"
              maxlength="100"
              [attr.aria-invalid]="invalid('firstName')"
            />
          </label>
          <label class="block space-y-2 text-sm font-semibold"
            >Apellidos
            <input
              class="input w-full"
              formControlName="lastName"
              autocomplete="family-name"
              maxlength="100"
              [attr.aria-invalid]="invalid('lastName')"
            />
          </label>
          <label class="block space-y-2 text-sm font-semibold"
            >Documento de identidad
            <input
              class="input w-full"
              formControlName="identityDocument"
              maxlength="50"
              [attr.aria-invalid]="invalid('identityDocument')"
            />
          </label>
          <label class="block space-y-2 text-sm font-semibold"
            >Fecha de nacimiento
            <input
              class="input w-full"
              type="date"
              formControlName="dateOfBirth"
              [max]="today"
              [attr.aria-invalid]="invalid('dateOfBirth')"
            />
          </label>
        </div>
        <label class="block space-y-2 text-sm font-semibold"
          >Correo electrónico
          <input
            class="input w-full"
            type="email"
            formControlName="email"
            autocomplete="email"
            [attr.aria-invalid]="invalid('email')"
          />
        </label>
        <label class="block space-y-2 text-sm font-semibold"
          >Nombre visible
          <input
            class="input w-full"
            formControlName="nickName"
            maxlength="100"
            [attr.aria-invalid]="invalid('nickName')"
          />
        </label>
        <div class="flex flex-wrap gap-5 pt-1">
          <label class="flex cursor-pointer items-center gap-2 text-sm"
            ><input type="checkbox" class="checkbox checkbox-sm" formControlName="active" /> Usuario
            activo</label
          >
          <label class="flex cursor-pointer items-center gap-2 text-sm"
            ><input type="checkbox" class="checkbox checkbox-sm" formControlName="emailVerified" />
            Correo verificado</label
          >
        </div>
        @if (invalidData || (form.invalid && attempted)) {
          <p class="text-sm text-error" role="alert">
            Revisa los campos obligatorios y la fecha de nacimiento.
          </p>
        }
        @if (duplicateEmail) {
          <p class="text-sm text-error" role="alert">
            Ya existe un usuario con ese correo electrónico.
          </p>
        }
        <p class="text-xs text-base-content/70">
          Vista de demostración: estos datos no se envían a la API.
        </p>
      </form>
      <div dialog-actions class="flex flex-col gap-2 sm:flex-row">
        <button type="button" class="btn" data-dialog-cancel (click)="dialogRef.close()">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" [attr.form]="formId">
          {{ data.user ? 'Guardar cambios' : 'Crear usuario' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class UsuarioFormDialog {
  readonly data = inject<UserFormData>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<UserFormResult>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly today = demoToday();
  private readonly fb = inject(FormBuilder).nonNullable;
  protected duplicateEmail = false;
  protected invalidData = false;
  protected attempted = false;
  readonly form = this.fb.group({
    firstName: [
      this.data.user?.person.firstName ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
    lastName: [
      this.data.user?.person.lastName ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
    identityDocument: [
      this.data.user?.person.identityDocument ?? '',
      [Validators.required, Validators.maxLength(50)],
    ],
    dateOfBirth: [this.data.user?.person.dateOfBirth ?? '', Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    nickName: [this.data.user?.nickName ?? '', [Validators.required, Validators.maxLength(100)]],
    active: [this.data.user?.active ?? true],
    emailVerified: [this.data.user?.emailVerified ?? false],
  });

  protected invalid(
    name: 'firstName' | 'lastName' | 'identityDocument' | 'dateOfBirth' | 'email' | 'nickName',
  ): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.attempted);
  }

  save(): void {
    this.attempted = true;
    this.invalidData = false;
    this.duplicateEmail = false;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (
      !value.firstName.trim() ||
      !value.lastName.trim() ||
      !value.identityDocument.trim() ||
      !value.nickName.trim() ||
      value.dateOfBirth > this.today ||
      !value.email.trim()
    ) {
      this.invalidData = true;
      return;
    }
    const email = value.email.trim().toLowerCase();
    this.duplicateEmail = this.data.users.some(
      (user) => user.id !== this.data.user?.id && user.email.toLowerCase() === email,
    );
    if (this.duplicateEmail) return;
    this.dialogRef.close({
      email,
      nickName: value.nickName.trim(),
      active: value.active,
      emailVerified: value.emailVerified,
      person: {
        id: this.data.user?.person.id ?? crypto.randomUUID(),
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        identityDocument: value.identityDocument.trim(),
        dateOfBirth: value.dateOfBirth,
        active: this.data.user?.person.active ?? true,
      },
    });
  }
}
