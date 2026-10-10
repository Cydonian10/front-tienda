import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { CreateUserDto, UpdateUserDto, Usuario } from '../../../../../api/interfaces/access-control/usuario.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../../shared/components/field-errors/field-errors';
import { useUsuariosApi } from '../../../../actions/usuarios/use-usuarios-api';

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  host: { class: 'block min-w-0' },
  templateUrl: './usuario-form-dialog.html',
})
export class UsuarioFormDialog {
  readonly user = inject<Usuario | null>(DIALOG_DATA, { optional: true });
  readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly today = new Date().toLocaleDateString('sv-SE');
  private readonly usuariosApi = useUsuariosApi();
  readonly addUsuarioMutation = this.usuariosApi.createMutation;
  readonly updateUsuarioMutation = this.usuariosApi.updateMutation;

  protected readonly model = signal<CreateUserDto>({
    nickName: this.user?.nickName ?? '',
    email: this.user?.email ?? '',
    password: '',
    person: {
      firstName: this.user?.person.firstName ?? '',
      lastName: this.user?.person.lastName ?? '',
      identityDocument: this.user?.person.identityDocument ?? '',
      dateOfBirth: this.user?.person.dateOfBirth ?? '',
    },
  });

  protected readonly userForm = form(this.model, (path) => {
    for (const field of [
      path.nickName,
      path.person.firstName,
      path.person.lastName,
      path.person.identityDocument,
    ]) {
      validate(field, ({ value }) =>
        value().trim() ? null : { kind: 'required', message: 'Este campo es obligatorio.' },
      );
    }
    maxLength(path.nickName, 100, { message: 'Máximo 100 caracteres.' });
    maxLength(path.person.firstName, 100, { message: 'Máximo 100 caracteres.' });
    maxLength(path.person.lastName, 100, { message: 'Máximo 100 caracteres.' });
    maxLength(path.person.identityDocument, 50, { message: 'Máximo 50 caracteres.' });
    required(path.email, { message: 'El correo es obligatorio.' });
    email(path.email, { message: 'Escribe un correo válido.' });
    maxLength(path.email, 254, { message: 'Máximo 254 caracteres.' });
    validate(path.password, ({ value }) => {
      const password = value();
      if (!password && !this.user) {
        return { kind: 'required', message: 'La contraseña es obligatoria.' };
      }
      return password && password.length < 8
        ? { kind: 'minLength', message: 'Usa al menos 8 caracteres.' }
        : null;
    });
    validate(path.person.dateOfBirth, ({ value }) => {
      const date = value();
      if (!date) return { kind: 'required', message: 'La fecha es obligatoria.' };
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      ) {
        return { kind: 'date', message: 'Escribe una fecha válida.' };
      }
      return date > this.today ? { kind: 'date', message: 'La fecha no puede ser futura.' } : null;
    });
  });

  protected async save(): Promise<void> {
    try {
      await submit(this.userForm, async (field) => {
        const value = field().value();
        this.dialogRef.disableClose = true;
        try {
          const dto: CreateUserDto = {
            nickName: value.nickName.trim(),
            email: value.email.trim().toLowerCase(),
            password: value.password,
            person: {
              firstName: value.person.firstName.trim(),
              lastName: value.person.lastName.trim(),
              identityDocument: value.person.identityDocument.trim(),
              dateOfBirth: value.person.dateOfBirth,
            },
          };
          if (this.user) {
            const update: UpdateUserDto = {
              nickName: dto.nickName,
              email: dto.email,
              person: dto.person,
              ...(dto.password ? { password: dto.password } : {}),
            };
            await this.updateUsuarioMutation.mutateAsync({ userId: this.user.id, dto: update });
            this.dialogRef.close(this.user.id);
          } else {
            const user = await this.addUsuarioMutation.mutateAsync(dto);
            this.dialogRef.close(user.id);
          }
        } finally {
          this.dialogRef.disableClose = false;
        }
      });
    } catch {
      // La mutación conserva el error para mostrarlo en el diálogo y permitir reintentar.
    }
  }
}
