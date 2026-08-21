import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { BaseProductsService } from '../../../../../core/api/base-products.service';
import { BrandsService } from '../../../../../core/api/brands.service';
import { CategoriesService } from '../../../../../core/api/categories.service';
import { MeasurementUnitsService } from '../../../../../core/api/measurement-units.service';
import { Brand } from '../../../../../core/models/brand.model';
import { Category } from '../../../../../core/models/category.model';
import { UpdateBaseProduct } from '../../../../../core/models/base-product.model';
import { MeasurementUnit } from '../../../../../core/models/measurement-unit.model';
import BreadcrumbsNg from '../../../../../shared/breadcrumbs/breadcrumbs.ng';
import { BaseProductCategoriesPicker } from '../../components/categories-picker/categories-picker.component';
import { BaseProductGeneralData } from '../../components/general-data/general-data.component';
import {
  BaseProductUnitsEditor,
  createUnitRow,
  UnitRowControls,
} from '../../components/units-editor/units-editor.component';

@Component({
  selector: 'edit-base-product-page',
  imports: [
    BreadcrumbsNg,
    ReactiveFormsModule,
    RouterLink,
    BaseProductGeneralData,
    BaseProductCategoriesPicker,
    BaseProductUnitsEditor,
  ],
  templateUrl: './edit-base-product.page.html',
})
export default class EditBaseProductPage {
  private readonly baseProductsService = inject(BaseProductsService);
  private readonly brandsService = inject(BrandsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly measurementUnitsService = inject(MeasurementUnitsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly brands = signal<Brand[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly units = signal<MeasurementUnit[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly unitRows = this.formBuilder.array<FormGroup<UnitRowControls>>([]);
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    brandId: [''],
    categoryIds: [[] as number[]],
    units: this.unitRows,
  });

  constructor() {
    void this.loadPage();
  }

  private async loadPage(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [brands, categories, units, baseProduct] = await Promise.all([
        firstValueFrom(this.brandsService.findAll({ page: 1, limit: 100 })),
        firstValueFrom(this.categoriesService.findAll({ page: 1, limit: 100 })),
        firstValueFrom(this.measurementUnitsService.findAll({ page: 1, limit: 100 })),
        firstValueFrom(this.baseProductsService.findDetail(this.id)),
      ]);
      this.brands.set(brands.data);
      this.categories.set(categories.data);
      this.units.set(units.data);
      this.form.patchValue({
        name: baseProduct.name,
        brandId: baseProduct.brand?.id ? String(baseProduct.brand.id) : '',
        categoryIds: baseProduct.categories.map((category) => category.id),
      });
      baseProduct.units.forEach((unit) => {
        this.unitRows.push(createUnitRow(this.formBuilder, unit.isMain));
        this.unitRows.at(-1).patchValue({ unitId: String(unit.id), factor: unit.factor });
      });
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
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
    if (new Set(units.map((unit) => unit.unitId)).size !== units.length) {
      this.error.set('No se puede repetir la misma unidad en varias filas');
      return;
    }
    const raw = this.form.getRawValue();
    const dto: UpdateBaseProduct = {
      name: raw.name.trim(),
      units,
      brandId: raw.brandId ? Number(raw.brandId) : null,
      categoryIds: raw.categoryIds,
    };
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.baseProductsService.update(this.id, dto));
      toast.success('Producto base actualizado correctamente');
      await this.router.navigate(['/mantenimiento/base-products']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      return Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message ?? error.message);
    }
    return 'Error inesperado';
  }
}
