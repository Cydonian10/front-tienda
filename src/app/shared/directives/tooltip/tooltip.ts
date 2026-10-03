import { AriaDescriber } from '@angular/cdk/a11y';
import {
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  host: {
    '[class.tooltip]': 'visibleContent()',
    '[class.tooltip-open]': 'opened()',
    '[class.z-[1100]]': 'opened()',
    '[class.before:z-[1100]]': 'visibleContent()',
    '[class.after:z-[1100]]': 'visibleContent()',
    '[class.tooltip-top]': 'visibleContent() && tooltipPosition() === "top"',
    '[class.tooltip-bottom]': 'visibleContent() && tooltipPosition() === "bottom"',
    '[class.tooltip-left]': 'visibleContent() && tooltipPosition() === "left"',
    '[class.tooltip-right]': 'visibleContent() && tooltipPosition() === "right"',
    '[attr.data-tip]': 'visibleContent() ? text() : null',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'hovered.set(false)',
    '(pointercancel)': 'hovered.set(false)',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
    '(click)': 'dismiss()',
    '(document:keydown.escape)': 'dismiss()',
  },
})
export class Tooltip {
  readonly appTooltip = input<string | null | undefined>('');
  readonly tooltipPosition = input<TooltipPosition>('top');
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });
  readonly text = computed(() => this.appTooltip()?.trim() ?? '');
  readonly hovered = signal(false);
  readonly focused = signal(false);
  readonly dismissed = signal(false);
  readonly visibleContent = computed(
    () => !!this.text() && !this.tooltipDisabled() && !this.dismissed(),
  );
  readonly opened = computed(() => this.visibleContent() && (this.hovered() || this.focused()));

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly describer = inject(AriaDescriber);

  constructor() {
    effect((onCleanup) => {
      const text = this.text();
      if (!text || this.tooltipDisabled()) return;
      const host = this.element.nativeElement;
      this.describer.describe(host, text, 'tooltip');
      onCleanup(() => this.describer.removeDescription(host, text, 'tooltip'));
    });
  }

  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    this.dismissed.set(false);
    this.hovered.set(true);
  }

  onFocusIn(): void {
    this.dismissed.set(false);
    this.focused.set(true);
  }

  onFocusOut(event: FocusEvent): void {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.focused.set(false);
    }
  }

  dismiss(): void {
    if (!this.opened()) return;

    this.dismissed.set(true);
    this.focused.set(false);
  }
}
