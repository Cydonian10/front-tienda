import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  imports: [RouterLink, ThemeToggle, Icon],
  selector: 'app-admin-header',
  template: `
    <header
      class="navbar sticky top-0 z-20 min-h-19 gap-3 border-b border-base-300 bg-base-100 px-4 sm:px-6 lg:px-8"
    >
      <div class="navbar-start min-w-0 flex-1 gap-3">
        <label
          #menuTrigger
          [attr.for]="menuControlId()"
          class="btn btn-ghost btn-square size-11 shrink-0 drawer-button focus-visible:outline-primary lg:hidden"
          role="button"
          tabindex="0"
          aria-label="Abrir navegación"
          aria-controls="admin-sidebar"
          [attr.aria-expanded]="menuOpen()"
          (keydown.enter)="$event.preventDefault(); menuToggleRequested.emit()"
          (keydown.space)="$event.preventDefault(); menuToggleRequested.emit()"
        >
          <app-icon name="menu" [size]="18.4" />
        </label>
        <a
          routerLink="/admin/roles"
          class="rounded-field text-sm leading-tight font-semibold text-base-content focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >Panel operativo</a
        >
      </div>
      <div class="navbar-end w-auto shrink-0 gap-1 sm:gap-3">
        <app-theme-toggle />
        <span class="hidden text-right sm:block">
          <span class="block text-xs font-semibold text-base-content">{{ userName() }}</span>
          <span class="mt-0.5 block text-xs text-base-content/70">Sesión activa</span>
        </span>
        <div class="avatar avatar-placeholder" aria-hidden="true">
          <div
            class="w-9 rounded-full border border-base-300 bg-base-200 text-xs font-semibold text-base-content"
          >
            {{ userInitials() }}
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost min-h-11 px-3 text-sm"
          (click)="logoutRequested.emit()"
        >
          Salir
        </button>
      </div>
    </header>
  `,
  host: { class: 'block' },
})
export class AdminHeader {
  private readonly menuTrigger = viewChild<ElementRef<HTMLLabelElement>>('menuTrigger');

  readonly menuControlId = input.required<string>();
  readonly menuOpen = input(false);
  readonly userName = input('Administrador');
  readonly userInitials = input('AD');
  readonly logoutRequested = output<void>();
  readonly menuToggleRequested = output<void>();

  focusMenuTrigger(): void {
    this.menuTrigger()?.nativeElement.focus();
  }
}
