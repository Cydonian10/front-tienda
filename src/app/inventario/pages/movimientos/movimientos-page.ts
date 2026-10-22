import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type {
  NuevoMovimiento,
  TipoMovimiento,
} from '../../../api/interfaces/inventario/movimiento.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { usePermissions } from '../../../auth/services/use-permissions';
import { useAlmacenesMovimiento, useCrearMovimiento } from '../../actions/use-movimientos-action';
import { Icon } from '../../../shared/components/icon/icon';
import { DatosMovimiento } from './components/datos-movimiento';
import { DetalleMovimiento } from './components/detalle-movimiento';
import { FilaMovimiento, nuevaFilaMovimiento } from './movimiento-form.model';

const WRITE_PERMISSIONS = {
  salida: PERMISSION_CODES.SALIDAS_CREATE,
  traslado: PERMISSION_CODES.TRASLADOS_CREATE,
  ajuste: PERMISSION_CODES.AJUSTES_CREATE,
} as const;
const DECIMAL = /^(0|[1-9]\d{0,13})(?:\.\d{1,6})?$/;
const SIGNED_DECIMAL = /^-?(0|[1-9]\d{0,13})(?:\.\d{1,6})?$/;
const ZERO = /^-?0(?:\.0+)?$/;

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
  private readonly authorization = inject(AuthorizationService);
  readonly tipo = inject(ActivatedRoute).snapshot.data['tipo'] as TipoMovimiento;
  readonly contenido = TITULOS[this.tipo];
  readonly permissions = usePermissions('INVENTARIO', {
    compras: PERMISSION_CODES.COMPRAS_READ,
    ...WRITE_PERMISSIONS,
  });
  readonly puedeRegistrar = computed(() => this.permissions[this.tipo]());
  readonly almacenes = useAlmacenesMovimiento();
  readonly registro = useCrearMovimiento();
  readonly detalles = viewChildren(DetalleMovimiento);
  readonly origen = signal('');
  readonly destino = signal('');
  readonly motivo = signal('');
  readonly filas = signal<FilaMovimiento[]>([nuevaFilaMovimiento(1)]);
  readonly error = signal('');
  readonly confirmacion = signal<string | null>(null);
  readonly pendiente = signal<NuevoMovimiento | null>(null);
  readonly enviando = signal(false);
  readonly bloqueado = computed(
    () => this.enviando() || this.registro.isPending() || this.pendiente() !== null,
  );
  readonly resumen = computed(
    () => this.filas().filter((fila) => fila.varianteId && fila.cantidad).length,
  );
  private siguienteId = 2;

  actualizarOrigen(valor: string): void {
    if (this.bloqueado()) return;
    this.origen.set(valor);
    this.filas.update((filas) => filas.map((fila) => ({ ...fila, varianteId: '', unidadId: '' })));
    this.limpiarAviso();
  }
  actualizarDestino(valor: string): void {
    if (this.bloqueado()) return;
    this.destino.set(valor);
    this.limpiarAviso();
  }
  actualizarMotivo(valor: string): void {
    if (this.bloqueado()) return;
    this.motivo.set(valor);
    this.limpiarAviso();
  }

  agregar(): void {
    if (this.bloqueado()) return;
    this.filas.update((filas) => [...filas, nuevaFilaMovimiento(this.siguienteId++)]);
    this.limpiarAviso();
  }

  actualizarFila(detalle: FilaMovimiento): void {
    if (this.bloqueado()) return;
    if (
      detalle.varianteId &&
      this.filas().some((fila) => fila.id !== detalle.id && fila.varianteId === detalle.varianteId)
    )
      return;
    this.filas.update((filas) => filas.map((fila) => (fila.id === detalle.id ? detalle : fila)));
    this.limpiarAviso();
  }

  quitarFila(id: number): void {
    if (this.bloqueado()) return;
    this.filas.update((filas) => filas.filter((fila) => fila.id !== id));
    this.limpiarAviso();
  }

  async confirmar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.bloqueado()) return;
    this.confirmacion.set(null);
    if (!this.authorization.hasPermission('INVENTARIO', WRITE_PERMISSIONS[this.tipo])) {
      this.error.set('No tienes permiso para registrar este tipo de movimiento.');
      return;
    }
    const error = this.validar();
    if (error) {
      this.error.set(error);
      return;
    }

    const movimiento: NuevoMovimiento = {
      idempotenciaClave: crypto.randomUUID(),
      tipo: this.tipo,
      almacenOrigenId: this.origen(),
      ...(this.tipo === 'traslado' ? { almacenDestinoId: this.destino() } : {}),
      ...(this.motivo().trim() ? { motivo: this.motivo().trim() } : {}),
      detalles: this.filas().map((fila) => ({
        varianteId: fila.varianteId,
        unidadId: fila.unidadId,
        cantidad: fila.cantidad.trim(),
        ...(this.tipo === 'ajuste' && !fila.cantidad.trim().startsWith('-')
          ? { costoUnitarioBase: fila.costoUnitarioBase.trim() }
          : {}),
      })),
    };
    await this.enviar(movimiento);
  }

  async reintentar(): Promise<void> {
    const movimiento = this.pendiente();
    if (!movimiento || this.enviando() || this.registro.isPending()) return;
    if (!this.authorization.hasPermission('INVENTARIO', WRITE_PERMISSIONS[this.tipo])) {
      this.error.set('No tienes permiso para reintentar este movimiento.');
      return;
    }
    await this.enviar(movimiento);
  }

  private async enviar(movimiento: NuevoMovimiento): Promise<void> {
    this.enviando.set(true);
    this.error.set('');
    this.confirmacion.set(null);
    try {
      const resultado = await this.registro.mutateAsync(movimiento);
      this.pendiente.set(null);
      this.confirmacion.set(resultado.id);
      this.filas.set([nuevaFilaMovimiento(this.siguienteId++)]);
      this.motivo.set('');
    } catch (error) {
      const rechazo =
        error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500;
      this.pendiente.set(rechazo ? null : movimiento);
      this.error.set(
        rechazo
          ? 'No se registró el movimiento. Revisa los datos y vuelve a intentarlo.'
          : 'No se pudo confirmar el resultado. Reintenta el mismo envío; no cambies sus datos.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  private validar(): string | null {
    const almacenes = this.almacenes.data();
    if (!almacenes || this.almacenes.isError() || this.almacenes.isFetching()) {
      return 'Espera a que se carguen los almacenes.';
    }
    if (!almacenes.some(({ id }) => id === this.origen())) return 'Selecciona un almacén válido.';
    if (
      this.tipo === 'traslado' &&
      (this.destino() === this.origen() || !almacenes.some(({ id }) => id === this.destino()))
    ) {
      return 'Elige un destino diferente del almacén de origen.';
    }
    if (this.tipo === 'ajuste' && !this.motivo().trim()) return 'Indica el motivo del ajuste.';
    if (this.motivo().trim().length > 300) return 'El motivo no puede superar 300 caracteres.';
    if (!this.filas().length) return 'Añade al menos una variante.';

    const seleccionadas = new Set<string>();
    for (const fila of this.filas()) {
      const detalle = this.detalles().find((item) => item.fila().id === fila.id);
      const variante = detalle?.variante();
      if (!variante || variante.variante.id !== fila.varianteId)
        return 'Selecciona una variante en cada fila.';
      if (seleccionadas.has(fila.varianteId)) return 'Una variante no puede repetirse.';
      seleccionadas.add(fila.varianteId);
      if (
        !SIGNED_DECIMAL.test(fila.cantidad.trim()) ||
        ZERO.test(fila.cantidad.trim()) ||
        (this.tipo !== 'ajuste' && fila.cantidad.trim().startsWith('-'))
      ) {
        return `Revisa la cantidad de ${variante.producto.nombre}.`;
      }
      if (!detalle?.unidad() || !detalle.base() || detalle.base() === '0') {
        return `Selecciona una unidad y una cantidad base válida para ${variante.producto.nombre}.`;
      }
      if (
        this.tipo !== 'salida' &&
        (!variante.producto.activo || !variante.variante.activo) &&
        (this.tipo === 'traslado' || !fila.cantidad.trim().startsWith('-'))
      ) {
        return `La variante inactiva ${variante.producto.nombre} solo admite salida o ajuste negativo.`;
      }
      if (
        this.tipo === 'ajuste' &&
        !fila.cantidad.trim().startsWith('-') &&
        !DECIMAL.test(fila.costoUnitarioBase.trim())
      ) {
        return `Indica el costo por unidad base de ${variante.producto.nombre}.`;
      }
    }
    return null;
  }

  private limpiarAviso(): void {
    this.error.set('');
    this.confirmacion.set(null);
  }
}
