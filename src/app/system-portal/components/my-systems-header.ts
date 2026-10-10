import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthLogoutService } from '../../auth/services/auth-logout.service';
import { Icon } from '../../shared/components/icon/icon';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'app-my-systems-header',
  imports: [Icon, RouterLink, ThemeToggle],
  template: `
    <header class="border-b border-base-300 bg-base-100">
      <div class="navbar mx-auto min-h-18 max-w-7xl gap-3 px-4 sm:px-6 lg:px-8">
        <a
          routerLink="/admin"
          class="flex min-w-0 flex-1 items-center gap-3 rounded-field text-base-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-field border border-base-300 bg-base-200 text-primary"
            aria-hidden="true"
          >
            <app-icon name="grid" />
          </span>
          <span class="min-w-0">
            <strong class="block truncate text-sm font-bold tracking-wide">FERRETERÍA</strong>
            <span class="mt-0.5 block truncate text-xs text-base-content/70"
              >Centro de operaciones</span
            >
          </span>
        </a>
        <div class="navbar-end w-auto shrink-0 gap-1 sm:gap-3">
          <span class="hidden max-w-48 truncate text-sm font-medium sm:block">{{
            userName()
          }}</span>
          <app-theme-toggle />
          <button
            type="button"
            class="btn btn-ghost min-h-11 px-3 text-sm"
            (click)="logout.requestLogout()"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  `,
})
export class MySystemsHeader {
  private readonly authStore = inject(AuthStore);
  protected readonly logout = inject(AuthLogoutService);

  readonly userName = computed(() => {
    const profile = this.authStore.authPerfil();
    return (
      [profile?.person?.firstName, profile?.person?.lastName].filter(Boolean).join(' ').trim() ||
      profile?.nickName ||
      'Mi cuenta'
    );
  });
}
