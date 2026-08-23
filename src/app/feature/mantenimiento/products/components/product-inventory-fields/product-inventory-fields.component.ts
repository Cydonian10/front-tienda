import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'product-inventory-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './product-inventory-fields.component.html',
})
export class ProductInventoryFields {
  readonly stock = input.required<FormControl<number | null>>();
  readonly price = input.required<FormControl<number | null>>();
}
