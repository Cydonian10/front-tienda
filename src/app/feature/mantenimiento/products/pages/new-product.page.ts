import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { AttributesService } from '../../../../core/api/attributes.service';
import { BaseProductsService } from '../../../../core/api/base-products.service';
import { ProductsService } from '../../../../core/api/products.service';
import { AttributeWithValues } from '../../../../core/models/attribute.model';
import { BaseProduct } from '../../../../core/models/base-product.model';
import { CreateProduct } from '../../../../core/models/product.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';

function atLeastOneAttribute(control: AbstractControl): ValidationErrors | null {
  const values = control.get('attributeValues')?.value as Array<number | null> | undefined;
  return values?.some((value) => value !== null) ? null : { attributeRequired: true };
}

@Component({
  selector: 'new-product-page',
  imports: [BreadcrumbsNg, ReactiveFormsModule, RouterLink],
  templateUrl: './new-product.page.html',
})
export default class NewProductPage {
  private readonly attributesService = inject(AttributesService);
  private readonly baseProductsService = inject(BaseProductsService);
  private readonly productsService = inject(ProductsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly attributes = signal<AttributeWithValues[]>([]);
  protected readonly baseProducts = signal<BaseProduct[]>([]);
  protected readonly baseProductsPage = signal(1);
  protected readonly baseProductsLastPage = signal(0);
  private readonly baseProductSearch = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly attributeValues = this.formBuilder.array<Array<number | null>>([]);
  protected readonly form = this.formBuilder.group(
    {
      baseProductId: [null as number | null, Validators.required],
      stock: [null as number | null, [Validators.required, Validators.min(0.01)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      attributeValues: this.attributeValues,
    },
    { validators: atLeastOneAttribute },
  );

  constructor() {
    void this.loadOptions();
  }

  protected async onBaseProductSearch(event: Event): Promise<void> {
    this.baseProductsPage.set(1);
    this.baseProductSearch.set((event.target as HTMLInputElement).value);
    await this.loadBaseProducts();
  }

  protected async previousBaseProducts(): Promise<void> {
    if (this.baseProductsPage() <= 1) {
      return;
    }
    this.baseProductsPage.update((page) => page - 1);
    await this.loadBaseProducts();
  }

  protected async nextBaseProducts(): Promise<void> {
    if (this.baseProductsPage() >= this.baseProductsLastPage()) {
      return;
    }
    this.baseProductsPage.update((page) => page + 1);
    await this.loadBaseProducts();
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateProduct = {
      baseProductId: raw.baseProductId!,
      stock: raw.stock!,
      price: raw.price!,
      productAttributes: raw.attributeValues.flatMap((attributeValueId, index) =>
        attributeValueId === null
          ? []
          : [{ attributeId: this.attributes()[index].id, attributeValueId }],
      ),
    };

    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.productsService.create(dto));
      toast.success('Producto creado correctamente');
      await this.router.navigate(['/mantenimiento/productos']);
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.error.set(message);
      toast.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async loadOptions(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [attributes] = await Promise.all([
        firstValueFrom(this.attributesService.findAllWithValues({ page: 1, limit: 100 })),
        this.loadBaseProducts(),
      ]);
      this.attributes.set(attributes.data);
      this.attributeValues.clear();
      for (const attribute of attributes.data) {
        this.attributeValues.push(this.formBuilder.control<number | null>(null));
      }
      this.form.updateValueAndValidity();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadBaseProducts(): Promise<void> {
    const search = this.baseProductSearch().trim();
    const result = await firstValueFrom(
      this.baseProductsService.findAll({
        page: this.baseProductsPage(),
        limit: 10,
        ...(search ? { search } : {}),
      }),
    );
    this.baseProducts.set(result.data);
    this.baseProductsLastPage.set(result.lastPage);
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
