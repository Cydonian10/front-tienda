import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
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
import { BaseProduct, BaseProductDetail } from '../../../../core/models/base-product.model';
import { CreateProduct } from '../../../../core/models/product.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { ProductAttributePicker } from '../components/attribute-picker/attribute-picker.component';

type AttributeRowControls = {
  attributeId: FormControl<number | null>;
  attributeValueId: FormControl<number | null>;
  order: FormControl<number>;
};

const attributeOrderBuffer = 10;

function createAttributeRow(
  formBuilder: FormBuilder,
  order: number,
): FormGroup<AttributeRowControls> {
  return formBuilder.group({
    attributeId: formBuilder.control<number | null>(null),
    attributeValueId: formBuilder.control<number | null>(null),
    order: formBuilder.control(order, { nonNullable: true }),
  });
}

function atLeastOneAttribute(control: AbstractControl): ValidationErrors | null {
  const attributes = control.get('attributes')?.value as
    Array<{ attributeId: number | null; attributeValueId: number | null }> | undefined;
  return attributes?.some(
    (attribute) => attribute.attributeId !== null && attribute.attributeValueId !== null,
  )
    ? null
    : { attributeRequired: true };
}

@Component({
  selector: 'new-product-page',
  imports: [
    BreadcrumbsNg,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    ProductAttributePicker,
    ReactiveFormsModule,
    RouterLink,
  ],
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
  protected readonly baseProductDetail = signal<BaseProductDetail | null>(null);
  protected readonly isLoadingBaseProductDetail = signal(false);
  private readonly baseProductSearch = signal('');
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly attributeRows = this.formBuilder.array<FormGroup<AttributeRowControls>>([
    createAttributeRow(this.formBuilder, attributeOrderBuffer),
  ]);
  protected readonly form = this.formBuilder.group(
    {
      baseProductId: [null as number | null, Validators.required],
      stock: [null as number | null, [Validators.required, Validators.min(0.01)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      attributes: this.attributeRows,
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

  protected async onBaseProductSelected(event: Event): Promise<void> {
    const id = Number((event.target as HTMLSelectElement).value);
    this.form.controls.baseProductId.setValue(id || null);
    this.form.controls.baseProductId.markAsDirty();
    if (!id) {
      this.baseProductDetail.set(null);
      return;
    }
    this.isLoadingBaseProductDetail.set(true);
    try {
      this.baseProductDetail.set(await firstValueFrom(this.baseProductsService.findDetail(id)));
    } catch (err) {
      this.baseProductDetail.set(null);
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoadingBaseProductDetail.set(false);
    }
  }

  protected addAttribute(): void {
    const order = this.getPositionNewCard(this.attributeRows.controls);
    this.attributeRows.push(createAttributeRow(this.formBuilder, order));
  }

  protected removeAttribute(index: number): void {
    this.attributeRows.removeAt(index);
    this.form.updateValueAndValidity();
  }

  protected dropAttribute(event: CdkDragDrop<FormGroup<AttributeRowControls>[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.attributeRows.controls, event.previousIndex, event.currentIndex);
    const order = this.getPosition(this.attributeRows.controls, event.currentIndex);
    this.attributeRows.at(event.currentIndex).controls.order.setValue(order);
    this.attributeRows.updateValueAndValidity();
    this.form.markAsDirty();
  }

  protected selectedAttributeIds(excludeId: number | null): number[] {
    return this.attributeRows.controls
      .map((row) => row.controls.attributeId.value)
      .filter((id): id is number => id !== null && id !== excludeId);
  }

  protected setAttribute(row: FormGroup<AttributeRowControls>, attributeId: number): void {
    row.controls.attributeId.setValue(attributeId);
    row.controls.attributeValueId.setValue(null);
    row.updateValueAndValidity();
  }

  protected setAttributeValue(row: FormGroup<AttributeRowControls>, valueId: number | null): void {
    row.controls.attributeValueId.setValue(valueId);
    row.updateValueAndValidity();
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const productAttributes = raw.attributes.flatMap((attribute) => {
      if (attribute.attributeId === null || attribute.attributeValueId === null) {
        return [];
      }
      return [
        {
          attributeId: attribute.attributeId,
          attributeValueId: attribute.attributeValueId,
          order: attribute.order,
        },
      ];
    });
    const dto: CreateProduct = {
      baseProductId: raw.baseProductId!,
      stock: raw.stock!,
      price: raw.price!,
      productAttributes,
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
      const [attributes] = await Promise.all([this.loadAttributes(), this.loadBaseProducts()]);
      this.attributes.set(attributes);
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

  private async loadAttributes(): Promise<AttributeWithValues[]> {
    const firstPage = await firstValueFrom(
      this.attributesService.findAllWithValues({ page: 1, limit: 100 }),
    );
    if (firstPage.lastPage <= 1) {
      return firstPage.data;
    }
    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.lastPage - 1 }, (_, index) =>
        firstValueFrom(this.attributesService.findAllWithValues({ page: index + 2, limit: 100 })),
      ),
    );
    return [...firstPage.data, ...remainingPages.flatMap((page) => page.data)];
  }

  private getPosition(cards: FormGroup<AttributeRowControls>[], currentIndex: number): number {
    if (cards.length === 1) {
      return attributeOrderBuffer;
    }

    if (currentIndex === 0) {
      return cards[1].controls.order.value / 2;
    }

    const lastIndex = cards.length - 1;
    if (currentIndex < lastIndex) {
      const previousPosition = cards[currentIndex - 1].controls.order.value;
      const nextPosition = cards[currentIndex + 1].controls.order.value;
      return (previousPosition + nextPosition) / 2;
    }

    return cards[lastIndex - 1].controls.order.value + attributeOrderBuffer;
  }

  private getPositionNewCard(cards: FormGroup<AttributeRowControls>[]): number {
    if (cards.length === 0) {
      return attributeOrderBuffer;
    }

    return cards[cards.length - 1].controls.order.value + attributeOrderBuffer;
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
