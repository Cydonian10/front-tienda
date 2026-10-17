import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { AtributoListado } from '../../../api/interfaces/inventario/atributo.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { useAtributos } from '../../actions/use-atributos-action';
import { AtributoFormDialog } from './components/atributo-form-dialog';

@Component({
  selector: 'app-atributos-page',
  imports: [EmptyState, Icon, Pagination],
  templateUrl: './atributos-page.html',
  host: { class: 'block min-w-0' },
})
export default class AtributosPage {
  private readonly dialog = inject(Dialog);
  private readonly confirmation = inject(ConfirmDialogService);
  readonly permissions = usePermissions('INVENTARIO', {
    create: PERMISSION_CODES.ATRIBUTOS_CREATE,
    edit: PERMISSION_CODES.ATRIBUTOS_UPDATE,
    delete: PERMISSION_CODES.ATRIBUTOS_DELETE,
  });
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  private readonly actions = useAtributos({
    page: this.page,
    limit: this.pageSize,
    nombre: this.search,
  });
  readonly query = this.actions.listQuery;
  readonly removeMutation = this.actions.removeMutation;
  readonly result = computed(() => this.query.data());
  readonly actionError = signal('');

  searchAttributes(value: string): void {
    this.page.set(1);
    this.search.set(value.trim().slice(0, 100));
  }

  clearSearch(): void {
    this.searchAttributes('');
  }

  changePageSize(size: number): void {
    this.page.set(1);
    this.pageSize.set(size);
  }

  openCreate(): void {
    if (this.permissions.create()) this.openForm('crear-atributo');
  }

  openEdit(atributo: AtributoListado): void {
    if (this.permissions.edit()) this.openForm(`editar-atributo-${atributo.id}`, atributo);
  }

  private openForm(id: string, atributo?: AtributoListado): void {
    this.dialog.open<string, AtributoListado | undefined, AtributoFormDialog>(AtributoFormDialog, {
      id,
      data: atributo,
      width: '36rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }

  async remove(atributo: AtributoListado): Promise<void> {
    if (!this.permissions.delete() || this.removeMutation.isPending()) return;
    const confirmed = await firstValueFrom(
      this.confirmation.confirm({
        title: 'Eliminar atributo',
        message: `¿Eliminar ${atributo.nombre}? Si está en uso por un producto o variante, no se podrá eliminar.`,
        confirmText: 'Eliminar atributo',
        tone: 'danger',
      }),
    );
    if (!confirmed || this.removeMutation.isPending()) return;
    this.actionError.set('');
    try {
      await this.removeMutation.mutateAsync(atributo.id);
      const lastPage = Math.max(1, this.result()?.meta.totalPages ?? 1);
      if (this.page() > lastPage) this.page.set(lastPage);
    } catch (error) {
      this.actionError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? `No se puede eliminar ${atributo.nombre} porque está en uso por un producto o variante.`
          : `No se pudo eliminar ${atributo.nombre}. Inténtalo de nuevo.`,
      );
    }
  }
}
