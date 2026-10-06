import { Component, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { System } from '../../../../api/interfaces/access-control/system.interface';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  imports: [FormsModule, Icon],
  selector: 'system-selector',
  template: `
    <div class="p-4 sm:p-5">
      <h3 class="font-semibold">
        Sistemas
        <span class="badge badge-ghost badge-sm ml-1">{{ systems().length }}</span>
      </h3>
      <input
        type="search"
        class="input mt-4 w-full"
        placeholder="Buscar sistema…"
        aria-label="Buscar sistema"
        [ngModel]="searchSystem()"
        (ngModelChange)="searchSystem.set($event)"
      />
    </div>
    <div class="max-h-130 space-y-1 overflow-auto px-2 pb-4">
      @for (system of filteredSystems(); track system.id) {
        <button
          type="button"
          class="flex min-h-15 w-full items-center gap-3 rounded-field p-3 text-left"
          [class.bg-primary/15]="system.code === selectedSystemCode()"
          [attr.aria-current]="system.code === selectedSystemCode() ? 'true' : null"
          (click)="systemSelected.emit(system)"
        >
          <span
            class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-primary"
          >
            <app-icon name="grid" [size]="18" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-sm">{{ system.name }}</strong>
            <small class="block truncate text-xs text-base-content/70">
              {{ system.code }}
            </small>
          </span>
          @if (system.code === selectedSystemCode()) {
            <app-icon name="chevron-right" [size]="16" class="text-primary" />
          }
        </button>
      }
    </div>
    <p class="border-t border-base-300 p-4 text-xs text-base-content/70">
      Los sistemas son solo lectura
    </p>
  `,
  host: {
    class: 'min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100',
    'aria-label': 'Sistemas',
  },
})
export class SystemSelector {
  readonly systems = input<System[]>([]);
  readonly selectedSystemCode = input<string | null>(null);
  readonly systemSelected = output<System>();

  protected readonly searchSystem = signal('');

  protected readonly filteredSystems = linkedSignal(() => {
    const filter = this.searchSystem().toLocaleLowerCase();
    return this.systems().filter((system) => system.name.toLocaleLowerCase().includes(filter));
  });
}
