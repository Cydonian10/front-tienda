import { Component, input } from '@angular/core';

@Component({
  selector: 'product-images-action-error',
  templateUrl: './action-error.component.html',
  host: {
    class: 'block',
  },
})
export class ProductImagesActionError {
  readonly message = input.required<string>();
}
