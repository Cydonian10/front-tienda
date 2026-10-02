import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-square size-11 shrink-0 focus-visible:outline-primary"
      [attr.aria-label]="theme.isLight() ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'"
      [title]="theme.isLight() ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'"
      (click)="theme.toggle()"
    >
      <app-icon [name]="theme.isLight() ? 'moon' : 'sun'" color="accent" />
    </button>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class ThemeToggle {
  readonly theme = inject(ThemeService);
}
