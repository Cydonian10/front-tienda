import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, inject } from '@angular/core';
import { ToastService, ToastType } from '../../services/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private returnFocusTo: HTMLElement | null = null;

  readonly politeNotifications = computed(() =>
    this.toast.notifications().filter((item) => item.type !== 'error'),
  );
  readonly urgentNotifications = computed(() =>
    this.toast.notifications().filter((item) => item.type === 'error'),
  );

  readonly iconClasses: Record<ToastType, string> = {
    success: 'bg-success/15 text-success',
    error: 'bg-error/15 text-error',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
  };

  onFocusIn(id: number, event: FocusEvent): void {
    const previous = event.relatedTarget as HTMLElement | null;
    if (previous && !this.element.nativeElement.contains(previous)) this.returnFocusTo = previous;
    this.toast.pause(id, 'focus');
  }

  onFocusOut(id: number, event: FocusEvent): void {
    const article = event.currentTarget as HTMLElement;
    if (!article.contains(event.relatedTarget as Node | null)) this.toast.resume(id, 'focus');
  }

  dismiss(id: number): void {
    const article = this.element.nativeElement.querySelector<HTMLElement>(
      `[data-toast-id="${id}"]`,
    );
    const hadFocus = article?.contains(this.document.activeElement);
    this.toast.dismiss(id);
    if (hadFocus) {
      const next = this.element.nativeElement.querySelector<HTMLButtonElement>(
        `[data-toast-id]:not([data-toast-id="${id}"]) button`,
      );
      if (next) next.focus();
      else if (this.returnFocusTo?.isConnected) this.returnFocusTo.focus();
    }
  }
}
