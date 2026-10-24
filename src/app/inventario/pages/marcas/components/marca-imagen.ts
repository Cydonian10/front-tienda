import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { useMarcaImagen } from '../../../actions/use-marcas-action';

@Component({
  selector: 'marca-imagen',
  template: `
    @if (url()) {
      <img [src]="url()" [alt]="'Imagen de ' + nombre()" class="size-14 rounded-field object-cover" />
    } @else {
      <span class="flex size-14 items-center justify-center rounded-field border border-base-300 bg-base-200 text-center text-xs text-base-content/70"
        [attr.role]="query.isError() ? 'status' : null">
        {{ query.isError() ? 'Imagen no disponible' : imagenId() ? 'Cargando…' : 'Sin imagen' }}
      </span>
    }
  `,
  host: { class: 'block shrink-0' },
})
export class MarcaImagen {
  readonly id = input.required<string>();
  readonly imagenId = input.required<string | null>();
  readonly nombre = input.required<string>();
  private readonly platformId = inject(PLATFORM_ID);
  readonly query = useMarcaImagen(this.id, () => this.imagenId() ?? '');
  readonly url = signal('');

  constructor() {
    effect((onCleanup) => {
      const blob = this.query.data();
      if (!blob || !isPlatformBrowser(this.platformId)) {
        this.url.set('');
        return;
      }
      const url = URL.createObjectURL(blob);
      this.url.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }
}
