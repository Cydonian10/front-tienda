import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { AttributesService } from '../../../../../core/api/attributes.service';
import { AttributeValue, AttributeWithValues } from '../../../../../core/models/attribute.model';
import { openConfirmDialog } from '../../../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../../shared/icon/icon';

function requiredTrimmed(control: AbstractControl): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

export interface EditAttributeDialogData {
  attribute: AttributeWithValues;
}

@Component({
  selector: 'edit-attribute-dialog',
  imports: [Icon, ReactiveFormsModule],
  templateUrl: './edit-attribute-dialog.html',
})
export class EditAttributeDialog {
  private readonly dialogRef = inject(DialogRef<AttributeWithValues | undefined>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly data = inject<EditAttributeDialogData>(DIALOG_DATA);
  private readonly dialog = inject(Dialog);
  private readonly attributesService = inject(AttributesService);

  private readonly currentAttribute = signal<AttributeWithValues>({
    ...this.data.attribute,
    values: [...this.data.attribute.values],
  });
  private readonly valueControls = new Map<number, FormControl<string>>(
    this.data.attribute.values.map((value) => [value.id, this.createValueControl(value.value)]),
  );

  protected readonly values = computed(() => this.currentAttribute().values);
  protected readonly nameControl = this.formBuilder.nonNullable.control(this.data.attribute.name, [
    Validators.required,
    requiredTrimmed,
  ]);
  protected readonly newValueControl = this.createValueControl('');
  protected readonly isSavingName = signal(false);
  protected readonly isAddingValue = signal(false);
  protected readonly pendingValueIds = signal<ReadonlySet<number>>(new Set());
  private readonly nameErrorMessage = signal<string | null>(null);
  private readonly newValueErrorMessage = signal<string | null>(null);
  private readonly valueErrorMessages = signal<Record<number, string>>({});
  private readonly hasChanges = signal(false);

  protected valueControl(value: AttributeValue): FormControl<string> {
    return this.valueControls.get(value.id)!;
  }

  protected nameError(): string | null {
    if (this.nameErrorMessage()) {
      return this.nameErrorMessage();
    }
    return this.nameControl.invalid && this.nameControl.touched
      ? 'El nombre es obligatorio.'
      : null;
  }

  protected newValueError(): string | null {
    if (this.newValueErrorMessage()) {
      return this.newValueErrorMessage();
    }
    return this.newValueControl.invalid && this.newValueControl.touched
      ? 'El valor es obligatorio.'
      : null;
  }

  protected valueError(value: AttributeValue): string | null {
    const message = this.valueErrorMessages()[value.id];
    if (message) {
      return message;
    }
    const control = this.valueControl(value);
    return control.invalid && control.touched ? 'El valor es obligatorio.' : null;
  }

  protected isValueSubmitting(value: AttributeValue): boolean {
    return this.pendingValueIds().has(value.id);
  }

  protected async saveName(): Promise<void> {
    this.nameErrorMessage.set(null);
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      this.showNameError('El nombre es obligatorio.');
      return;
    }

    const name = this.nameControl.value.trim();
    if (name === this.currentAttribute().name) {
      return;
    }

    this.isSavingName.set(true);
    try {
      const updated = await firstValueFrom(
        this.attributesService.update(this.currentAttribute().id, { name }),
      );
      this.currentAttribute.update((attribute) => ({ ...attribute, name: updated.name }));
      this.nameControl.setValue(updated.name);
      this.nameControl.markAsPristine();
      this.hasChanges.set(true);
      toast.success('Nombre del atributo actualizado correctamente');
    } catch (error) {
      this.showNameError(this.getErrorMessage(error));
    } finally {
      this.isSavingName.set(false);
    }
  }

  protected async addValue(): Promise<void> {
    this.newValueErrorMessage.set(null);
    if (this.newValueControl.invalid) {
      this.newValueControl.markAsTouched();
      this.showNewValueError('El valor es obligatorio.');
      return;
    }

    const value = this.newValueControl.value.trim();
    if (this.hasDuplicateValue(value)) {
      this.showNewValueError('Los valores no pueden repetirse.');
      return;
    }

    this.isAddingValue.set(true);
    try {
      const created = await firstValueFrom(
        this.attributesService.createValue({
          value,
          attributeId: this.currentAttribute().id,
        }),
      );
      this.currentAttribute.update((attribute) => ({
        ...attribute,
        values: [...attribute.values, created],
      }));
      this.valueControls.set(created.id, this.createValueControl(created.value));
      this.newValueControl.reset('');
      this.newValueControl.markAsPristine();
      this.newValueControl.markAsUntouched();
      this.hasChanges.set(true);
      toast.success('Valor agregado correctamente');
    } catch (error) {
      this.showNewValueError(this.getErrorMessage(error));
    } finally {
      this.isAddingValue.set(false);
    }
  }

  protected async saveValue(value: AttributeValue): Promise<void> {
    const control = this.valueControl(value);
    this.clearValueError(value.id);
    if (control.invalid) {
      control.markAsTouched();
      this.showValueError(value.id, 'El valor es obligatorio.');
      return;
    }

    const updatedValue = control.value.trim();
    if (this.hasDuplicateValue(updatedValue, value.id)) {
      this.showValueError(value.id, 'Los valores no pueden repetirse.');
      return;
    }
    if (updatedValue === value.value) {
      return;
    }

    this.setValueSubmitting(value.id, true);
    try {
      const updated = await firstValueFrom(
        this.attributesService.updateValue(value.id, { value: updatedValue }),
      );
      this.currentAttribute.update((attribute) => ({
        ...attribute,
        values: attribute.values.map((item) => (item.id === updated.id ? updated : item)),
      }));
      control.setValue(updated.value);
      control.markAsPristine();
      this.hasChanges.set(true);
      toast.success('Valor actualizado correctamente');
    } catch (error) {
      this.showValueError(value.id, this.getErrorMessage(error));
    } finally {
      this.setValueSubmitting(value.id, false);
    }
  }

  protected removeValue(value: AttributeValue): void {
    openConfirmDialog(this.dialog, {
      title: 'Eliminar valor',
      message: `¿Estás seguro de que deseas eliminar el valor "${value.value}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    }).closed.subscribe((confirmed) => {
      if (confirmed) {
        void this.deleteValue(value);
      }
    });
  }

  protected close(): void {
    this.dialogRef.close(this.hasChanges() ? this.currentAttribute() : undefined);
  }

  private async deleteValue(value: AttributeValue): Promise<void> {
    this.setValueSubmitting(value.id, true);
    try {
      await firstValueFrom(this.attributesService.removeValue(value.id));
      this.currentAttribute.update((attribute) => ({
        ...attribute,
        values: attribute.values.filter((item) => item.id !== value.id),
      }));
      this.valueControls.delete(value.id);
      this.clearValueError(value.id);
      this.hasChanges.set(true);
      toast.success('Valor eliminado correctamente');
    } catch (error) {
      toast.error(this.getErrorMessage(error));
    } finally {
      this.setValueSubmitting(value.id, false);
    }
  }

  private hasDuplicateValue(value: string, exceptId?: number): boolean {
    const trimmed = value.trim();
    return this.values().some(
      (item) => item.id !== exceptId && item.value.trim() === trimmed,
    );
  }

  private setValueSubmitting(id: number, isSubmitting: boolean): void {
    this.pendingValueIds.update((ids) => {
      const next = new Set(ids);
      if (isSubmitting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private showNameError(message: string): void {
    this.nameErrorMessage.set(message);
    toast.error(message);
  }

  private showNewValueError(message: string): void {
    this.newValueErrorMessage.set(message);
    toast.error(message);
  }

  private showValueError(id: number, message: string): void {
    this.valueErrorMessages.update((errors) => ({ ...errors, [id]: message }));
    toast.error(message);
  }

  private clearValueError(id: number): void {
    this.valueErrorMessages.update((errors) => {
      const remaining = { ...errors };
      delete remaining[id];
      return remaining;
    });
  }

  private createValueControl(value: string): FormControl<string> {
    return this.formBuilder.nonNullable.control(value, [Validators.required, requiredTrimmed]);
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

export function openEditAttributeDialog(
  dialog: Dialog,
  attribute: AttributeWithValues,
): DialogRef<AttributeWithValues | undefined, EditAttributeDialog> {
  return dialog.open(EditAttributeDialog, {
    data: { attribute },
    width: '42rem',
    maxWidth: 'calc(100vw - 2rem)',
    disableClose: true,
  });
}
