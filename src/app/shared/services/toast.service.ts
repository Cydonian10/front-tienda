import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPauseReason = 'pointer' | 'focus';

export interface ToastOptions {
  title?: string;
  /** Milliseconds before dismissal. Use 0 to keep the notification until closed. */
  duration?: number;
}

export interface ToastNotification {
  readonly id: number;
  readonly type: ToastType;
  readonly title: string;
  readonly message: string;
  readonly duration: number;
}

interface ToastTimer {
  remaining: number;
  startedAt: number;
  timeout?: ReturnType<typeof setTimeout>;
  readonly pauses: Set<ToastPauseReason>;
}

const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'Operación completada',
  error: 'No se pudo completar',
  warning: 'Atención',
  info: 'Información',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly items = signal<readonly ToastNotification[]>([]);
  private readonly timers = new Map<number, ToastTimer>();
  private nextId = 0;

  /** Additional notifications wait in a queue; their lifetime starts when visible. */
  readonly notifications = computed(() => this.items().slice(0, 3));

  constructor() {
    if (this.isBrowser) {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.clear();
    });
  }

  success(message: string, options: ToastOptions = {}): number {
    return this.show('success', message, options);
  }

  error(message: string, options: ToastOptions = {}): number {
    return this.show('error', message, options);
  }

  warning(message: string, options: ToastOptions = {}): number {
    return this.show('warning', message, options);
  }

  info(message: string, options: ToastOptions = {}): number {
    return this.show('info', message, options);
  }

  show(type: ToastType, message: string, options: ToastOptions = {}): number {
    const id = ++this.nextId;
    // Server rendering must not serialize transient UI or keep the process alive with timers.
    if (!this.isBrowser) return id;

    const requestedDuration = options.duration ?? (type === 'error' ? 0 : 5000);
    const duration = Number.isFinite(requestedDuration) ? Math.max(0, requestedDuration) : 0;
    this.items.update((items) => [
      ...items,
      { id, type, message, title: options.title ?? DEFAULT_TITLES[type], duration },
    ]);
    this.timers.set(id, { remaining: duration, startedAt: 0, pauses: new Set() });
    this.startVisibleTimers();
    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer?.timeout !== undefined) clearTimeout(timer.timeout);
    this.timers.delete(id);
    this.items.update((items) => items.filter((item) => item.id !== id));
    this.startVisibleTimers();
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      if (timer.timeout !== undefined) clearTimeout(timer.timeout);
    }
    this.timers.clear();
    this.items.set([]);
  }

  pause(id: number, reason: ToastPauseReason): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    timer.pauses.add(reason);
    this.stopTimer(timer);
  }

  resume(id: number, reason: ToastPauseReason): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    timer.pauses.delete(reason);
    this.startVisibleTimers();
  }

  private stopTimer(timer: ToastTimer): void {
    if (timer.timeout === undefined) return;
    clearTimeout(timer.timeout);
    timer.timeout = undefined;
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  }

  private startVisibleTimers(): void {
    if (this.document.hidden) return;
    for (const notification of this.notifications()) {
      const timer = this.timers.get(notification.id);
      if (!timer || notification.duration === 0 || timer.timeout !== undefined || timer.pauses.size)
        continue;
      timer.startedAt = Date.now();
      timer.timeout = setTimeout(() => this.dismiss(notification.id), timer.remaining);
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (this.document.hidden) {
      for (const timer of this.timers.values()) this.stopTimer(timer);
    } else {
      this.startVisibleTimers();
    }
  };
}
