import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface BreadcrumbItem {
  label: string;
  url: string | null;
}

@Component({
  selector: 'ng-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="flex items-center gap-2 text-sm">
        @for (item of breadcrumbs(); track $index) {
          @if (item.url && !$last) {
            <li>
              <a
                [routerLink]="item.url"
                class="text-base-content transition-colors hover:text-primary"
              >
                {{ item.label }}
              </a>
            </li>
            <li aria-hidden="true" class="text-base-content/40">/</li>
          } @else {
            <li aria-current="page" class="font-medium text-primary">
              {{ item.label }}
            </li>
          }
        }
      </ol>
    </nav>
  `,
})
export default class BreadcrumbsNg {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.buildBreadcrumbs();
    this.router.events.subscribe(() => {
      this.buildBreadcrumbs();
    });
  }

  private buildBreadcrumbs(): void {
    const items: BreadcrumbItem[] = [];
    let segments: string[] = [];

    for (const route of this.route.snapshot.pathFromRoot) {
      const label = route.data['breadcrumb'];
      if (label) {
        segments.push(...route.url.map((segment) => segment.path));
        const url = segments.length ? '/' + segments.join('/') : '/';
        items.push({ label, url });
      }
    }

    if (items.length) {
      items[items.length - 1] = { ...items[items.length - 1], url: null };
    }

    this.breadcrumbs.set(items);
  }
}
