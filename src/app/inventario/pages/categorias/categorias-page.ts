import { Component, computed, HostListener, inject, signal, viewChild } from '@angular/core';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { Categoria } from '../../../api/interfaces/inventario/categoria.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { firstValueFrom, of } from 'rxjs';
import { useCategoriasApi, useCategoriasListado } from '../../actions/use-categorias-action';
import { CategoriaForm } from './components/categoria-form';

@Component({
  selector: 'categorias-page',
  imports: [CategoriaForm],
  templateUrl: './categorias-page.html',
  host: { class: 'block min-w-0' },
})
export default class CategoriasPage {
  private readonly confirmation = inject(ConfirmDialogService);
  readonly access = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.PRODUCTS_UPDATE });
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly status = signal<'todos' | 'activos' | 'inactivos'>('todos');
  readonly activo = computed(() => this.status() === 'todos' ? undefined : this.status() === 'activos');
  readonly query = useCategoriasListado(this.search, this.activo, this.page, this.limit);
  private readonly actions = useCategoriasApi();
  readonly createMutation = this.actions.createMutation;
  readonly updateMutation = this.actions.updateMutation;
  readonly statusMutation = this.actions.statusMutation;
  readonly selection = signal<Categoria | 'new' | null>(null);
  readonly form = viewChild(CategoriaForm);
  readonly formError = signal('');
  readonly actionError = signal('');
  readonly saving = computed(() => this.createMutation.isPending() || this.updateMutation.isPending());
  readonly totalPages = computed(() => Math.max(1, Math.ceil((this.query.data()?.totalItems ?? 0) / this.limit())));

  searchCategories(value: string): void {
    this.page.set(1);
    this.search.set(value.trim().slice(0, 200));
  }

  changeStatus(value: string): void {
    if (value !== 'todos' && value !== 'activos' && value !== 'inactivos') return;
    this.page.set(1);
    this.status.set(value);
  }

  clearFilters(): void {
    this.page.set(1);
    this.search.set('');
    this.status.set('todos');
  }

  async openCreate(): Promise<void> {
    if (!this.access.edit() || this.saving()) return;
    await this.open('new');
  }

  async openEdit(category: Categoria): Promise<void> {
    if (!this.access.edit() || this.saving()) return;
    await this.open(category);
  }

  private async open(next: Categoria | 'new'): Promise<void> {
    if (!await this.confirmDiscard()) return;
    this.formError.set('');
    this.selection.set(next);
  }

  async closeForm(): Promise<void> {
    if (this.saving() || !await this.confirmDiscard()) return;
    this.selection.set(null);
    this.formError.set('');
  }

  private async confirmDiscard(): Promise<boolean> {
    if (!this.form()?.dirty()) return true;
    return firstValueFrom(this.confirmation.confirm({
      title: 'Descartar cambios de categoría',
      message: 'Tienes cambios sin guardar. ¿Quieres descartarlos?',
      confirmText: 'Descartar cambios',
      cancelText: 'Seguir editando',
      tone: 'danger',
    }));
  }

  canLeave() {
    if (this.saving()) return of(false);
    if (!this.form()?.dirty()) return of(true);
    return this.confirmation.confirm({
      title: 'Descartar cambios de categoría',
      message: 'Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?',
      confirmText: 'Descartar cambios',
      cancelText: 'Seguir editando',
      tone: 'danger',
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  confirmBrowserExit(event: BeforeUnloadEvent): void {
    if (this.form()?.dirty()) event.preventDefault();
  }

  async save(value: { nombre: string; descripcion: string | null }): Promise<void> {
    const category = this.selection();
    if (!this.access.edit() || !category || this.saving()) return;
    this.formError.set('');
    try {
      if (category === 'new') {
        await this.createMutation.mutateAsync(value);
      } else {
        await this.updateMutation.mutateAsync({ id: category.id, dto: value });
      }
      this.selection.set(null);
    } catch (error) {
      this.formError.set(this.message(error, 'No se pudo guardar la categoría. Inténtalo de nuevo.'));
    }
  }

  async toggleStatus(category: Categoria): Promise<void> {
    if (!this.access.edit() || this.statusMutation.isPending()) return;
    if (category.activo && !await firstValueFrom(this.confirmation.confirm({
      title: 'Desactivar categoría',
      message: `¿Desactivar ${category.nombre}? Los productos existentes conservarán su categoría.`,
      confirmText: 'Desactivar categoría',
      cancelText: 'Cancelar',
      tone: 'danger',
    }))) return;
    this.actionError.set('');
    try {
      await this.statusMutation.mutateAsync({ id: category.id, activo: !category.activo });
      if (this.status() !== 'todos' && this.query.data()?.items.length === 1 && this.page() > 1) {
        this.page.update((page) => page - 1);
      }
    } catch (error) {
      this.actionError.set(this.message(error, `No se pudo cambiar el estado de ${category.nombre}.`));
    }
  }

  private message(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const body = (error as { error?: { message?: unknown } }).error;
      if (typeof body?.message === 'string') return body.message;
      if (Array.isArray(body?.message)) return body.message.join('. ');
    }
    return fallback;
  }
}
