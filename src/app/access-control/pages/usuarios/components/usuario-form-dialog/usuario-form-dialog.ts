import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { CreateUserDto } from '../../../../../api/interfaces/access-control/usuario.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { FieldErrors } from '../../../../../shared/components/field-errors/field-errors';
import { useCreateUsuarioMutation } from '../../../../actions/usuarios/use-usuarios-api';

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [DialogShell, FormField, FieldErrors],
  host: { class: 'block min-w-0' },
  templateUrl: './usuario-form-dialog.html',
})
export class UsuarioFormDialog {
  readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly today = new Date().toLocaleDateString('sv-SE');
  readonly addUsuarioMutation = useCreateUsuarioMutation();

  protected readonly model = signal<CreateUserDto>({
    nickName: '',
    email: '',
    password: '',
    person: { firstName: '', lastName: '', identityDocument: '', dateOfBirth: '' },
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
    required(path.password, { message: 'La contraseña es obligatoria.' });
    minLength(path.password, 8, { message: 'Usa al menos 8 caracteres.' });
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
      return date > this.today
        ? { kind: 'date', message: 'La fecha no puede ser futura.' }
        : null;
    });
  });

  protected async save(): Promise<void> {
    try {
      await submit(this.userForm, async (field) => {
        const value = field().value();
        this.dialogRef.disableClose = true;
        try {
          const user = await this.addUsuarioMutation.mutateAsync({
            nickName: value.nickName.trim(),
            email: value.email.trim().toLowerCase(),
            password: value.password,
            person: {
              firstName: value.person.firstName.trim(),
              lastName: value.person.lastName.trim(),
              identityDocument: value.person.identityDocument.trim(),
              dateOfBirth: value.person.dateOfBirth,
            },
          });
          this.dialogRef.close(user.id);
        } finally {
          this.dialogRef.disableClose = false;
        }
      });
    } catch {
      // La mutación conserva el error para mostrarlo en el diálogo y permitir reintentar.
    }
  }
}
