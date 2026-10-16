import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { UnidadMedida } from '../../../api/interfaces/inventario/unidad.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { useUnidadMedida } from '../../actions/use-unidad-medida-action';
import { UnidadFormDialog } from './components/unidad-form-dialog';

@Component({
  selector: 'app-unidades-page',
  imports: [EmptyState, Pagination],
  templateUrl: './unidades-page.html',
  host: { class: 'block min-w-0' },
})
export default class UnidadesPage {
  private readonly dialog = inject(Dialog);
  private readonly authorization = inject(AuthorizationService);
  private readonly confirmation = inject(ConfirmDialogService);
  readonly canCreate = this.authorization.hasPermission(
    'INVENTARIO',
    PERMISSION_CODES.UNIDADES_CREATE,
  );
  readonly canEdit = this.authorization.hasPermission(
    'INVENTARIO',
    PERMISSION_CODES.UNIDADES_UPDATE,
  );
  readonly canDelete = this.authorization.hasPermission(
    'INVENTARIO',
    PERMISSION_CODES.UNIDADES_DELETE,
  );
  readonly page = signal(1);
  readonly pageSize = signal(5);
  readonly search = signal('');
  readonly searchDraft = signal('');
  private readonly actions = useUnidadMedida({
    page: this.page,
    limit: this.pageSize,
    nombre: this.search,
  });
  readonly query = this.actions.listQuery;
  readonly removeMutation = this.actions.removeMutation;
  readonly result = computed(() => this.query.data());
  readonly actionError = signal('');

  searchUnits(event: Event): void {
    event.preventDefault();
    this.page.set(1);
    this.search.set(this.searchDraft().trim());
  }

  clearSearch(): void {
    this.searchDraft.set('');
    this.search.set('');
    this.page.set(1);
  }

  changePageSize(size: number): void {
    this.page.set(1);
    this.pageSize.set(size);
  }

  openCreate(): void {
    if (!this.canCreate) return;
    this.openForm('crear-unidad');
  }

  openEdit(unidad: UnidadMedida): void {
    if (!this.canEdit) return;
    this.openForm(`editar-unidad-${unidad.id}`, unidad);
  }

  private openForm(id: string, unidad?: UnidadMedida): void {
    this.dialog.open<string, UnidadMedida | undefined, UnidadFormDialog>(UnidadFormDialog, {
      id,
      data: unidad,
      width: '32rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }

  async remove(unidad: UnidadMedida): Promise<void> {
    if (!this.canDelete || this.removeMutation.isPending()) return;
    const confirmed = await firstValueFrom(
      this.confirmation.confirm({
        title: 'Eliminar unidad de medida',
        message: `¿Eliminar ${unidad.nombre}? Si está en uso por algún producto o movimiento, no se podrá eliminar.`,
        confirmText: 'Eliminar unidad',
        tone: 'danger',
      }),
    );
    if (!confirmed || this.removeMutation.isPending()) return;
    this.actionError.set('');
    try {
      await this.removeMutation.mutateAsync(unidad.id);
      const totalPages = Math.max(1, this.result()?.meta.totalPages ?? 1);
      if (this.page() > totalPages) this.page.set(totalPages);
    } catch (error) {
      this.actionError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? `No se puede eliminar ${unidad.nombre} porque está en uso por un producto o movimiento.`
          : `No se pudo eliminar ${unidad.nombre}. Inténtalo de nuevo.`,
      );
    }
  }
}
