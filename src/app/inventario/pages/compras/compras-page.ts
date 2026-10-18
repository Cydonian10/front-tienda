import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { CompraListadoResponse } from '../../../api/interfaces/inventario/compra.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { usePermissions } from '../../../auth/services/use-permissions';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { useComprasListado } from '../../actions/use-compras-action';

/** Muestra el total persistido sin recalcularlo con coma flotante. */
export function formatTotalPEN(value: string | null): string {
  if (value === null) return '—';
  const [whole, fraction = ''] = value.split('.');
  const decimals = fraction.replace(/0+$/, '').padEnd(2, '0');
  return `S/ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimals}`;
}

export function documentoCompra(compra: CompraListadoResponse): string {
  const tipo = compra.tipoDocumento
    ? compra.tipoDocumento[0].toUpperCase() + compra.tipoDocumento.slice(1)
    : 'Documento';
  const numero = [compra.serieDocumento, compra.numeroDocumento].filter(Boolean).join('-');
  return numero ? `${tipo} ${numero}` : `${tipo} sin número`;
}

@Component({
  selector: 'app-compras-page',
  imports: [EmptyState, Pagination],
  templateUrl: './compras-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export default class ComprasPage {
  private readonly authorization = inject(AuthorizationService);
  readonly permissions = usePermissions('INVENTARIO', { create: PERMISSION_CODES.COMPRAS_CREATE });
  readonly showCreate = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly searchDraft = signal('');
  readonly query = useComprasListado(this.page, this.pageSize, this.search);
  readonly formatTotal = formatTotalPEN;
  readonly documento = documentoCompra;

  searchCompras(event: Event): void {
    event.preventDefault();
    this.page.set(1);
    this.search.set(this.searchDraft().trim().slice(0, 200));
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
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_CREATE)) return;
    this.showCreate.set(true);
  }
}
