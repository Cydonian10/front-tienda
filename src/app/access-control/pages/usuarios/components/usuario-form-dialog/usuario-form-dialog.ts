import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { DemoUser, demoToday } from '../../usuarios-demo.data';

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
  templateUrl: './usuario-form-dialog.html',
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
