import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { useAlmacenesMovimiento } from '../../actions/use-movimientos-action';
import { Icon } from '../../../shared/components/icon/icon';
import { DatosMovimiento } from './components/datos-movimiento';
import { DetalleMovimiento } from './components/detalle-movimiento';
import type { TipoMovimiento } from '../../../api/interfaces/inventario/movimiento.interface';
import { FilaMovimiento, nuevaFilaMovimiento } from './movimiento-form.model';

const TITULOS: Record<TipoMovimiento, { titulo: string; subtitulo: string; seccion: string }> = {
  salida: {
    titulo: 'Nueva salida',
    subtitulo: 'Registra productos que salen de un almacén.',
    seccion: 'Datos del movimiento',
  },
  traslado: {
    titulo: 'Nuevo traslado',
    subtitulo: 'Mueve stock entre dos almacenes sin cambiar el total.',
    seccion: 'Origen y destino',
  },
  ajuste: {
    titulo: 'Nuevo ajuste',
    subtitulo: 'Corrige una diferencia con cantidades positivas o negativas.',
    seccion: 'Almacén y motivo',
  },
};

@Component({
  selector: 'app-movimientos-page',
  imports: [RouterLink, RouterLinkActive, Icon, DatosMovimiento, DetalleMovimiento],
  templateUrl: './movimientos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export default class MovimientosPage {
  readonly tipo = inject(ActivatedRoute).snapshot.data['tipo'] as TipoMovimiento;
  readonly contenido = TITULOS[this.tipo];
  readonly permissions = usePermissions('INVENTARIO', { compras: PERMISSION_CODES.COMPRAS_READ });
  readonly almacenes = useAlmacenesMovimiento();
  readonly origen = signal('');
  readonly destino = signal('');
  readonly motivo = signal('');
  readonly filas = signal<FilaMovimiento[]>([nuevaFilaMovimiento(1)]);
  readonly error = signal('');
  readonly confirmacion = signal(false);
  readonly resumen = computed(
    () => this.filas().filter((fila) => fila.varianteId && fila.cantidad).length,
  );
  private siguienteId = 2;

  actualizarOrigen(valor: string): void {
    this.origen.set(valor);
    this.filas.update((filas) => filas.map((fila) => ({ ...fila, varianteId: '', unidadId: '' })));
    this.limpiarAviso();
  }
  actualizarDestino(valor: string): void {
    this.destino.set(valor);
    this.limpiarAviso();
  }
  actualizarMotivo(valor: string): void {
    this.motivo.set(valor);
    this.limpiarAviso();
  }

  agregar(): void {
    this.filas.update((filas) => [...filas, nuevaFilaMovimiento(this.siguienteId++)]);
    this.limpiarAviso();
  }

  actualizarFila(detalle: FilaMovimiento): void {
    if (detalle.varianteId && this.filas().some((fila) => fila.id !== detalle.id && fila.varianteId === detalle.varianteId)) return;
    this.filas.update((filas) => filas.map((fila) => (fila.id === detalle.id ? detalle : fila)));
    this.limpiarAviso();
  }

  quitarFila(id: number): void {
    this.filas.update((filas) => filas.filter((fila) => fila.id !== id));
    this.limpiarAviso();
  }

  confirmar(event: Event): void {
    event.preventDefault();
    this.error.set('El registro de movimientos todavía no está disponible.');
    this.confirmacion.set(false);
  }

  private limpiarAviso(): void {
    this.error.set('');
    this.confirmacion.set(false);
  }
}
