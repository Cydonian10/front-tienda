import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { useAlmacenes } from '../../../inventario/actions/use-almacenes-action';
import { useCajas } from '../../actions/use-cajas-action';
import { PuntoVentaHeader } from './components/punto-venta-header/punto-venta-header';
import { PreparacionVenta } from './components/preparacion-venta/preparacion-venta';
import { PasosVenta } from './components/pasos-venta/pasos-venta';
import { VentasRecientes } from './components/ventas-recientes/ventas-recientes';
import { CarritoVentaService } from '../punto-venta/service/carrito-venta.service';
import { AuthStore } from '../../../store/auth/auth.store';

@Component({
  selector: 'app-preparacion-venta-page',
  imports: [PuntoVentaHeader, PreparacionVenta, PasosVenta, VentasRecientes],
  templateUrl: './preparacion-venta-page.html',
  host: { class: 'block' },
})
export default class PreparacionVentaPage implements OnDestroy {
  private readonly router = inject(Router);
  readonly preparacion = inject(PreparacionVentaService);
  private readonly carrito = inject(CarritoVentaService);
  private readonly auth = inject(AuthStore);
  private continuando = false;
  readonly almacen = signal(this.preparacion.recuperandoAlmacen() ?? '');
  readonly turno = signal('');
  readonly almacenesQuery = useAlmacenes({
    page: () => 1,
    limit: () => 100,
    nombre: () => '',
    activo: () => true,
  }).listQuery;
  readonly cajasQuery = useCajas(() => ({ estado: 'activas' })).listQuery;
  readonly turnos = computed(() =>
    (this.cajasQuery.data() ?? []).flatMap((caja) =>
      caja.turnos
        .filter(
          (turno) => turno.fechaCierre === null && turno.id !== this.preparacion.turnoAnterior() &&
            !!this.auth.authPerfil()?.id && turno.responsable.id === this.auth.authPerfil()?.id,
        )
        .map((turno) => ({
          id: turno.id,
          nombre: `${caja.nombre} · ${turno.responsable.nickName}`,
        })),
    ),
  );

  constructor() {
    if (this.preparacion.recuperandoAlmacen()) void this.cajasQuery.refetch();
  }

  continuar(): void {
    const almacenId = this.almacen();
    const turnoId = this.turno();
    if (
      this.almacenesQuery.isError() ||
      this.cajasQuery.isError() ||
      (!!this.preparacion.recuperandoAlmacen() && this.cajasQuery.isFetching()) ||
      (!!this.preparacion.recuperandoAlmacen() &&
        almacenId !== this.preparacion.recuperandoAlmacen()) ||
      !this.almacenesQuery.data()?.data.some((item) => item.id === almacenId) ||
      !this.turnos().some((item) => item.id === turnoId)
    )
      return;
    this.preparacion.seleccionar({ almacenId, turnoId });
    this.continuando = true;
    void this.router.navigate(['/admin/ventas/punto-venta']).then((navego) => {
      if (!navego) this.continuando = false;
    });
  }

  ngOnDestroy(): void {
    if (this.preparacion.recuperandoAlmacen() && !this.continuando) {
      this.carrito.vaciar();
      this.preparacion.finalizarRecuperacion();
    }
  }
}
