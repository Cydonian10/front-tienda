import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminHeader } from './components/admin-header';
import { AdminFooterPage } from './components/admin-footer';

@Component({
  imports: [RouterOutlet, AdminHeader, AdminFooterPage, RouterLink, RouterLinkActive],
  selector: 'app-admin',
  template: `
    <div class="drawer min-h-dvh bg-base-100 lg:drawer-open" data-theme="ferreteria">
      <input id="admin-navigation" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content flex min-h-dvh flex-col">
        <app-admin-header
          menuControlId="admin-navigation"
          [userName]="'Administrador'"
          [userInitials]="'AD'"
        />

        <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <router-outlet />
        </main>
        <app-admin-footer />
      </div>

      <div class="drawer-side min-h-dvh">
        <label for="admin-navigation" aria-label="Cerrar navegación" class="drawer-overlay"></label>
        <aside class="flex min-h-dvh w-70 flex-col border-r border-base-300 bg-base-100">
          <a
            routerLink="/admin/roles"
            class="flex min-h-19 items-center gap-3 border-b border-base-300 px-5"
          >
            <span
              class="grid size-9 place-items-center rounded-field bg-primary/15 text-primary"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="m12 3 2 2.5 3.2-.2.8 3.1 2.7 1.7-1.7 2.7.2 3.2-3.1.8-1.7 2.7-2.7-1.7-3.2.2-.8-3.1-2.7-1.7 1.7-2.7-.2-3.2 3.1-.8L12 3Z"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span
              ><strong class="block text-xs tracking-widest">FERRETERÍA</strong
              ><small class="text-[0.65rem] text-base-content/50">Control operacional</small></span
            >
          </a>

          <nav
            class="flex flex-1 flex-col justify-start px-3 py-5"
            aria-label="Navegación principal"
          >
            <ul class="menu menu-sm w-full gap-1">
              <li class="menu-title">Principal</li>
              <li>
                <a
                  routerLink="/admin/roles"
                  routerLinkActive="menu-active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m4 11 8-7 8 7v9H4zM9 20v-6h6v6" /></svg
                  >Roles</a
                >
              </li>
            </ul>

            <ul class="menu menu-sm mt-5 w-full gap-1">
              <li class="menu-title">Acceso</li>
              <li>
                <a
                  routerLink="/admin/usuarios"
                  routerLinkActive="menu-active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16v14H4zM8 5v14M8 9h12" /></svg
                  >Usuarios</a
                >
              </li>
            </ul>
          </nav>

          <div
            class="flex items-center gap-2 border-t border-base-300 px-5 py-4 text-xs text-base-content/55"
          >
            <span class="status status-success"></span>Sistema operativo
          </div>
        </aside>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class AdminLayout {}
