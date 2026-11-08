import { Component, computed, inject, signal } from '@angular/core';
import { ExistenciaApi } from '../../../api/inventario/existencia-api';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type {
  DisponibilidadExistencias,
  FiltroExistencias,
} from '../../../api/interfaces/inventario/existencia.interface';
import { decimalCompacto, formatearSoles } from '../../../shared/formatters/decimal';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { useAlmacenesExistencias, useExistencias } from '../../actions/use-existencias-action';

@Component({
  selector: 'app-reporte-variantes-page',
  imports: [Pagination],
  templateUrl: './reporte-variantes-page.html',
  host: { class: 'block min-w-0' },
})
export default class ReporteVariantesPage {
  private readonly api = inject(ExistenciaApi);
  private readonly authorization = inject(AuthorizationService);
  readonly exportando = signal(false);
  readonly errorPdf = signal(false);
  readonly almacenId = signal('todos');
  readonly disponibilidad = signal<DisponibilidadExistencias>('todas');
  readonly busqueda = signal('');
  readonly borrador = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly filtro = computed<FiltroExistencias>(() => ({
    almacenId: this.almacenId(),
    disponibilidad: this.disponibilidad(),
    q: this.busqueda(),
    page: this.page(),
    limit: this.pageSize(),
  }));
  readonly almacenes = useAlmacenesExistencias();
  readonly existencias = useExistencias(this.filtro);
  readonly totalPages = computed(() => Math.ceil((this.existencias.data()?.totalItems ?? 0) / this.pageSize()));
  readonly alcance = computed(() =>
    this.almacenId() === 'todos'
      ? 'Todos los almacenes activos'
      : (this.almacenes.data()?.find((item) => item.id === this.almacenId())?.nombre ??
        'Almacén seleccionado'),
  );
  readonly soles = formatearSoles;
  readonly decimal = decimalCompacto;

  async descargarPdf(): Promise<void> {
    if (
      this.exportando() ||
      !this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.EXISTENCIAS_READ)
    )
      return;
    this.exportando.set(true);
    this.errorPdf.set(false);
    try {
      const pdf = await this.api.reporteVariantesPdf(this.filtro());
      const url = URL.createObjectURL(pdf);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'reporte-variantes.pdf';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      this.errorPdf.set(true);
    } finally {
      this.exportando.set(false);
    }
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.busqueda.set(this.borrador().trim());
    this.page.set(1);
  }
  cambiarTamano(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
  seleccionarAlmacen(valor: string): void {
    this.almacenId.set(valor);
    this.page.set(1);
  }
  seleccionarDisponibilidad(valor: string): void {
    if (valor === 'todas' || valor === 'con_stock' || valor === 'sin_stock') {
      this.disponibilidad.set(valor);
      this.page.set(1);
    }
  }
}
