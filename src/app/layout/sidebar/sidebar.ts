import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { DashboardService } from '../../core/services/dashboard.service';
import { AuthStore } from '../../core/store/auth.store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block flex h-dvh',
  },
})
export class Sidebar {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly dashboardService = inject(DashboardService);

  protected readonly menu = this.dashboardService.menu;
  protected readonly toggleGroup = (id: string) => this.dashboardService.toggleGroup(id);

  protected readonly person = this.authStore.person;
  protected readonly user = this.authStore.user;

  protected readonly fullName = computed(() => {
    const person = this.authStore.person();
    return person ? `${person.firstName} ${person.lastName}` : '';
  });

  protected readonly initials = computed(() => {
    const parts = this.fullName().trim().split(' ');
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` || '?';
  });

  // ========== Servicio de iconos Font Awesome inyectado ==========
  // public iconService = inject(FontIconService);
  public openSidebar = signal(true);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer')
  searchContainer!: ElementRef<HTMLDivElement>;
  public searchOpen = signal(false);

  toggle() {
    this.openSidebar.update((v) => !v);
  }

  toggleSearch() {
    this.searchOpen.update((v) => !v);
    if (this.searchOpen()) {
      this.searchInput?.nativeElement.focus();
    }
  }

  protected async logout(): Promise<void> {
    this.authStore.logout();
    await this.router.navigate(['/auth/login']);
  }
}
