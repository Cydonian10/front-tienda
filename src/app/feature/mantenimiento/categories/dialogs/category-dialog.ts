import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Category, CreateCategory } from '../../../../core/models/category.model';
import { CategoriesService } from '../../../../core/api/categories.service';

export interface CategoryDialogData {
  category?: Category | null;
}

@Component({
  selector: 'category-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './category-dialog.html',
})
export class CategoryDialog {
  private readonly dialogRef = inject(DialogRef<Category | undefined>);
  private readonly data = inject<CategoryDialogData | null>(DIALOG_DATA, {
    optional: true,
  });
  private readonly categoriesService = inject(CategoriesService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly category = this.data?.category ?? null;
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.category?.name ?? '', [Validators.required]],
    description: [this.category?.description ?? ''],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    const { name, description } = this.form.getRawValue();
    const dto: CreateCategory = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      const category = this.category
        ? await firstValueFrom(this.categoriesService.update(this.category.id, dto))
        : await firstValueFrom(this.categoriesService.create(dto));
      this.dialogRef.close(category);
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

export function openCategoryDialog(
  dialog: Dialog,
  category?: Category | null,
): DialogRef<Category | undefined, CategoryDialog> {
  return dialog.open(CategoryDialog, {
    data: { category: category ?? null },
    width: '28rem',
    disableClose: true,
  });
}
