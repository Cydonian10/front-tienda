import { Component, inject, input, OnDestroy, output, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import {
  ProductoApi,
  type CreateProductDto,
  type Unidad,
} from '../../../../../api/inventario/product-api';
import { FieldErrors } from '../../../../../shared/components/field-errors/field-errors';
import { Icon } from '../../../../../shared/components/icon/icon';

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
  readonly created = input(false);
  readonly create = output<CreateProductDto>();
  readonly unidades = signal<Unidad[]>([]);
  readonly loadingUnidades = signal(true);
  readonly unitsError = signal(false);
  readonly images = signal<SelectedImage[]>([]);
  readonly imageError = signal('');

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

    if (this.images().length + files.length > 8) {
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

  ngOnDestroy(): void {
    for (const image of this.images()) URL.revokeObjectURL(image.url);
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (
      this.saving() ||
      this.created() ||
      this.loadingUnidades() ||
      this.unitsError() ||
      this.imageError()
    )
      return;
    await submit(this.productForm, async (formState) => {
      const value = formState().value();
      this.create.emit({
        ...value,
        nombre: value.nombre.trim(),
        imagenes: this.images().map((image) => image.file),
      });
    });
  }
}
