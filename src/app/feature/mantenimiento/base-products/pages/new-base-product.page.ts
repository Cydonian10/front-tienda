import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { BaseProductsService } from '../../../../core/api/base-products.service';
import { BrandsService } from '../../../../core/api/brands.service';
import { CategoriesService } from '../../../../core/api/categories.service';
import { MeasurementUnitsService } from '../../../../core/api/measurement-units.service';
import { Brand } from '../../../../core/models/brand.model';
import { Category } from '../../../../core/models/category.model';
import { CreateBaseProduct } from '../../../../core/models/base-product.model';
import { MeasurementUnit } from '../../../../core/models/measurement-unit.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { Icon } from '../../../../shared/icon/icon';

interface UnitRowControls {
  unitId: FormControl<string>;
  factor: FormControl<number>;
  isMain: FormControl<boolean>;
}

@Component({
  selector: 'new-base-product-page',
  imports: [BreadcrumbsNg, ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './new-base-product.page.html',
})
export default class NewBaseProductPage {
  private readonly baseProductsService = inject(BaseProductsService);
  private readonly brandsService = inject(BrandsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly measurementUnitsService = inject(MeasurementUnitsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly brands = signal<Brand[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly units = signal<MeasurementUnit[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly unitRows = this.formBuilder.array<FormGroup<UnitRowControls>>([
    this.createUnitRow(true),
  ]);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    brandId: [''],
    categoryIds: [[] as number[]],
    units: this.unitRows,
  });

  constructor() {
    void this.loadOptions();
  }

  private createUnitRow(isMain: boolean): FormGroup<UnitRowControls> {
    return this.formBuilder.nonNullable.group({
      unitId: [''],
      factor: [1],
      isMain: [isMain],
    });
  }

  private async loadOptions(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [brands, categories, units] = await Promise.all([
        firstValueFrom(this.brandsService.findAll({ page: 1, limit: 100 })),
        firstValueFrom(this.categoriesService.findAll({ page: 1, limit: 100 })),
        firstValueFrom(this.measurementUnitsService.findAll({ page: 1, limit: 100 })),
      ]);
      this.brands.set(brands.data);
      this.categories.set(categories.data);
      this.units.set(units.data);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected isUnitUsed(unitId: number, index: number): boolean {
    if (!unitId) {
      return false;
    }
    return this.unitRows.controls.some(
      (row, i) => i !== index && Number(row.controls.unitId.value) === unitId,
    );
  }

  protected addUnitRow(): void {
    this.unitRows.push(this.createUnitRow(false));
  }

  protected removeUnitRow(index: number): void {
    if (this.unitRows.length === 1) {
      return;
    }
    const wasMain = this.unitRows.at(index).controls.isMain.value;
    this.unitRows.removeAt(index);
    if (wasMain && this.unitRows.length > 0) {
      this.unitRows.at(0).controls.isMain.setValue(true);
    }
  }

  protected setMainRow(index: number): void {
    this.unitRows.controls.forEach((row, i) => {
      row.controls.isMain.setValue(i === index);
    });
  }

  protected isCategorySelected(id: number): boolean {
    return this.form.controls.categoryIds.value.includes(id);
  }

  protected toggleCategory(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.categoryIds.value;
    this.form.controls.categoryIds.setValue(
      checked ? [...current, id] : current.filter((categoryId) => categoryId !== id),
    );
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const units = this.unitRows.controls.map((row) => ({
      unitId: Number(row.controls.unitId.value),
      factor: row.controls.factor.value,
      isMain: row.controls.isMain.value,
    }));

    if (units.some((unit) => !unit.unitId)) {
      this.error.set('Selecciona la unidad de cada fila');
      return;
    }
    if (units.filter((unit) => unit.isMain).length !== 1) {
      this.error.set('Debe haber exactamente una unidad principal');
      return;
    }
    const unitIds = units.map((unit) => unit.unitId);
    if (new Set(unitIds).size !== unitIds.length) {
      this.error.set('No se puede repetir la misma unidad en varias filas');
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateBaseProduct = {
      name: raw.name.trim(),
      units,
      brandId: raw.brandId ? Number(raw.brandId) : null,
      categoryIds: raw.categoryIds,
    };

    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.baseProductsService.create(dto));
      toast.success('Producto base creado correctamente');
      void this.router.navigate(['/mantenimiento/base-products']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
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
