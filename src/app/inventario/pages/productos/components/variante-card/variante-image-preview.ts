import { Component, computed, effect, input, signal } from '@angular/core';
import { useVarianteImagen } from '../../../../actions/use-variante-action';
import { useProductoImagen } from '../../../../actions/use-productos-action';

@Component({
  selector: 'variante-image-preview',
  template: `
    @if (url(); as source) {
      <img [src]="source" [alt]="description()" class="aspect-square w-full object-cover" />
    } @else {
      <div class="grid aspect-square place-items-center bg-base-200 px-2 text-center text-xs text-base-content/70">
        {{ failed() ? 'Vista previa no disponible' : 'Cargando imagen…' }}
      </div>
    }
  `,
  host: { class: 'block' },
})
export class VarianteImagePreview {
  readonly productId = input.required<string>();
  readonly variantId = input.required<string>();
  readonly imageId = input.required<string>();
  readonly origin = input.required<'producto' | 'variante'>();
  readonly description = input.required<string>();
  private readonly variantFile = useVarianteImagen(
    this.productId, this.variantId, () => this.origin() === 'variante' ? this.imageId() : '',
  );
  private readonly productFile = useProductoImagen(
    this.productId, () => this.origin() === 'producto' ? this.imageId() : '',
  );
  readonly failed = computed(() => this.origin() === 'producto'
    ? this.productFile.isError() : this.variantFile.isError());
  readonly url = signal('');

  constructor() {
    effect((onCleanup) => {
      const file = this.origin() === 'producto' ? this.productFile.data() : this.variantFile.data();
      if (!file) {
        this.url.set('');
        return;
      }
      const address = URL.createObjectURL(file);
      this.url.set(address);
      onCleanup(() => URL.revokeObjectURL(address));
    });
  }
}
