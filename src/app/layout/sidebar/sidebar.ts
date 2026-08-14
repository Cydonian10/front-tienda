import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/store/auth.store';
import { Icon, IconName } from '../../shared/icon/icon';

interface SidebarItem {
  label: string;
  icon: IconName;
  route?: string;
  expanded?: boolean;
  children?: SidebarItem[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, Icon],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block flex h-dvh',
  },
})
export class Sidebar {
  protected readonly sections: SidebarSection[] = [
    {
      title: 'Dashboards',
      items: [{ label: 'E-Commerce', icon: 'home' }],
    },
    {
      title: 'Apps',
      items: [
        {
          label: 'CMS',
          icon: 'chat-alt',
          expanded: true,
          children: [
            { label: 'Detail', icon: 'bars-3' },
            { label: 'Detail-2', icon: 'bars-3' },
            { label: 'List', icon: 'grid' },
            { label: 'Edit', icon: 'pencil' },
          ],
        },
        { label: 'Chat', icon: 'chat' },
        { label: 'Files', icon: 'folder' },
        { label: 'Mail', icon: 'mail' },
        { label: 'Task List', icon: 'clipboard-check' },
      ],
    },
    {
      title: 'UI Kit',
      items: [
        { label: 'Form Layout', icon: 'layout', route: '/ui-kit/form-layout' },
        { label: 'Input', icon: 'input' },
        { label: 'Button', icon: 'click' },
        { label: 'Table', icon: 'table' },
        { label: 'List', icon: 'queue-list' },
        { label: 'Tree', icon: 'tree' },
        { label: 'Panel', icon: 'panel' },
        { label: 'Overlay', icon: 'overlay' },
        { label: 'Media', icon: 'media' },
        { label: 'Menu', icon: 'menu' },
        { label: 'Message', icon: 'message' },
        { label: 'File', icon: 'file' },
        { label: 'Chart', icon: 'chart' },
        { label: 'Timeline', icon: 'timeline' },
      ],
    },
  ];

  title = 'front-scap';

  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

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
