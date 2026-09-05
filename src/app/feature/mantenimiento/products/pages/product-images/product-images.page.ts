import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { ImagesService } from '../../../../../core/api/images.service';
import BreadcrumbsNg from '../../../../../shared/breadcrumbs/breadcrumbs.ng';
import { Icon } from '../../../../../shared/icon/icon';
import { ProductImagesActionError } from './components/action-error/action-error.component';
import { ProductImagesFilesInput } from './components/files-input/files-input.component';
import { ProductImagesPageError } from './components/page-error/page-error.component';
import { ProductImagesUpload } from './components/product-image-upload/product-image-upload.component';
import { ImageUpload } from './product-images.types';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'product-images-page',
  imports: [
    BreadcrumbsNg,
    Icon,
    ProductImagesActionError,
    ProductImagesFilesInput,
    ProductImagesPageError,
    ProductImagesUpload,
  ],
  templateUrl: './product-images.page.html',
})
export default class ProductImagesPage implements OnDestroy {
  private readonly imagesService = inject(ImagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private nextUploadId = 0;

  protected readonly productId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly uploads = signal<ImageUpload[]>([]);
  protected readonly isUploading = signal(false);
  protected readonly isSettingMain = signal<number | null>(null);
  protected readonly pageError = signal<string | null>(
    Number.isInteger(this.productId) && this.productId > 0
      ? null
      : 'No se encontró un producto válido para cargar imágenes.',
  );
  protected readonly hasPendingUploads = computed(() =>
    this.uploads().some((upload) => upload.status === 'pending' && upload.retryable),
  );
  protected readonly hasRetryableErrors = computed(() =>
    this.uploads().some((upload) => upload.status === 'error' && upload.retryable),
  );
  protected readonly images = computed(() =>
    this.uploads().flatMap((upload) => (upload.image ? [upload.image] : [])),
  );
  protected readonly canFinish = computed(
    () => this.images().length === 0 || this.images().some((image) => image.isMain),
  );
  protected readonly actionError = signal<string | null>(null);

  ngOnDestroy(): void {
    this.uploads().forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
  }

  protected onFilesSelected(files: File[]): void {
    files.forEach((file) => this.addFile(file));
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

  protected async retryFailed(): Promise<void> {
    if (!this.hasRetryableErrors() || this.isUploading()) {
      return;
    }

    this.uploads.update((uploads) =>
      uploads.map((upload) =>
        upload.status === 'error' && upload.retryable
          ? { ...upload, status: 'pending' as const, progress: 0, error: null }
          : upload,
      ),
    );
    await this.uploadPending();
  }

  protected async setMain(upload: ImageUpload): Promise<void> {
    if (!upload.image || upload.image.isMain || this.isSettingMain() !== null) {
      return;
    }

    this.actionError.set(null);
    this.isSettingMain.set(upload.id);
    try {
      const mainImage = await firstValueFrom(this.imagesService.setMain(upload.image.id));
      this.uploads.update((uploads) =>
        uploads.map((current) =>
          current.image
            ? { ...current, image: { ...current.image, isMain: current.image.id === mainImage.id } }
            : current,
        ),
      );
    } catch (error) {
      this.actionError.set(this.getErrorMessage(error));
    } finally {
      this.isSettingMain.set(null);
    }
  }

  protected async finish(): Promise<void> {
    if (!this.canFinish()) {
      this.actionError.set('Selecciona una imagen principal antes de finalizar.');
      return;
    }

    await this.router.navigate(['/mantenimiento/productos']);
    toast.success('Imágenes del producto guardadas correctamente');
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
