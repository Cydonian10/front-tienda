import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  FormField,
  form,
  maxLength,
  required,
  requiredError,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { MeasurementUnitsService } from '../../../../core/api/measurement-units.service';
import {
  CreateMeasurementUnit,
  MeasurementUnit,
} from '../../../../core/models/measurement-unit.model';

export interface MeasurementUnitDialogData {
  measurementUnit?: MeasurementUnit | null;
}

interface MeasurementUnitFormModel {
  name: string;
  value: string;
}

@Component({
  selector: 'measurement-unit-dialog',
  imports: [FormField],
  templateUrl: './measurement-unit-dialog.html',
})
export class MeasurementUnitDialog {
  private readonly dialogRef = inject(DialogRef<MeasurementUnit | undefined>);
  private readonly data = inject<MeasurementUnitDialogData | null>(DIALOG_DATA, {
    optional: true,
  });
  private readonly measurementUnitsService = inject(MeasurementUnitsService);

  protected readonly measurementUnit = this.data?.measurementUnit ?? null;
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly model = signal<MeasurementUnitFormModel>({
    name: this.measurementUnit?.name ?? '',
    value: this.measurementUnit?.value ?? '',
  });

  protected readonly form = form(this.model, (path) => {
    required(path.name, { message: 'El nombre es obligatorio.' });
    required(path.value, { message: 'El valor es obligatorio.' });
    validate(path.name, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: 'El nombre es obligatorio.' }),
    );
    validate(path.value, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: 'El valor es obligatorio.' }),
    );
    maxLength(path.value, 5, {
      message: 'El valor no puede superar 5 caracteres.',
    });
  });

  protected readonly nameError = computed(() => {
    const field = this.form.name();
    if (!field.touched() || !field.invalid()) {
      return null;
    }
    return 'El nombre es obligatorio y no puede contener solo espacios.';
  });

  protected readonly valueError = computed(() => {
    const field = this.form.value();
    if (!field.touched() || !field.invalid()) {
      return null;
    }
    if (field.getError('maxLength')) {
      return 'El valor no puede superar 5 caracteres.';
    }
    return 'El valor es obligatorio y no puede contener solo espacios.';
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.form().markAsTouched();
    if (this.form().invalid()) {
      return;
    }

    const { name, value } = this.form().value();
    const dto: CreateMeasurementUnit = {
      name: name.trim(),
      value: value.trim(),
    };
    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const measurementUnit = this.measurementUnit
        ? await firstValueFrom(this.measurementUnitsService.update(this.measurementUnit.id, dto))
        : await firstValueFrom(this.measurementUnitsService.create(dto));
      this.dialogRef.close(measurementUnit);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected close(): void {
    this.dialogRef.close();
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

export function openMeasurementUnitDialog(
  dialog: Dialog,
  measurementUnit?: MeasurementUnit | null,
): DialogRef<MeasurementUnit | undefined, MeasurementUnitDialog> {
  return dialog.open(MeasurementUnitDialog, {
    data: { measurementUnit: measurementUnit ?? null },
    width: '28rem',
    disableClose: true,
  });
}
