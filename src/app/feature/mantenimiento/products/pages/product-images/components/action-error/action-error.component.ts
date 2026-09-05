import { Component, input } from '@angular/core';

@Component({
  selector: 'product-images-action-error',
  templateUrl: './action-error.component.html',
  host: {
    class: 'block alert alert-error',
    role: 'alert',
  },
})
export class ProductImagesActionError {
  readonly message = input.required<string>();
}
