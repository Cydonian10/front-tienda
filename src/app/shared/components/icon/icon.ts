import { Component, computed, input, numberAttribute } from '@angular/core';
import { ICONS, IconName, IconShape } from './icons';

const SEMANTIC_COLORS: Readonly<Record<string, string>> = {
  primary: 'var(--color-primary)',
  'primary-content': 'var(--color-primary-content)',
  secondary: 'var(--color-secondary)',
  'secondary-content': 'var(--color-secondary-content)',
  accent: 'var(--color-accent)',
  'accent-content': 'var(--color-accent-content)',
  neutral: 'var(--color-neutral)',
  'neutral-content': 'var(--color-neutral-content)',
  'base-100': 'var(--color-base-100)',
  'base-200': 'var(--color-base-200)',
  'base-300': 'var(--color-base-300)',
  'base-content': 'var(--color-base-content)',
  success: 'var(--color-success)',
  'success-content': 'var(--color-success-content)',
  error: 'var(--color-error)',
  'error-content': 'var(--color-error-content)',
  warning: 'var(--color-warning)',
  'warning-content': 'var(--color-warning-content)',
  info: 'var(--color-info)',
  'info-content': 'var(--color-info-content)',
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      focusable="false"
      [style.stroke-width]="effectiveStrokeWidth()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
    >
      @for (shape of shapes(); track $index) {
        @switch (shape.type) {
          @case ('path') {
            <path [attr.d]="shape.d" />
          }
          @case ('circle') {
            <circle [attr.cx]="shape.cx" [attr.cy]="shape.cy" [attr.r]="shape.r" />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      vertical-align: middle;
      line-height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  host: {
    '[style.width.px]': 'effectiveSize()',
    '[style.height.px]': 'effectiveSize()',
    '[style.color]': 'resolvedColor()',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Semantic daisyUI color name or any CSS color. Default inherits surrounding text. */
  readonly color = input('currentColor');
  /** Size in pixels. Numeric attributes (size="24") are also supported. */
  readonly size = input(20, { transform: numberAttribute });
  readonly strokeWidth = input(1.7, { transform: numberAttribute });
  /** Omit for decorative icons. Supply a label when the icon conveys information alone. */
  readonly label = input('');

  readonly shapes = computed<readonly IconShape[]>(() =>
    Object.hasOwn(ICONS, this.name()) ? ICONS[this.name()] : [],
  );
  readonly effectiveSize = computed(() => this.positiveNumber(this.size(), 20));
  readonly effectiveStrokeWidth = computed(() => this.positiveNumber(this.strokeWidth(), 1.7));
  readonly resolvedColor = computed(() => {
    const color = this.color();
    // Leaving the inline style unset also permits text-* classes on the component host.
    if (color === 'currentColor') return null;
    return Object.hasOwn(SEMANTIC_COLORS, color) ? SEMANTIC_COLORS[color] : color;
  });

  private positiveNumber(value: number, fallback: number): number {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
