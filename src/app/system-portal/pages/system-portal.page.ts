import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/components/icon/icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { AuthLogoutService } from '../../auth/services/auth-logout.service';
import { AuthStore } from '../../store/auth/auth.store';
import { useSystemsQuery } from '../actions/find-systems-action';
import { SystemMenuService } from '../services/control-access/system-menu.service';

@Component({
  selector: 'app-system-portal',
  imports: [EmptyState, FormsModule, Icon, RouterLink, Skeleton, ThemeToggle],
  templateUrl: './system-portal.page.html',
  host: { class: 'block min-h-dvh' },
})
export default class SystemPortalPage {
  readonly systemsQuery = useSystemsQuery();

  private readonly authStore = inject(AuthStore);
  private readonly logout = inject(AuthLogoutService);
  private readonly systemMenu = inject(SystemMenuService);

  readonly searchTerm = signal('');

  readonly userName = computed(() => {
    const profile = this.authStore.authPerfil();
    return (
      [profile?.person?.firstName, profile?.person?.lastName].filter(Boolean).join(' ').trim() ||
      profile?.nickName ||
      'Mi cuenta'
    );
  });

  readonly systems = computed(() =>
    [...(this.systemsQuery.data() ?? [])].sort((left, right) => left.order - right.order),
  );

  readonly filteredSystems = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('es');
    if (!term) return this.systems();

    return this.systems().filter((system) =>
      [system.name, system.description, system.code].some((value) =>
        value.toLocaleLowerCase('es').includes(term),
      ),
    );
  });

  routeFor(systemCode: string): string | null {
    return this.systemMenu.routeFor(systemCode);
  }

  iconFor(systemCode: string) {
    return this.systemMenu.iconFor(systemCode);
  }

  statusFor(system: { code: string; active: boolean }): string {
    if (!system.active) return 'Inactivo';
    return this.routeFor(system.code) ? 'Disponible' : 'Aún no disponible';
  }

  requestLogout(): void {
    this.logout.requestLogout();
  }
}
