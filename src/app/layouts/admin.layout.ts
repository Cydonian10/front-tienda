import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AdminHeader } from './components/admin-header';
import { AdminFooterPage } from './components/admin-footer';
import { Icon } from '../shared/components/icon/icon';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { AuthProfileService } from '../auth/services/auth-profile.service';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { ConfirmDialogService } from '../shared/services/confirm-dialog/confirm-dialog.service';
import { AuthStore } from '../store/auth/auth.store';
import { SystemMenuGroup } from '../system-portal/models/system-menu.model';
import { SystemMenuService } from '../system-portal/services/control-access/system-menu.service';

@Component({
  imports: [RouterOutlet, AdminHeader, AdminFooterPage, RouterLink, RouterLinkActive, Icon],
  selector: 'app-admin',
  template: `
    <div
      class="admin-shell drawer min-h-dvh bg-base-100 text-base-content lg:drawer-open"
      (keydown.escape)="closeNavigation()"
    >
      <input
        #navigationToggle
        id="admin-navigation"
        type="checkbox"
        class="drawer-toggle"
        aria-label="Mostrar navegación"
        [checked]="navigationOpen()"
        (change)="navigationOpen.set(navigationToggle.checked)"
      />

      <div class="drawer-content flex min-h-dvh min-w-0 flex-col">
        <a
          href="#admin-content"
          class="btn fixed top-3 left-3 z-50 -translate-y-24 focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <app-admin-header
          menuControlId="admin-navigation"
          [menuOpen]="navigationOpen()"
          (menuToggleRequested)="navigationOpen.set(!navigationOpen())"
          (logoutRequested)="logout()"
          [userName]="userName()"
        />

        <main
          id="admin-content"
          tabindex="-1"
          class="admin-workspace min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
          aria-labelledby="admin-section-title"
        >
          <div class="mx-auto w-full max-w-7xl">
            <router-outlet />
          </div>
        </main>
        <app-admin-footer />
      </div>

      <div id="admin-sidebar" class="drawer-side z-30 lg:z-10">
        <label
          for="admin-navigation"
          aria-label="Cerrar navegación"
          class="drawer-overlay"
          (click)="$event.preventDefault(); closeNavigation()"
        ></label>
        <aside
          class="admin-sidebar flex min-h-dvh w-66 max-w-[85vw] flex-col border-r border-base-300 bg-base-100 text-base-content"
        >
          <div class="flex min-h-19 items-center gap-2 border-b border-base-300 px-5">
            <a
              routerLink="/admin"
              class="flex min-w-0 flex-1 items-center gap-3 rounded-field"
              (click)="closeNavigation()"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-field border border-base-300 bg-base-200 text-primary"
                aria-hidden="true"
              >
                <app-icon name="settings" />
              </span>
              <span class="min-w-0">
                <strong class="block text-sm font-bold tracking-wide">FERRETERÍA</strong>
                <span class="mt-0.5 block text-xs text-base-content/70">Control operacional</span>
              </span>
            </a>
            <button
              type="button"
              class="btn btn-ghost btn-square size-11 shrink-0 lg:hidden"
              aria-label="Cerrar navegación"
              (click)="closeNavigation()"
            >
              <app-icon name="close" [size]="18.4" />
            </button>
          </div>

          <nav
            class="admin-menu flex flex-1 flex-col justify-start px-3 py-6"
            aria-label="Navegación principal"
          >
            <ul class="menu menu-md w-full gap-1 p-0">
              @for (group of navigationGroups; track group.label) {
                <li
                  class="menu-title mt-5 mb-2 px-3 text-[0.67rem] font-bold tracking-widest text-base-content/70 first:mt-0"
                >
                  <span>{{ group.label }}</span>
                </li>
                @for (item of group.items; track item.url) {
                  <li>
                    <a
                      [routerLink]="item.url"
                      routerLinkActive="menu-active"
                      ariaCurrentWhenActive="page"
                      [routerLinkActiveOptions]="{ exact: false }"
                      class="flex min-h-12 items-center gap-3 rounded-field px-3 text-sm font-medium"
                      (click)="closeNavigation()"
                    >
                      <app-icon [name]="item.icon" />
                      <span class="min-w-0 flex-1">{{ item.label }}</span>
                      <app-icon name="chevron-right" [size]="16" class="navigation-arrow" />
                    </a>
                  </li>
                }
              }
            </ul>
          </nav>

          <div
            class="flex items-center gap-2.5 border-t border-base-300 px-6 py-5 text-xs text-base-content/70"
          >
            <span class="status status-success status-sm shrink-0" aria-hidden="true"></span>
            Sistema operativo
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: `
    .admin-workspace {
      background: var(--admin-canvas);
    }

    .admin-sidebar {
      color-scheme: dark;
      --color-base-100: var(--admin-nav-surface);
      --color-base-200: var(--admin-nav-raised);
      --color-base-300: var(--admin-nav-border);
      --color-base-content: var(--admin-nav-content);
      --color-primary: var(--admin-nav-accent);
      --color-primary-content: var(--admin-nav-accent-content);
    }

    a:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .admin-menu a {
      color: color-mix(in oklab, var(--color-base-content) 88%, transparent);
    }

    .admin-menu a:hover {
      background: var(--color-base-200);
      color: var(--color-base-content);
    }

    .admin-menu a.menu-active {
      background: var(--color-primary);
      color: var(--color-primary-content);
      font-weight: 600;
    }

    .navigation-arrow {
      visibility: hidden;
    }

    .menu-active .navigation-arrow {
      visibility: visible;
    }
  `,
  host: { class: 'block' },
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(AuthSessionService);
  private readonly profile = inject(AuthProfileService);
  private readonly systemMenu = inject(SystemMenuService);
  private readonly queryClient = inject(QueryClient);
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly header = viewChild(AdminHeader);

  authStore = inject(AuthStore);

  readonly userName = computed(() => {
    const perfil = this.authStore.authPerfil();
    return (
      [perfil?.person?.firstName, perfil?.person?.lastName].filter(Boolean).join(' ').trim() ||
      perfil?.nickName ||
      'Mi cuenta'
    );
  });

  readonly navigationOpen = signal(false);

  get navigationGroups(): readonly SystemMenuGroup[] {
    const systemCode = this.route.snapshot.data['systemCode'];
    return typeof systemCode === 'string' ? this.systemMenu.menuFor(systemCode) : [];
  }

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeNavigation());
  }

  closeNavigation(): void {
    if (!this.navigationOpen()) return;

    this.navigationOpen.set(false);
    this.header()?.focusMenuTrigger();
  }

  logout(): void {
    this.confirmation
      .confirm({
        title: '¿Cerrar sesión?',
        message: 'Tendrás que iniciar sesión nuevamente para volver a ingresar.',
        confirmText: 'Cerrar sesión',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.session.clear();
        this.profile.clear();
        this.queryClient.clear();

        void this.router.navigate(['/auth/login']);
      });
  }
}
