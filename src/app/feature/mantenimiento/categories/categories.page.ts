import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, startWith, Subject, switchMap } from 'rxjs';
import { combineLatest } from 'rxjs';

import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../shared/pagination/pagination.ng';
import { Icon } from '../../../shared/icon/icon';
import { CategoriesService } from '../../../core/api/categories.service';
import { Category } from '../../../core/models/category.model';
import { PaginatedResult } from '../../../core/models/pagination.model';

@Component({
  selector: 'categories-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon],
  templateUrl: './categories.page.html',
})
export default class CategoriesPage {
  private readonly categoryService = inject(CategoriesService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  private readonly search$ = new Subject<string>();
  protected readonly search = toSignal(this.search$.pipe(startWith(''), debounceTime(300)), {
    initialValue: '',
  });

  private readonly filter$ = combineLatest({
    page: toObservable(this.page),
    pageSize: toObservable(this.pageSize),
    search: toObservable(this.search),
  }).pipe(
    debounceTime(100),
    switchMap(({ page, pageSize, search }) => {
      const trimmed = search.trim();
      return this.categoryService.findAll({
        page,
        limit: pageSize,
        ...(trimmed ? { search: trimmed } : {}),
      });
    }),
  );

  protected readonly categories = toSignal<PaginatedResult<Category> | null>(this.filter$, {
    initialValue: null,
  });

  protected readonly total = computed(() => this.categories()?.total ?? 0);
  protected readonly lastPage = computed(() => this.categories()?.lastPage ?? 0);

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onCreate(): void {}

  protected onEdit(category: Category): void {}

  protected onDelete(category: Category): void {}
}
