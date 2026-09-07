import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { AttributesService } from '../../../../../core/api/attributes.service';
import {
  AttributeBatchResult,
  CreateAttributeBatch,
} from '../../../../../core/models/attribute.model';
import { Icon } from '../../../../../shared/icon/icon';

function requiredTrimmed(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function uniqueTrimmedValues(control: AbstractControl): ValidationErrors | null {
  const values = (control.value as string[]).map((value) => value.trim());
  return values.length === new Set(values).size ? null : { duplicateValues: true };
}

@Component({
  selector: 'create-attribute-dialog',
  imports: [Icon, ReactiveFormsModule],
  templateUrl: './create-attribute-dialog.html',
})
export class CreateAttributeDialog {
  private readonly dialogRef = inject(DialogRef<AttributeBatchResult | undefined>);
  private readonly attributesService = inject(AttributesService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly error = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly values = this.formBuilder.nonNullable.array<FormControl<string>>(
    [this.createValueControl()],
    {
      validators: [Validators.required, Validators.maxLength(50), uniqueTrimmedValues],
    },
  );
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, requiredTrimmed]],
    values: this.values,
  });

  protected addValue(): void {
    if (this.values.length < 50) {
      this.values.push(this.createValueControl());
    }
  }

  protected removeValue(index: number): void {
    this.values.removeAt(index);
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateAttributeBatch = {
      name: raw.name.trim(),
      values: raw.values.map((value) => ({ value: value.trim() })),
    };

    this.isSubmitting.set(true);
    try {
      const result = await firstValueFrom(this.attributesService.createWithValues(dto));
      this.dialogRef.close(result);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.error.set(message);
      toast.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private createValueControl(): FormControl<string> {
    return this.formBuilder.nonNullable.control('', [Validators.required, requiredTrimmed]);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) {
        return body.message.join(', ');
      }
      if (body?.message) {
        return body.message;
      }
      return error.message;
    }
    return 'Error inesperado';
  }
}

export function openCreateAttributeDialog(
  dialog: Dialog,
): DialogRef<AttributeBatchResult | undefined, CreateAttributeDialog> {
  return dialog.open(CreateAttributeDialog, {
    width: '34rem',
    maxWidth: 'calc(100vw - 2rem)',
    disableClose: true,
  });
}
