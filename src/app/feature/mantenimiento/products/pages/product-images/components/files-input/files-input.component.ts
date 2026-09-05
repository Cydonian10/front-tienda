import { Component, output } from '@angular/core';

@Component({
  selector: 'product-images-files-input',
  templateUrl: './files-input.component.html',
  host: {
    class: 'block',
  },
})
export class ProductImagesFilesInput {
  readonly filesSelected = output<File[]>();

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    this.filesSelected.emit(files);
  }
}
