import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { ImagesService } from '../../../../../core/api/images.service';
import { Image } from '../../../../../core/models/image.model';
import { environment } from '../../../../../../environments/environment';
import BreadcrumbsNg from '../../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openConfirmDialog } from '../../../../../shared/confirm-dialog/confirm-dialog';
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
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private nextUploadId = 0;

  protected readonly productId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly uploads = signal<ImageUpload[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isUploading = signal(false);
  protected readonly isSettingMain = signal<number | null>(null);
  protected readonly isRemoving = signal<number | null>(null);
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
    () =>
      this.uploads().every((upload) => upload.status === 'success') &&
      (this.images().length === 0 || this.images().some((image) => image.isMain)),
  );
  protected readonly actionError = signal<string | null>(null);

  constructor() {
    if (!this.pageError()) {
      void this.loadImages();
    }
  }

  ngOnDestroy(): void {
    this.uploads().forEach((upload) => this.revokePreview(upload.previewUrl));
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

  protected async removeImage(upload: ImageUpload): Promise<void> {
    if (this.isRemoving() !== null) {
      return;
    }

    if (!upload.image) {
      this.revokePreview(upload.previewUrl);
      this.uploads.update((uploads) => uploads.filter((current) => current.id !== upload.id));
      return;
    }

    if (upload.image.isMain && this.images().some((image) => image.id !== upload.image!.id)) {
      this.actionError.set('Marca otra imagen como principal antes de eliminar esta.');
      return;
    }

    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar imagen',
      message: '¿Estás seguro de que deseas eliminar esta imagen del producto?',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!(await firstValueFrom(dialogRef.closed))) {
      return;
    }

    this.actionError.set(null);
    this.isRemoving.set(upload.id);
    try {
      await firstValueFrom(this.imagesService.remove(upload.image.id));
      this.revokePreview(upload.previewUrl);
      this.uploads.update((uploads) => uploads.filter((current) => current.id !== upload.id));
      toast.success('Imagen eliminada correctamente');
    } catch (error) {
      this.actionError.set(this.getErrorMessage(error));
    } finally {
      this.isRemoving.set(null);
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

  protected onFilesSelected(files: File[]): void {
    files.forEach((file) => this.addFile(file));
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

  private validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'Solo se aceptan imágenes JPEG, PNG o WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'La imagen no puede superar 5 MB.';
    }
    return null;
  }

  private async uploadFile(upload: ImageUpload): Promise<void> {
    const file = upload.file;
    if (!file) {
      return;
    }

    this.updateUpload(upload.id, {
      status: 'uploading',
      progress: 0,
      error: null,
    });

    await new Promise<void>((resolve) => {
      this.imagesService.upload(file, 'product', this.productId).subscribe({
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

  private async loadImages(): Promise<void> {
    this.isLoading.set(true);
    try {
      const images = await firstValueFrom(this.imagesService.findAll('product', this.productId));
      this.uploads.set(images.map((image) => this.toUpload(image)));
    } catch (error) {
      this.pageError.set(this.getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private toUpload(image: Image): ImageUpload {
    return {
      id: -image.id,
      previewUrl: this.resolveImageUrl(image.url),
      status: 'success',
      progress: 100,
      error: null,
      retryable: false,
      image,
    };
  }

  private resolveImageUrl(url: string): string {
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  }

  private revokePreview(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
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
