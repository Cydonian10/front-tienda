import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import type { Categoria } from '../../../../api/interfaces/inventario/categoria.interface';

@Component({
  selector: 'categoria-form',
  templateUrl: './categoria-form.html',
  host: { class: 'block min-w-0' },
})
export class CategoriaForm {
  readonly category = input<Categoria | null>(null);
  readonly saving = input(false);
  readonly serverError = input('');
  readonly saved = output<{ nombre: string; descripcion: string | null }>();
  readonly cancelled = output<void>();
  readonly name = signal('');
  readonly description = signal('');
  readonly validation = signal('');
  readonly dirty = computed(() => this.name() !== (this.category()?.nombre ?? '') ||
    this.description() !== (this.category()?.descripcion ?? ''));

  constructor() {
    effect(() => {
      const category = this.category();
      untracked(() => {
        this.name.set(category?.nombre ?? '');
        this.description.set(category?.descripcion ?? '');
        this.validation.set('');
      });
    });
  }

  save(event: Event): void {
    event.preventDefault();
    if (this.saving()) return;
    const nombre = this.name().trim();
    if (!nombre || nombre.length > 200) {
      this.validation.set('El nombre debe tener entre 1 y 200 caracteres.');
      return;
    }
    this.validation.set('');
    this.saved.emit({ nombre, descripcion: this.description().trim() || null });
  }
}
