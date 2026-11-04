import { Component, computed, signal } from '@angular/core';
import { useAlmacenes } from '../../../inventario/actions/use-almacenes-action';
import { useCajas } from '../../actions/use-cajas-action';
import { PuntoVentaHeader } from './components/punto-venta-header/punto-venta-header';
import { PreparacionVenta } from './components/preparacion-venta/preparacion-venta';
import { PasosVenta } from './components/pasos-venta/pasos-venta';
import { VentasRecientes } from './components/ventas-recientes/ventas-recientes';

@Component({
  selector: 'app-punto-venta-page',
  imports: [PuntoVentaHeader, PreparacionVenta, PasosVenta, VentasRecientes],
  templateUrl: './punto-venta-page.html',
  host: { class: 'block' },
})
export default class PuntoVentaPage {
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

}
