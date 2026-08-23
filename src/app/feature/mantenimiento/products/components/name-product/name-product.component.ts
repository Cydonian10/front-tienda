import { Component, computed, input, output } from '@angular/core';
import { Product } from '../../../../../core/models/product.model';

@Component({
  selector: 'name-product',
  imports: [],
  templateUrl: './name-product.component.html',
})
export class NameProduct {
  readonly product = input.required<Product>();

  readonly nameProductCmputed = computed(() => {
    if (this.product().productAttributes.find((attr) => attr.attributeName === 'Color')) {
      const colorValue = this.product().productAttributes.find(
        (attr) => attr.attributeName === 'Color',
      )?.attributeValue;
      return this.product().baseProductName + ' ' + colorValue;
    }

    return this.product().baseProductName;
  });
}
