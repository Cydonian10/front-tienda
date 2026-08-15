import { Component, input, model } from '@angular/core';

@Component({
  selector: 'ng-pagination',
  template: `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2 text-sm text-base-content/60">
        <span class="shrink-0">Mostrar</span>
        <select
          class="select select-sm w-20 shrink-0"
          [value]="pageSize()"
          (change)="onPageSizeChange($event)"
        >
          @for (size of pageSizes(); track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>

        @if (total() > 0) {
          <span class="shrink-0 whitespace-nowrap"> Total: {{ total() }} items</span>
        }
      </div>
      <div class="join">
        <button
          type="button"
          class="join-item btn"
          [disabled]="page() <= 1"
          (click)="previous()"
          aria-label="Página anterior"
        >
          «
        </button>
        <button type="button" class="join-item btn btn-active">Página {{ page() }}</button>
        <button
          type="button"
          class="join-item btn"
          [disabled]="page() >= lastPage()"
          (click)="next()"
          aria-label="Página siguiente"
        >
          »
        </button>
      </div>
    </div>
  `,
})
export default class PaginationNg {
  readonly page = model<number>(1);
  readonly pageSize = model<number>(10);
  readonly lastPage = input.required<number>();
  readonly total = input<number>(0);
  readonly pageSizes = input<number[]>([5, 10, 50]);

  protected previous(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  protected next(): void {
    if (this.page() < this.lastPage()) {
      this.page.set(this.page() + 1);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (size === this.pageSize()) {
      return;
    }
    this.pageSize.set(size);
    this.page.set(1);
  }
}
