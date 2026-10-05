import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type EmptyStateVariant = 'empty' | 'no-results' | 'error';

const DEFAULTS: Record<EmptyStateVariant, { title: string; description: string; icon: IconName }> = {
  empty: {
    title: 'Todavía no hay registros',
    description: 'Los registros aparecerán aquí cuando agregues el primero.',
    icon: 'inbox',
  },
  'no-results': {
    title: 'No encontramos resultados',
    description: 'Prueba con otra búsqueda o ajusta los filtros para encontrar lo que necesitas.',
    icon: 'search',
  },
  error: {
    title: 'No pudimos cargar la información',
    description: 'Revisa tu conexión e intenta nuevamente.',
    icon: 'error',
  },
};

let nextId = 0;

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  templateUrl: './empty-state.html',
  host: { class: 'block min-w-0' },
})
export class EmptyState {
  readonly variant = input<EmptyStateVariant>('empty');
  readonly title = input<string>();
  readonly description = input<string>();
  readonly icon = input<IconName>();
  readonly actionLabel = input('');
  readonly actionDisabled = input(false, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly action = output<void>();
  readonly id = `empty-state-${nextId++}`;
  readonly resolvedTitle = computed(() => this.title() ?? DEFAULTS[this.variant()].title);
  readonly resolvedDescription = computed(() => this.description() ?? DEFAULTS[this.variant()].description);
  readonly resolvedIcon = computed(() => this.icon() ?? DEFAULTS[this.variant()].icon);
  readonly hasAction = computed(() => !!this.actionLabel().trim());

  onAction(): void {
    if (!this.actionDisabled()) this.action.emit();
  }
}
