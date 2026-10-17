import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { Almacen } from '../../../api/interfaces/inventario/almacen.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { useAlmacenes } from '../../actions/use-almacenes-action';
import { AlmacenFormDialog } from './components/almacen-form-dialog';

@Component({
  selector: 'app-almacenes-page',
  imports: [EmptyState, Icon, Pagination],
  templateUrl: './almacenes-page.html',
  host: { class: 'block min-w-0' },
})
export default class AlmacenesPage {
  private readonly dialog = inject(Dialog);
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly authorization = inject(AuthorizationService);
  readonly canCreate = this.authorization.hasPermission(
    'INVENTARIO',
    PERMISSION_CODES.ALMACENES_CREATE,
  );
  readonly canEdit = this.authorization.hasPermission(
    'INVENTARIO',
    PERMISSION_CODES.ALMACENES_UPDATE,
  );
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly searchDraft = signal('');
  readonly status = signal<'todos' | 'activos' | 'inactivos'>('todos');
  readonly activo = computed(() =>
    this.status() === 'todos' ? undefined : this.status() === 'activos',
  );
  private readonly actions = useAlmacenes({
    page: this.page,
    limit: this.pageSize,
    nombre: this.search,
    activo: this.activo,
  });
  readonly query = this.actions.listQuery;
  readonly updateMutation = this.actions.updateMutation;
  readonly result = computed(() => this.query.data());
  readonly actionError = signal('');

  searchWarehouses(event: Event): void {
    event.preventDefault();
    this.page.set(1);
    this.search.set(this.searchDraft().trim().slice(0, 150));
  }

  clearFilters(): void {
    this.searchDraft.set('');
    this.search.set('');
    this.status.set('todos');
    this.page.set(1);
  }

  changeStatus(value: string): void {
    this.page.set(1);
    this.status.set(value as 'todos' | 'activos' | 'inactivos');
  }

  changePageSize(size: number): void {
    this.page.set(1);
    this.pageSize.set(size);
  }

  openCreate(): void {
    if (this.canCreate) this.openForm('crear-almacen');
  }

  openEdit(almacen: Almacen): void {
    if (this.canEdit) this.openForm(`editar-almacen-${almacen.id}`, almacen);
  }

  private openForm(id: string, almacen?: Almacen): void {
    this.dialog.open<string, Almacen | undefined, AlmacenFormDialog>(AlmacenFormDialog, {
      id,
      data: almacen,
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }

  async toggleStatus(almacen: Almacen): Promise<void> {
    if (!this.canEdit || this.updateMutation.isPending()) return;
    if (almacen.activo) {
      const confirmed = await firstValueFrom(
        this.confirmation.confirm({
          title: 'Desactivar almacén',
          message: `¿Desactivar ${almacen.nombre}? Se conservarán sus existencias e historial, pero no debería usarse en nuevos movimientos.`,
          confirmText: 'Desactivar almacén',
          tone: 'danger',
        }),
      );
      if (!confirmed) return;
    }
    this.actionError.set('');
    try {
      await this.updateMutation.mutateAsync({ id: almacen.id, dto: { activo: !almacen.activo } });
      if (this.status() !== 'todos' && this.result()?.data.length === 1 && this.page() > 1) {
        this.page.update((page) => page - 1);
      }
    } catch {
      this.actionError.set(
        `No se pudo ${almacen.activo ? 'desactivar' : 'activar'} ${almacen.nombre}. Inténtalo de nuevo.`,
      );
    }
  }
}
