import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

@Component({
  imports: [Icon],
  selector: 'app-title-header-admin',
  template: `
    <div>
      <h2 class="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
        {{ title() }}
      </h2>
      <p class="mt-1 text-sm text-base-content/70">
        {{ description() }}
      </p>
    </div>
    <app-icon [name]="iconName()" class="text-primary" [size]="28" />
  `,
  host: { class: 'flex flex-wrap items-start justify-between gap-4' },
})
export class TitleHeaderAdmin {
  readonly iconName = input<IconName>('shield-check');
  readonly title = input.required();
  readonly description = input.required();
}
