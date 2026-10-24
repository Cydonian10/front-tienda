import { Component, computed, effect, input, OnDestroy, output, signal, untracked } from '@angular/core';
import type { CrearMarcaDto, EditarMarcaDto, Marca } from '../../../../api/interfaces/inventario/marca.interface';
import { MarcaImagen } from './marca-imagen';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'marca-form',
  imports: [MarcaImagen, Icon],
  templateUrl: './marca-form.html',
  host: { class: 'block min-w-0' },
})
export class MarcaForm implements OnDestroy {
  readonly brand = input<Marca | null>(null);
  readonly saving = input(false);
  readonly serverError = input('');
  readonly saved = output<CrearMarcaDto | EditarMarcaDto>();
  readonly cancelled = output<void>();
  readonly name = signal('');
  readonly image = signal<File | null>(null);
  readonly preview = signal('');
  readonly removeImage = signal(false);
  readonly validation = signal('');
  readonly nameInvalid = computed(() => this.validation().startsWith('El nombre'));
  readonly imageInvalid = computed(() => !!this.validation() && !this.nameInvalid());
  readonly dirty = computed(() => this.name() !== (this.brand()?.nombre ?? '') || !!this.image() || this.removeImage());

  constructor() {
    effect(() => {
      const brand = this.brand();
      untracked(() => {
        this.clearImage();
        this.name.set(brand?.nombre ?? '');
        this.removeImage.set(false);
        this.validation.set('');
      });
    });
  }

  chooseImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file || this.saving()) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      this.validation.set('Elige una imagen JPEG, PNG o WebP de hasta 5 MB.');
      return;
    }
    this.clearImage();
    this.image.set(file);
    this.preview.set(URL.createObjectURL(file));
    this.removeImage.set(false);
    this.validation.set('');
  }

  clearImage(): void {
    if (this.preview()) URL.revokeObjectURL(this.preview());
    this.preview.set('');
    this.image.set(null);
  }

  remove(): void {
    if (this.saving()) return;
    this.clearImage();
    if (this.brand()?.imagenId) this.removeImage.set(true);
    this.validation.set('');
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
    if (this.brand()) {
      const dto: EditarMarcaDto = {
        ...(nombre !== this.brand()!.nombre ? { nombre } : {}),
        ...(this.image() ? { imagen: this.image()! } : {}),
        ...(this.removeImage() ? { quitarImagen: true } : {}),
      };
      if (!Object.keys(dto).length) return;
      this.saved.emit(dto);
    } else {
      this.saved.emit({ nombre, ...(this.image() ? { imagen: this.image()! } : {}) });
    }
  }

  ngOnDestroy(): void {
    this.clearImage();
  }
}
