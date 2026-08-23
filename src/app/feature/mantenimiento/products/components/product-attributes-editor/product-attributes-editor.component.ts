import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { ProductAttributeOrderService } from '../../../../../core/services/product-attribute-order.service';
import { AttributeWithValues } from '../../../../../core/models/attribute.model';
import { ProductAttributePicker } from '../attribute-picker/attribute-picker.component';

export type ProductAttributeRowControls = {
  attributeId: FormControl<number | null>;
  attributeValueId: FormControl<number | null>;
  order: FormControl<number>;
};

export type ProductAttributeRow = FormGroup<ProductAttributeRowControls>;

export function createProductAttributeRow(
  formBuilder: FormBuilder,
  order: number,
): ProductAttributeRow {
  return formBuilder.group({
    attributeId: formBuilder.control<number | null>(null),
    attributeValueId: formBuilder.control<number | null>(null),
    order: formBuilder.control(order, { nonNullable: true }),
  });
}

@Component({
  selector: 'product-attributes-editor',
  imports: [CdkDrag, CdkDragHandle, CdkDropList, ProductAttributePicker, ReactiveFormsModule],
  templateUrl: './product-attributes-editor.component.html',
})
export class ProductAttributesEditor {
  readonly attributes = input.required<AttributeWithValues[]>();
  readonly attributeRows = input.required<FormArray<ProductAttributeRow>>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly orderService = inject(ProductAttributeOrderService);

  protected addAttribute(): void {
    const order = this.orderService.getPositionNewCard(this.positionCards());
    this.attributeRows().push(createProductAttributeRow(this.formBuilder, order));
  }

  protected removeAttribute(index: number): void {
    this.attributeRows().removeAt(index);
    this.attributeRows().updateValueAndValidity();
  }

  protected dropAttribute(event: CdkDragDrop<ProductAttributeRow[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const rows = this.attributeRows();
    moveItemInArray(rows.controls, event.previousIndex, event.currentIndex);
    rows
      .at(event.currentIndex)
      .controls.order.setValue(
        this.orderService.getPosition(this.positionCards(), event.currentIndex),
      );
    rows.updateValueAndValidity();
    rows.markAsDirty();
  }

  protected selectedAttributeIds(excludeId: number | null): number[] {
    return this.attributeRows()
      .controls.map((row) => row.controls.attributeId.value)
      .filter((id): id is number => id !== null && id !== excludeId);
  }

  protected setAttribute(row: ProductAttributeRow, attributeId: number): void {
    row.controls.attributeId.setValue(attributeId);
    row.controls.attributeValueId.setValue(null);
    row.updateValueAndValidity();
  }

  protected setAttributeValue(row: ProductAttributeRow, valueId: number | null): void {
    row.controls.attributeValueId.setValue(valueId);
    row.updateValueAndValidity();
  }

  private positionCards(): { order: number }[] {
    return this.attributeRows().controls.map((row) => ({ order: row.controls.order.value }));
  }
}
