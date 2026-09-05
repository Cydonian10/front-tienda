import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { AttributesService } from '../../../../../core/api/attributes.service';
import { ProductsService } from '../../../../../core/api/products.service';
import { AttributeWithValues } from '../../../../../core/models/attribute.model';
import { Product, ProductAttributeItem, UpdateProduct } from '../../../../../core/models/product.model';
import BreadcrumbsNg from '../../../../../shared/breadcrumbs/breadcrumbs.ng';
import { Icon } from '../../../../../shared/icon/icon';
import {
  createProductAttributeRow,
  ProductAttributesEditor,
  ProductAttributeRow,
} from '../../components/product-attributes-editor/product-attributes-editor.component';
import { ProductInventoryFields } from '../../components/product-inventory-fields/product-inventory-fields.component';

function validateProductAttributes(control: AbstractControl): ValidationErrors | null {
  const attributes = control.get('attributes')?.value as
    | Array<{ attributeId: number | null; attributeValueId: number | null }>
    | undefined;

  if (!attributes?.length) {
    return null;
  }

  if (
    attributes.some(
      (attribute) => attribute.attributeId === null || attribute.attributeValueId === null,
    )
  ) {
    return { attributeIncomplete: true };
  }

  const attributeIds = attributes.map((attribute) => attribute.attributeId);
  return new Set(attributeIds).size === attributeIds.length ? null : { attributeDuplicate: true };
}

interface EditableProductState {
  stock: number;
  price: number;
  productAttributes: ProductAttributeItem[];
}

@Component({
  selector: 'edit-product-page',
  imports: [
    BreadcrumbsNg,
    Icon,
    ProductAttributesEditor,
    ProductInventoryFields,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './edit-product.page.html',
})
export default class EditProductPage {
  private readonly attributesService = inject(AttributesService);
  private readonly productsService = inject(ProductsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly attributes = signal<AttributeWithValues[]>([]);
  protected readonly product = signal<Product | null>(null);
  protected readonly productId = this.id;
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly attributeRows = this.formBuilder.array<ProductAttributeRow>([]);
  protected readonly stockControl = this.formBuilder.control<number | null>(null, [
    Validators.required,
    Validators.min(0.01),
  ]);
  protected readonly priceControl = this.formBuilder.control<number | null>(null, [
    Validators.required,
    Validators.min(0.01),
  ]);
  protected readonly form = this.formBuilder.group(
    {
      stock: this.stockControl,
      price: this.priceControl,
      attributes: this.attributeRows,
    },
    { validators: validateProductAttributes },
  );

  private initialState: EditableProductState | null = null;

  constructor() {
    void this.loadPage();
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const productAttributes = this.readProductAttributes();
    const initialState = this.initialState;
    if (!initialState) {
      return;
    }

    const stockChanged = raw.stock !== initialState.stock;
    const priceChanged = raw.price !== initialState.price;
    const attributesChanged =
      JSON.stringify(productAttributes) !== JSON.stringify(initialState.productAttributes);

    if (!stockChanged && !priceChanged && !attributesChanged) {
      toast.info('No hay cambios para guardar');
      return;
    }

    const dto: UpdateProduct = {
      ...(stockChanged ? { stock: raw.stock! } : {}),
      ...(priceChanged ? { price: raw.price! } : {}),
      ...(attributesChanged ? { productAttributes } : {}),
    };

    this.isSubmitting.set(true);
    try {
      const updatedProduct = await firstValueFrom(this.productsService.update(this.id, dto));
      this.applyProduct(updatedProduct);
      toast.success('Producto actualizado correctamente');
      await this.router.navigate(['/mantenimiento/productos']);
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.error.set(message);
      toast.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async loadPage(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [attributes, product] = await Promise.all([
        this.loadAttributes(),
        firstValueFrom(this.productsService.findOne(this.id)),
      ]);
      this.attributes.set(attributes);
      this.applyProduct(product);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAttributes(): Promise<AttributeWithValues[]> {
    const firstPage = await firstValueFrom(
      this.attributesService.findAllWithValues({ page: 1, limit: 100 }),
    );
    if (firstPage.lastPage <= 1) {
      return firstPage.data;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.lastPage - 1 }, (_, index) =>
        firstValueFrom(
          this.attributesService.findAllWithValues({ page: index + 2, limit: 100 }),
        ),
      ),
    );
    return [...firstPage.data, ...remainingPages.flatMap((page) => page.data)];
  }

  private applyProduct(product: Product): void {
    const productAttributes = [...product.productAttributes].sort(
      (first, second) => first.order - second.order,
    );
    const state: EditableProductState = {
      stock: product.stock,
      price: product.price,
      productAttributes: productAttributes.map((attribute) => ({
        attributeId: attribute.attributeId,
        attributeValueId: attribute.attributeValueId,
        order: attribute.order,
      })),
    };

    this.product.set(product);
    this.form.patchValue({ stock: product.stock, price: product.price });
    this.attributeRows.clear();
    productAttributes.forEach((attribute) => {
      const row = createProductAttributeRow(this.formBuilder, attribute.order);
      row.patchValue({
        attributeId: attribute.attributeId,
        attributeValueId: attribute.attributeValueId,
      });
      this.attributeRows.push(row);
    });
    this.form.markAsPristine();
    this.initialState = state;
  }

  private readProductAttributes(): ProductAttributeItem[] {
    return this.attributeRows.controls.map((row) => ({
      attributeId: row.controls.attributeId.value!,
      attributeValueId: row.controls.attributeValueId.value!,
      order: row.controls.order.value,
    }));
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
