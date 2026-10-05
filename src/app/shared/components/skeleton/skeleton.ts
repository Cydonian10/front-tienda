import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';

export type SkeletonVariant = 'text' | 'list' | 'cards';

@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
  host: { class: 'block min-w-0' },
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('text');
  readonly count = input(3, { transform: numberAttribute });
  readonly animated = input(true, { transform: booleanAttribute });
  readonly label = input('Cargando contenido…');
  readonly items = computed(() => {
    const count = Number.isFinite(this.count()) ? this.count() : 3;
    return Array.from({ length: Math.min(20, Math.max(1, Math.floor(count))) }, (_, index) => index);
  });
}
