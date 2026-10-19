import { Component, computed, effect, ElementRef, inject, input, OnDestroy, output, signal, untracked } from '@angular/core';
import { form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import type { AtributoProducto } from '../../../../../api/interfaces/inventario/producto.interface';
import type { CreateVarianteDto } from '../../../../../api/interfaces/inventario/variante.interface';

interface Preview {
  file: File;
  url: string;
}

@Component({
  selector: 'variante-form',
  imports: [FormField],
  templateUrl: './variante-form.html',
})
export class VarianteForm implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly attributes = input.required<readonly AtributoProducto[]>();
  readonly busy = input(false);
  readonly canCreate = input(true);
  readonly savedVersion = input(0);
  readonly create = output<CreateVarianteDto>();
  readonly images = signal<Preview[]>([]);
  readonly imageError = signal('');
  readonly model = signal({
    sku: '',
    precio: '',
    codigoBarras: '',
    valores: {} as Record<string, string>,
  });
  readonly dirty = computed(() => {
    const model = this.model();
    return !!(model.sku.trim() || model.precio.trim() || model.codigoBarras.trim() ||
      Object.values(model.valores).some((value) => value.trim()) || this.images().length);
  });
  readonly variantForm = form(this.model, (path) => {
    maxLength(path.sku, 100, { message: 'Máximo 100 caracteres.' });
    maxLength(path.codigoBarras, 100, { message: 'Máximo 100 caracteres.' });
    validate(path.precio, ({ value }) =>
      /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value().trim())
        ? null
        : { kind: 'price', message: 'Ingresa un precio válido con hasta dos decimales.' },
    );
    validate(path.valores, ({ value }) => {
      if (this.attributes().some((attribute) => !value()[attribute.atributoId]?.trim())) {
        return { kind: 'values', message: 'Completa el valor de cada atributo.' };
      }
      if (
        this.attributes().some((attribute) => value()[attribute.atributoId]?.trim().length > 150)
      ) {
        return { kind: 'length', message: 'Cada valor admite un máximo de 150 caracteres.' };
      }
      return null;
    });
  });

  constructor() {
    effect(() => {
      const ids = this.attributes().map((attribute) => attribute.atributoId);
      untracked(() =>
        this.model.update((current) => ({
          ...current,
          valores: Object.fromEntries(ids.map((id) => [id, current.valores[id] ?? ''])),
        })),
      );
    });
    effect(() => {
      if (!this.savedVersion()) return;
      untracked(() => {
        this.clearImages();
        this.variantForm().reset({
          sku: '',
          precio: '',
          codigoBarras: '',
          valores: Object.fromEntries(this.attributes().map((a) => [a.atributoId, ''])),
        });
      });
    });
  }

  addImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.canCreate() || this.busy()) {
      input.value = '';
      return;
    }
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    if (this.images().length + files.length > 10) {
      this.imageError.set('Puedes subir hasta 10 imágenes por variante.');
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      this.imageError.set('Solo se permiten imágenes JPEG, PNG o WebP.');
      return;
    }
    if (files.some((file) => !file.size || file.size > 5 * 1024 * 1024)) {
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
    if (!this.canCreate() || this.busy()) return;
    const image = this.images()[index];
    if (!image) return;
    URL.revokeObjectURL(image.url);
    this.images.update((images) => images.filter((_, i) => i !== index));
    this.imageError.set('');
  }

  private clearImages(): void {
    for (const image of this.images()) URL.revokeObjectURL(image.url);
    this.images.set([]);
    this.imageError.set('');
  }

  ngOnDestroy(): void {
    this.clearImages();
  }

  focusFirstField(): void {
    this.host.nativeElement.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy() || !this.canCreate() || !this.attributes().length || this.imageError()) return;
    await submit(this.variantForm, async (state) => {
      const value = state().value();
      this.create.emit({
        sku: value.sku.trim() || undefined,
        precio: value.precio.trim(),
        codigoBarras: value.codigoBarras.trim() || undefined,
        valores: this.attributes().map((attribute) => ({
          atributoId: attribute.atributoId,
          valor: value.valores[attribute.atributoId].trim(),
        })),
        imagenes: this.images().map((image) => image.file),
      });
    });
  }
}
