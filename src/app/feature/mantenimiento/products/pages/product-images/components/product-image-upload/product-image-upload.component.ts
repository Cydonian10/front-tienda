import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { Icon } from '../../../../../../../shared/icon/icon';
import { ImageUpload, UploadStatus } from '../../product-images.types';

@Component({
  selector: 'product-images-upload',
  imports: [DecimalPipe, Icon],
  templateUrl: './product-image-upload.component.html',
  host: {
    class: 'block',
  },
})
export class ProductImagesUpload {
  readonly upload = input.required<ImageUpload>();
  readonly isSettingMain = input<number | null>(null);
  readonly isRemoving = input<number | null>(null);
  readonly setMain = output<ImageUpload>();
  readonly removeRequested = output<ImageUpload>();

  protected statusLabel(status: UploadStatus): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'uploading':
        return 'Subiendo';
      case 'success':
        return 'Cargada';
      case 'error':
        return 'Error';
    }
  }
}
