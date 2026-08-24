import { Component, input, output } from '@angular/core';

import { Product } from '../../../../../core/models/product.model';
import { Icon } from '../../../../../shared/icon/icon';
import { NameProduct } from '../name-product/name-product.component';

@Component({
  selector: 'products-table',
  imports: [Icon, NameProduct],
  templateUrl: './products-table.component.html',
  host: {
    class: 'block',
  },
})
export class ProductsTable {
  readonly products = input.required<Product[]>();
  readonly deleteRequested = output<Product>();
  readonly editRequested = output<Product>();

  protected attributesLabel(product: Product): string {
    if (product.productAttributes.length === 0) {
      return '—';
    }
    return product.productAttributes
      .map((attribute) => `${attribute.attributeName}: ${attribute.attributeValue}`)
      .join(', ');
  }
}
