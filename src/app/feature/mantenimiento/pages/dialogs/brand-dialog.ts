import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Brand, CreateBrand } from '../../../../core/models/brand.model';
import { BrandsService } from '../../../../core/api/brands.service';

export interface BrandDialogData {
  brand?: Brand | null;
}

@Component({
  selector: 'brand-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './brand-dialog.html',
})
export class BrandDialog {
  private readonly dialogRef = inject(DialogRef<Brand | undefined>);
  private readonly data = inject<BrandDialogData | null>(DIALOG_DATA, {
    optional: true,
  });
  private readonly brandsService = inject(BrandsService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly brand = this.data?.brand ?? null;
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.brand?.name ?? '', [Validators.required]],
    description: [this.brand?.description ?? ''],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    const { name, description } = this.form.getRawValue();
    const dto: CreateBrand = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      const brand = this.brand
        ? await firstValueFrom(this.brandsService.update(this.brand.id, dto))
        : await firstValueFrom(this.brandsService.create(dto));
      this.dialogRef.close(brand);
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

export function openBrandDialog(
  dialog: Dialog,
  brand?: Brand | null,
): DialogRef<Brand | undefined, BrandDialog> {
  return dialog.open(BrandDialog, {
    data: { brand: brand ?? null },
    width: '28rem',
    disableClose: true,
  });
}
