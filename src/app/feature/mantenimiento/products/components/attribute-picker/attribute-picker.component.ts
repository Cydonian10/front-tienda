import { OverlayModule } from '@angular/cdk/overlay';
import { Component, computed, input, output, signal } from '@angular/core';

import { AttributeWithValues } from '../../../../../core/models/attribute.model';

@Component({
  selector: 'product-attribute-picker',
  imports: [OverlayModule],
  templateUrl: './attribute-picker.component.html',
})
export class ProductAttributePicker {
  readonly attributes = input.required<AttributeWithValues[]>();
  readonly excludedAttributeIds = input.required<number[]>();
  readonly selectedAttributeId = input<number | null>(null);
  readonly selectedValueId = input<number | null>(null);

  readonly attributeSelected = output<number>();
  readonly valueSelected = output<number | null>();
  readonly removed = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly search = signal('');
  protected readonly selectedAttribute = computed(() =>
    this.attributes().find((attribute) => attribute.id === this.selectedAttributeId()),
  );
  protected readonly filteredAttributes = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const excluded = new Set(this.excludedAttributeIds());
    return this.attributes().filter(
      (attribute) =>
        !excluded.has(attribute.id) &&
        (!query || attribute.name.toLocaleLowerCase().includes(query)),
    );
  });

  protected selectAttribute(attributeId: number): void {
    this.attributeSelected.emit(attributeId);
    this.search.set('');
    this.isOpen.set(false);
  }

  protected onValueChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.valueSelected.emit(value === '' ? null : Number(value));
  }
}
