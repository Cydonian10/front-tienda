import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { useAlmacenesMovimiento } from '../../actions/use-movimientos-action';
import { Icon } from '../../../shared/components/icon/icon';
import { DatosMovimiento } from './components/datos-movimiento';
import { DetalleMovimiento } from './components/detalle-movimiento';
import { DetalleDemo, TipoMovimiento, validarMovimiento } from './movimiento-demo.model';

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
  readonly filas = signal<DetalleDemo[]>([
    { id: 1, varianteId: '', cantidad: '', unidad: 'base', costo: '' },
  ]);
  readonly error = signal('');
  readonly confirmacion = signal(false);
  readonly resumen = computed(
    () => this.filas().filter((fila) => fila.varianteId && fila.cantidad).length,
  );
  private siguienteId = 2;

  actualizarOrigen(valor: string): void {
    this.origen.set(valor);
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
    this.filas.update((filas) => [
      ...filas,
      { id: this.siguienteId++, varianteId: '', cantidad: '', unidad: 'base', costo: '' },
    ]);
    this.limpiarAviso();
  }

  actualizarFila(detalle: DetalleDemo): void {
    this.filas.update((filas) => filas.map((fila) => (fila.id === detalle.id ? detalle : fila)));
    this.limpiarAviso();
  }

  quitarFila(id: number): void {
    this.filas.update((filas) => filas.filter((fila) => fila.id !== id));
    this.limpiarAviso();
  }

  confirmar(event: Event): void {
    event.preventDefault();
    const error = validarMovimiento(
      this.tipo,
      this.origen(),
      this.destino(),
      this.motivo(),
      this.filas(),
    );
    this.error.set(error ?? '');
    this.confirmacion.set(!error);
  }

  private limpiarAviso(): void {
    this.error.set('');
    this.confirmacion.set(false);
  }
}
