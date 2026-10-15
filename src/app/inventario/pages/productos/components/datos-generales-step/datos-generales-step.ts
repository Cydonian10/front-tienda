import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import {
  type CreateProductDto,
  type ProductResponse,
  type UpdateProductDto,
  type Unidad,
} from '../../../../../api/interfaces/inventario/producto.interface';
import { FieldErrors } from '../../../../../shared/components/field-errors/field-errors';
import { Icon } from '../../../../../shared/components/icon/icon';
import { ProductoApi } from '../../../../../api/inventario/product-api';

interface SelectedImage {
  file: File;
  url: string;
}

@Component({
  selector: 'datos-generales-step',
  imports: [Icon, FormField, FieldErrors],
  templateUrl: './datos-generales-step.html',
  host: { class: 'block' },
})
export class DatosGeneralesStep implements OnDestroy {
  private readonly api = inject(ProductoApi);
  readonly saving = input(false);
  readonly product = input<ProductResponse | null>(null);
  readonly create = output<CreateProductDto>();
  readonly update = output<UpdateProductDto>();
  readonly editingChange = output<boolean>();
  readonly editing = signal(false);
  private previousProductId: string | null = null;
  readonly unidades = signal<Unidad[]>([]);
  readonly loadingUnidades = signal(true);
  readonly unitsError = signal(false);
  readonly images = signal<SelectedImage[]>([]);
  readonly removedImageIds = signal<string[]>([]);
  readonly savedImageUrls = signal<Record<string, string>>({});
  readonly loadingImages = signal(false);
  readonly imagesLoadError = signal(false);
  readonly imageError = signal('');
  readonly existingImages = computed(() =>
    (this.product()?.imagenes ?? [])
      .filter((image) => !this.removedImageIds().includes(image.id))
      .sort((a, b) => a.orden - b.orden),
  );
  readonly totalImages = computed(() => this.existingImages().length + this.images().length);
  readonly principalImageId = computed(
    () =>
      this.existingImages().find((image) => image.esPrincipal)?.id ?? this.existingImages()[0]?.id,
  );
  private imageLoadVersion = 0;

  readonly model = signal<Omit<CreateProductDto, 'imagenes'>>({
    nombre: '',
    descripcion: '',
    unidadBaseId: '',
    activo: true,
  });

  readonly productForm = form(this.model, (path) => {
    validate(path.nombre, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'El nombre es obligatorio.' },
    );
    maxLength(path.nombre, 200, { message: 'Máximo 200 caracteres.' });
    required(path.unidadBaseId, { message: 'Selecciona una unidad base.' });
  });

  constructor() {
    void this.loadUnidades();
    effect(() => {
      const product = this.product();
      untracked(() => {
        if (product) {
          this.clearNewImages();
          this.removedImageIds.set([]);
          this.imageError.set('');
          this.model.set({
            nombre: product.nombre,
            descripcion: product.descripcion ?? '',
            unidadBaseId: product.unidadBaseId,
            activo: product.activo,
          });
          this.editing.set(false);
          this.editingChange.emit(false);
          void this.loadSavedImages(product.id, product.imagenes);
        } else if (this.previousProductId) {
          this.clearNewImages();
          this.removedImageIds.set([]);
          this.clearSavedImages();
          this.model.set({ nombre: '', descripcion: '', unidadBaseId: '', activo: true });
          this.editing.set(false);
          this.editingChange.emit(false);
        }
        this.previousProductId = product?.id ?? null;
      });
    });
  }

  startEdit(): void {
    this.editing.set(true);
    this.editingChange.emit(true);
  }

  cancelEdit(): void {
    const product = this.product();
    if (!product) return;
    this.model.set({
      nombre: product.nombre,
      descripcion: product.descripcion ?? '',
      unidadBaseId: product.unidadBaseId,
      activo: product.activo,
    });
    this.clearNewImages();
    this.removedImageIds.set([]);
    this.imageError.set('');
    this.editing.set(false);
    this.editingChange.emit(false);
  }

  async loadUnidades(): Promise<void> {
    this.loadingUnidades.set(true);
    this.unitsError.set(false);
    try {
      this.unidades.set(await this.api.listUnidades());
    } catch {
      this.unitsError.set(true);
    } finally {
      this.loadingUnidades.set(false);
    }
  }

  addImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    if (this.totalImages() + files.length > 8) {
      this.imageError.set('Puedes agregar hasta 8 imágenes por producto.');
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      this.imageError.set('Solo se permiten imágenes JPEG, PNG o WebP.');
      return;
    }
    if (files.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024)) {
      this.imageError.set('Cada imagen debe pesar entre 1 byte y 5 MB.');
      return;
    }

    this.imageError.set('');
    this.images.update((images) => [
      ...images,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  removeImage(index: number): void {
    const image = this.images()[index];
    if (!image) return;
    URL.revokeObjectURL(image.url);
    this.images.update((images) => images.filter((_, position) => position !== index));
    this.imageError.set('');
  }

  removeSavedImage(id: string): void {
    if (!this.editing() || this.saving()) return;
    this.removedImageIds.update((ids) => [...ids, id]);
    this.imageError.set('');
  }

  private async loadSavedImages(
    productId: string,
    images: NonNullable<ProductResponse['imagenes']>,
  ): Promise<void> {
    const version = ++this.imageLoadVersion;
    this.clearSavedImageUrls();
    this.loadingImages.set(images.length > 0);
    this.imagesLoadError.set(false);
    const results = await Promise.allSettled(
      images.map(async (image) => ({
        id: image.id,
        url: URL.createObjectURL(await this.api.getImage(productId, image.imagenId)),
      })),
    );
    if (version !== this.imageLoadVersion) {
      for (const result of results) {
        if (result.status === 'fulfilled') URL.revokeObjectURL(result.value.url);
      }
      return;
    }
    const urls: Record<string, string> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') urls[result.value.id] = result.value.url;
      else this.imagesLoadError.set(true);
    }
    this.savedImageUrls.set(urls);
    this.loadingImages.set(false);
  }

  private clearSavedImageUrls(): void {
    for (const url of Object.values(this.savedImageUrls())) URL.revokeObjectURL(url);
    this.savedImageUrls.set({});
  }

  private clearSavedImages(): void {
    this.imageLoadVersion++;
    this.clearSavedImageUrls();
    this.loadingImages.set(false);
    this.imagesLoadError.set(false);
  }

  private clearNewImages(): void {
    for (const image of this.images()) URL.revokeObjectURL(image.url);
    this.images.set([]);
  }

  ngOnDestroy(): void {
    this.clearNewImages();
    this.clearSavedImages();
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (
      this.saving() ||
      (this.product() && !this.editing()) ||
      this.loadingUnidades() ||
      this.unitsError() ||
      this.imageError()
    )
      return;
    await submit(this.productForm, async (formState) => {
      const value = formState().value();
      const dto = { ...value, nombre: value.nombre.trim() };
      if (this.product()) {
        this.update.emit(
          this.removedImageIds().length || this.images().length
            ? {
                ...dto,
                imagenesConservarIds: this.existingImages().map((image) => image.id),
                imagenes: this.images().map((image) => image.file),
              }
            : dto,
        );
      } else {
        this.create.emit({ ...dto, imagenes: this.images().map((image) => image.file) });
      }
    });
  }
}
