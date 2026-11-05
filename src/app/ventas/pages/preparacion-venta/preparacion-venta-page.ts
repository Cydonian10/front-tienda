import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { useAlmacenes } from '../../../inventario/actions/use-almacenes-action';
import { useCajas } from '../../actions/use-cajas-action';
import { PuntoVentaHeader } from './components/punto-venta-header/punto-venta-header';
import { PreparacionVenta } from './components/preparacion-venta/preparacion-venta';
import { PasosVenta } from './components/pasos-venta/pasos-venta';
import { VentasRecientes } from './components/ventas-recientes/ventas-recientes';

@Component({
  selector: 'app-preparacion-venta-page',
  imports: [PuntoVentaHeader, PreparacionVenta, PasosVenta, VentasRecientes],
  templateUrl: './preparacion-venta-page.html',
  host: { class: 'block' },
})
export default class PreparacionVentaPage {
  private readonly router = inject(Router);
  private readonly preparacion = inject(PreparacionVentaService);
  readonly almacen = signal('');
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
        .filter((turno) => turno.fechaCierre === null)
        .map((turno) => ({
          id: turno.id,
          nombre: `${caja.nombre} · ${turno.usuarioApertura.nickName}`,
        })),
    ),
  );

  continuar(): void {
    const almacenId = this.almacen();
    const turnoId = this.turno();
    if (
      this.almacenesQuery.isError() ||
      this.cajasQuery.isError() ||
      !this.almacenesQuery.data()?.data.some((item) => item.id === almacenId) ||
      !this.turnos().some((item) => item.id === turnoId)
    )
      return;
    this.preparacion.seleccionar({ almacenId, turnoId });
    void this.router.navigate(['/admin/ventas/punto-venta']);
  }
}
