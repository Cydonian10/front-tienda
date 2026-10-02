import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AdminHeader } from './components/admin-header';
import { AdminFooterPage } from './components/admin-footer';

@Component({
  imports: [RouterOutlet, AdminHeader, AdminFooterPage, RouterLink, RouterLinkActive],
  selector: 'app-admin',
  template: `
    <div
      class="drawer min-h-dvh bg-base-100 text-base-content lg:drawer-open"
      data-theme="ferreteria"
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
        />

        <main
          id="admin-content"
          tabindex="-1"
          class="min-w-0 flex-1 bg-base-200/50 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
          aria-labelledby="admin-section-title"
        >
          <div class="mx-auto w-full max-w-7xl">
            <div class="mb-6 border-b border-base-300 pb-5 sm:mb-8 sm:pb-6">
              <h1
                id="admin-section-title"
                class="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl"
              >
                {{ currentSection().label }}
              </h1>
              <p class="mt-2 max-w-prose text-sm leading-relaxed text-base-content/70">
                Control de acceso del panel operativo.
              </p>
            </div>
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
          class="flex min-h-dvh w-66 max-w-[85vw] flex-col border-r border-base-300 bg-base-100"
        >
          <div class="flex min-h-19 items-center gap-2 border-b border-base-300 px-5">
            <a
              routerLink="/admin/roles"
              class="flex min-w-0 flex-1 items-center gap-3 rounded-field"
              (click)="closeNavigation()"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-field border border-base-300 bg-base-200 text-base-content"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" class="size-5">
                  <path
                    d="m12 3 2 2.5 3.2-.2.8 3.1 2.7 1.7-1.7 2.7.2 3.2-3.1.8-1.7 2.7-2.7-1.7-3.2.2-.8-3.1-2.7-1.7 1.7-2.7-.2-3.2 3.1-.8L12 3Z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
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
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav
            class="admin-menu flex flex-1 flex-col justify-start px-3 py-6"
            aria-label="Navegación principal"
          >
            <ul class="menu menu-md w-full gap-3 p-0">
              @for (group of navigationGroups; track group.label) {
                <li>
                  <details>
                    <summary
                      class="flex min-h-12 items-center gap-3 rounded-field bg-base-200 px-3 text-sm font-semibold text-base-content"
                    >
                      <svg viewBox="0 0 24 24" class="size-5 shrink-0" aria-hidden="true">
                        <path [attr.d]="group.icon" />
                      </svg>
                      <span class="flex-1">{{ group.label }}</span>
                    </summary>
                    <ul class="mt-2 gap-1">
                      @for (item of group.items; track item.url) {
                        <li>
                          <a
                            [routerLink]="item.url"
                            routerLinkActive="menu-active"
                            ariaCurrentWhenActive="page"
                            class="flex min-h-12 items-center gap-3 rounded-field px-3 text-sm font-medium"
                            (click)="closeNavigation()"
                          >
                            <svg viewBox="0 0 24 24" class="size-5 shrink-0" aria-hidden="true">
                              <path [attr.d]="item.icon" />
                            </svg>
                            <span class="flex-1">{{ item.label }}</span>
                            <svg
                              viewBox="0 0 24 24"
                              class="navigation-arrow size-4 shrink-0"
                              aria-hidden="true"
                            >
                              <path d="m9 6 6 6-6 6" />
                            </svg>
                          </a>
                        </li>
                      }
                    </ul>
                  </details>
                </li>
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
    a:focus-visible,
    summary:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .admin-menu a {
      color: color-mix(in oklab, var(--color-base-content) 80%, transparent);
    }

    .admin-menu a:hover {
      background: var(--color-base-200);
      color: var(--color-base-content);
    }

    .admin-menu a.menu-active {
      background: color-mix(in oklab, var(--color-primary) 12%, var(--color-base-100));
      color: var(--color-primary);
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
  private readonly header = viewChild(AdminHeader);
  private readonly currentPath = signal(this.router.url);

  readonly navigationOpen = signal(false);
  readonly navigationGroups = [
    {
      label: 'Accesos',
      icon: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM12 10v4M12 7v.01',
      items: [
        {
          label: 'Roles',
          url: '/admin/roles',
          icon: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM9 12l2 2 4-4',
        },
        {
          label: 'Usuarios',
          url: '/admin/usuarios',
          icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
        },
      ],
    },
  ] as const;

  private readonly navigationItems = this.navigationGroups.flatMap((group) => group.items);

  readonly currentSection = computed(
    () =>
      this.navigationItems.find((item) => this.currentPath().startsWith(item.url)) ??
      this.navigationItems[0],
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentPath.set(event.urlAfterRedirects);
        this.closeNavigation();
      });
  }

  closeNavigation(): void {
    if (!this.navigationOpen()) return;

    this.navigationOpen.set(false);
    this.header()?.focusMenuTrigger();
  }
}
