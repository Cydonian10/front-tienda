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
  template: `
    <div class="card w-full bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title">{{ brand ? 'Editar marca' : 'Nueva marca' }}</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <fieldset class="fieldset">
            <label class="input w-full">
              <span class="label">Nombre</span>
              <input type="text" formControlName="name" placeholder="Ej: Cerámica" required />
            </label>
            <label class="input w-full">
              <span class="label">Descripción</span>
              <input
                type="text"
                formControlName="description"
                placeholder="Ej: Marca de cerámicos"
              />
            </label>
          </fieldset>

          @if (error(); as message) {
            <div role="alert" class="alert alert-error">
              <span>{{ message }}</span>
            </div>
          }

          <div class="card-actions justify-end">
            <button type="button" class="btn" (click)="close()">Cancelar</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="loading loading-spinner"></span>
              }
              {{ brand ? 'Guardar cambios' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
