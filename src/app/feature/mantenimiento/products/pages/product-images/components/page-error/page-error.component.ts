import { Component, input } from '@angular/core';

@Component({
  selector: 'product-images-page-error',
  templateUrl: './page-error.component.html',
  host: {
    class: 'block',
  },
})
export class ProductImagesPageError {
  readonly message = input.required<string>();
}
