import { Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  templateUrl: './pagination.html',
  host: { class: 'block' },
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 20]);
  readonly disabled = input(false);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly items = computed<PageItem[]>(() => {
    const total = this.totalPages();
    if (total < 1) return [];
    const current = Math.min(Math.max(this.page(), 1), total);
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const visible = [...pages]
      .filter((value) => value >= 1 && value <= total)
      .sort((a, b) => a - b);
    const items: PageItem[] = [];
    visible.forEach((value, index) => {
      const previous = visible[index - 1];
      if (previous !== undefined && value - previous === 2) items.push(previous + 1);
      if (previous !== undefined && value - previous > 2) {
        items.push(index === 1 ? 'ellipsis-start' : 'ellipsis-end');
      }
      items.push(value);
    });
    return items;
  });

  select(page: number): void {
    if (this.disabled() || page < 1 || page > this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }

  selectPageSize(event: Event): void {
    if (this.disabled()) return;
    const size = Number((event.target as HTMLSelectElement).value);
    if (size !== this.pageSize() && this.pageSizeOptions().includes(size)) {
      this.pageSizeChange.emit(size);
    }
  }
}
