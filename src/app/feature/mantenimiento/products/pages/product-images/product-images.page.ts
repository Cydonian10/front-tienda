import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ImagesService } from '../../../../../core/api/images.service';
import { Image } from '../../../../../core/models/image.model';
import BreadcrumbsNg from '../../../../../shared/breadcrumbs/breadcrumbs.ng';
import { Icon } from '../../../../../shared/icon/icon';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface ImageUpload {
  id: number;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error: string | null;
  retryable: boolean;
  image?: Image;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'product-images-page',
  imports: [BreadcrumbsNg, DecimalPipe, Icon],
  templateUrl: './product-images.page.html',
})
export default class ProductImagesPage implements OnDestroy {
  private readonly imagesService = inject(ImagesService);
  private readonly route = inject(ActivatedRoute);
  private nextUploadId = 0;

  protected readonly productId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly uploads = signal<ImageUpload[]>([]);
  protected readonly isUploading = signal(false);
  protected readonly pageError = signal<string | null>(
    Number.isInteger(this.productId) && this.productId > 0
      ? null
      : 'No se encontró un producto válido para cargar imágenes.',
  );
  protected readonly hasPendingUploads = computed(() =>
    this.uploads().some((upload) => upload.status === 'pending' && upload.retryable),
  );

  ngOnDestroy(): void {
    this.uploads().forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';

    selectedFiles.forEach((file) => this.addFile(file));
  }

  protected async uploadPending(): Promise<void> {
    if (!this.hasPendingUploads() || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);
    try {
      for (const upload of this.uploads()) {
        if (upload.status === 'pending' && upload.retryable) {
          await this.uploadFile(upload);
        }
      }
    } finally {
      this.isUploading.set(false);
    }
  }

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

  private addFile(file: File): void {
    const error = this.validateFile(file);
    this.uploads.update((uploads) => [
      ...uploads,
      {
        id: ++this.nextUploadId,
        file,
        previewUrl: URL.createObjectURL(file),
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        retryable: !error,
      },
    ]);
  }

  private async uploadFile(upload: ImageUpload): Promise<void> {
    this.updateUpload(upload.id, {
      status: 'uploading',
      progress: 0,
      error: null,
    });

    await new Promise<void>((resolve) => {
      this.imagesService.upload(upload.file, 'product', this.productId).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            this.updateUpload(upload.id, { progress });
            return;
          }

          if (event.type === HttpEventType.Response) {
            if (!event.body) {
              this.updateUpload(upload.id, {
                status: 'error',
                error: 'La API no devolvió la imagen cargada.',
              });
              return;
            }
            this.updateUpload(upload.id, {
              status: 'success',
              progress: 100,
              retryable: false,
              image: event.body,
            });
          }
        },
        error: (error: unknown) => {
          this.updateUpload(upload.id, {
            status: 'error',
            error: this.getErrorMessage(error),
            retryable: true,
          });
          resolve();
        },
        complete: resolve,
      });
    });
  }

  private updateUpload(id: number, updates: Partial<ImageUpload>): void {
    this.uploads.update((uploads) =>
      uploads.map((upload) => (upload.id === id ? { ...upload, ...updates } : upload)),
    );
  }

  private validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'Solo se aceptan imágenes JPEG, PNG o WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'La imagen no puede superar 5 MB.';
    }
    return null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) {
        return body.message.join(', ');
      }
      if (body?.message) {
        return body.message;
      }
      return error.message;
    }
    return 'Error inesperado al cargar la imagen.';
  }
}
