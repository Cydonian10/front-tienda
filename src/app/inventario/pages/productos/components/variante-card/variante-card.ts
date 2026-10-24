import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, input, OnDestroy, signal, untracked } from '@angular/core';
import type { ProductImage, AtributoProducto } from '../../../../../api/interfaces/inventario/producto.interface';
import type {
  UpdateVarianteDto,
  VarianteImagenEfectiva,
  VarianteResponse,
} from '../../../../../api/interfaces/inventario/variante.interface';
import {
  useActualizarVariante,
  useVarianteImagenes,
} from '../../../../actions/use-variante-action';
import { VarianteImagePreview } from './variante-image-preview';

const PRICE_PATTERN = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface NewImage {
  file: File;
  url: string;
}

@Component({
  selector: 'variante-card',
  imports: [VarianteImagePreview],
  templateUrl: './variante-card.html',
  host: { class: 'block min-w-0' },
})
export class VarianteCard implements OnDestroy {
  readonly productId = input.required<string>();
  readonly variant = input.required<VarianteResponse>();
  readonly productImages = input<readonly ProductImage[]>([]);
  readonly attributes = input<readonly AtributoProducto[]>([]);
  readonly canEdit = input(false);
  readonly galleryQuery = useVarianteImagenes(this.productId, () => this.variant().id);
  readonly updateMutation = useActualizarVariante();
  readonly model = signal({ precio: '', codigoBarras: '', activo: true, valores: {} as Record<string, string> });
  readonly removedIds = signal<string[]>([]);
  readonly newImages = signal<NewImage[]>([]);
  readonly imageError = signal('');
  private readonly savedVersion = signal(0);
  private previousVariantId = '';
  private previousSavedVersion = 0;

  readonly ownImages = computed(() =>
    this.variant().imagenes.filter((image) => !this.removedIds().includes(image.id)),
  );
  readonly ownImageCount = computed(() => this.ownImages().length + this.newImages().length);
  readonly shownImages = computed<VarianteImagenEfectiva[]>(() => {
    if (this.ownImageCount()) {
      return this.ownImages().map((image) => ({ ...image, origen: 'variante' }));
    }
    if (this.variant().imagenes.length && this.removedIds().length) {
      return this.productImages().map((image) => ({ ...image, origen: 'producto' }));
    }
    return this.galleryQuery.data() ?? [];
  });
  readonly valuesDirty = computed(() =>
    this.variant().valores.some((item) =>
      this.model().valores[item.atributoId] !== item.valor,
    ),
  );
  readonly valuesError = computed(() =>
    this.variant().valores.some((item) => {
      const value = this.model().valores[item.atributoId]?.trim() ?? '';
      return !value || value.length > 150;
    }),
  );
  readonly dirty = computed(() => {
    const model = this.model();
    const variant = this.variant();
    return model.precio !== variant.precio || model.codigoBarras !== (variant.codigoBarras ?? '') ||
      model.activo !== variant.activo || this.valuesDirty() ||
      !!this.removedIds().length || !!this.newImages().length;
  });
  readonly priceError = computed(() => !PRICE_PATTERN.test(this.model().precio.trim()));
  readonly apiError = computed(() => {
    const error = this.updateMutation.error();
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message as string;
    }
    return 'No se pudo guardar la variante. Revisa los cambios e inténtalo de nuevo.';
  });

  constructor() {
    effect(() => {
      const variant = this.variant();
      const version = this.savedVersion();
      untracked(() => {
        if (variant.id === this.previousVariantId && version === this.previousSavedVersion) return;
        this.clearNewImages();
        this.removedIds.set([]);
        this.imageError.set('');
        this.model.set({
          precio: variant.precio,
          codigoBarras: variant.codigoBarras ?? '',
          activo: variant.activo,
          valores: Object.fromEntries(variant.valores.map((item) => [item.atributoId, item.valor])),
        });
        this.previousVariantId = variant.id;
        this.previousSavedVersion = version;
      });
    });
  }

  attributeName(attributeId: string): string {
    return this.attributes().find((item) => item.atributoId === attributeId)?.atributo ?? 'Atributo';
  }

  setPrice(event: Event): void {
    this.model.update((value) => ({ ...value, precio: (event.target as HTMLInputElement).value }));
  }

  setBarcode(event: Event): void {
    this.model.update((value) => ({ ...value, codigoBarras: (event.target as HTMLInputElement).value }));
  }

  setActive(event: Event): void {
    this.model.update((value) => ({ ...value, activo: (event.target as HTMLInputElement).checked }));
  }

  setValue(attributeId: string, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.model.update((current) => ({
      ...current,
      valores: { ...current.valores, [attributeId]: text },
    }));
  }

  addImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!this.canEdit() || this.updateMutation.isPending() || !files.length) return;
    if (this.ownImageCount() + files.length > MAX_IMAGES) {
      this.imageError.set('Puedes guardar hasta 10 imágenes propias por variante.');
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      this.imageError.set('Solo se permiten imágenes JPEG, PNG o WebP.');
      return;
    }
    if (files.some((file) => !file.size || file.size > MAX_IMAGE_SIZE)) {
      this.imageError.set('Cada imagen debe pesar entre 1 byte y 5 MB.');
      return;
    }
    this.imageError.set('');
    this.newImages.update((current) => [
      ...current,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  removeSavedImage(id: string): void {
    if (!this.canEdit() || this.updateMutation.isPending() ||
        !this.variant().imagenes.some((image) => image.id === id)) return;
    this.removedIds.update((ids) => [...ids, id]);
    this.imageError.set('');
  }

  removeNewImage(index: number): void {
    if (!this.canEdit() || this.updateMutation.isPending()) return;
    const image = this.newImages()[index];
    if (!image) return;
    URL.revokeObjectURL(image.url);
    this.newImages.update((images) => images.filter((_, position) => position !== index));
    this.imageError.set('');
  }

  private clearNewImages(): void {
    for (const image of this.newImages()) URL.revokeObjectURL(image.url);
    this.newImages.set([]);
  }

  ngOnDestroy(): void {
    this.clearNewImages();
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canEdit() || !this.dirty() || this.updateMutation.isPending() ||
        this.priceError() || this.valuesError() ||
        this.model().codigoBarras.trim().length > 100 || this.imageError()) return;
    const value = this.model();
    const dto: UpdateVarianteDto = {
      precio: value.precio.trim(),
      codigoBarras: value.codigoBarras.trim() || null,
      activo: value.activo,
    };
    if (this.valuesDirty()) {
      dto.valores = this.variant().valores.map((item) => ({
        atributoId: item.atributoId,
        valor: value.valores[item.atributoId].trim(),
      }));
    }
    if (this.removedIds().length || this.newImages().length) {
      dto.imagenesConservarIds = this.ownImages().map((image) => image.id);
      dto.imagenes = this.newImages().map((image) => image.file);
    }
    try {
      await this.updateMutation.mutateAsync({ id: this.productId(), variantId: this.variant().id, dto });
      this.savedVersion.update((version) => version + 1);
    } catch {
      // El borrador local se conserva para corregirlo o reintentar.
    }
  }
}
