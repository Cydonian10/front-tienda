import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { debounceTime, startWith, Subject, switchMap } from 'rxjs';
import { combineLatest } from 'rxjs';
import { toast } from 'ngx-sonner';
import { CategoriesService } from '../../../../core/api/categories.service';
import { Category } from '../../../../core/models/category.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../shared/icon/icon';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { openCategoryDialog } from '../dialogs/category-dialog';

@Component({
  selector: 'categories-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon],
  templateUrl: './categories.page.html',
})
export default class CategoriesPage {
  private readonly dialog = inject(Dialog);
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

  protected readonly categories = signal<PaginatedResult<Category> | null>(null);

  protected readonly total = computed(() => this.categories()?.total ?? 0);
  protected readonly lastPage = computed(() => this.categories()?.lastPage ?? 0);

  constructor() {
    this.filter$.subscribe((result) => this.categories.set(result));
  }

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onCreate(): void {
    const dialogRef = openCategoryDialog(this.dialog);
    dialogRef.closed.subscribe((category) => {
      if (category) {
        this.categories.update((result) =>
          result
            ? { ...result, data: [category, ...result.data], total: result.total + 1 }
            : result,
        );
        toast.success('Categoría creada correctamente');
      }
    });
  }

  protected onEdit(category: Category): void {
    const dialogRef = openCategoryDialog(this.dialog, category);
    dialogRef.closed.subscribe((updated) => {
      if (updated) {
        this.categories.update((result) =>
          result
            ? {
                ...result,
                data: result.data.map((item) => (item.id === updated.id ? updated : item)),
              }
            : result,
        );
        toast.success('Categoría actualizada correctamente');
      }
    });
  }

  protected onDelete(category: Category): void {
    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar categoría',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    dialogRef.closed.subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.categoryService.remove(category.id).subscribe({
        next: () => {
          this.categories.update((result) =>
            result
              ? {
                  ...result,
                  data: result.data.filter((item) => item.id !== category.id),
                  total: Math.max(0, result.total - 1),
                }
              : result,
          );
          toast.success('Categoría eliminada correctamente');
        },
        error: (err) => toast.error(this.getErrorMessage(err)),
      });
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) {
        return body.message.join(', ');
      }
      if (body?.message) {
        return body.message;
      }
      return error.message;
    }
    return 'Error inesperado';
  }
}
