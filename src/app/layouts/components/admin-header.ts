import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-admin-header',
  template: `
    <header class="navbar sticky top-0 z-20 min-h-19 border-b border-base-300 bg-base-100 px-4">
      <div class="navbar-start gap-3">
        <label
          [attr.for]="menuControlId()"
          class="btn btn-ghost btn-square btn-sm drawer-button lg:hidden"
          aria-label="Abrir navegación"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h11" /></svg>
        </label>
        <a routerLink="/admin/roles" class="text-sm font-bold tracking-tight text-base-content"
          >Panel operativo</a
        >
      </div>
      <div class="navbar-end gap-2">
        <span class="hidden text-right sm:block">
          <span class="block text-xs font-semibold text-base-content">{{ userName() }}</span>
          <span class="block text-[0.65rem] text-base-content/55">Sesión activa</span>
        </span>
        <div class="avatar avatar-placeholder">
          <div
            class="w-9 rounded-full border border-primary/35 bg-neutral text-xs font-bold text-primary"
          >
            {{ userInitials() }}
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" (click)="logoutRequested.emit()">
          Salir
        </button>
      </div>
    </header>
  `,
  host: { class: 'block' },
})
export class AdminHeader {
  readonly menuControlId = input.required<string>();
  readonly userName = input('Administrador');
  readonly userInitials = input('AD');
  readonly logoutRequested = output<void>();
}
