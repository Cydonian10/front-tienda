import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth/auth.store';
import { useAlmacenSeleccionado } from '../../actions/use-almacen-seleccionado-action';
import { useCajas } from '../../actions/use-cajas-action';
import { PreparacionVentaService } from '../../services/preparacion-venta.service';
import { PuntoVentaCabecera } from './components/punto-venta-cabecera/punto-venta-cabecera';

@Component({
  selector: 'app-punto-venta-page',
  imports: [PuntoVentaCabecera, RouterLink],
  templateUrl: './punto-venta-page.html',
})
export default class PuntoVentaPage {
  private readonly preparacion = inject(PreparacionVentaService);
  private readonly authStore = inject(AuthStore);

  readonly seleccion = this.preparacion.seleccion;
  readonly vistaMovil = signal<'productos' | 'venta'>('productos');
  readonly almacenQuery = useAlmacenSeleccionado(() => this.seleccion()?.almacenId ?? '');
  readonly cajasQuery = useCajas(() => ({ estado: 'activas' })).listQuery;

  readonly responsable = computed(() => {
    const perfil = this.authStore.authPerfil();
    return (
      [perfil?.person?.firstName, perfil?.person?.lastName].filter(Boolean).join(' ').trim() ||
      perfil?.nickName ||
      'Usuario no disponible'
    );
  });

  readonly turnoSeleccionado = computed(() => {
    const turnoId = this.seleccion()?.turnoId;
    for (const caja of this.cajasQuery.data() ?? []) {
      const turno = caja.turnos.find((item) => item.id === turnoId);
      if (!turno || turno.fechaCierre !== null) continue;
      const turnosDelDia = caja.turnos.filter(
        (item) => item.fechaOperativa === turno.fechaOperativa,
      );
      const numero = turnosDelDia.findIndex((item) => item.id === turno.id) + 1;
      return { caja: caja.nombre, numero: String(numero).padStart(2, '0') };
    }
    return null;
  });

  reintentar(): void {
    if (this.almacenQuery.isError()) void this.almacenQuery.refetch();
    if (this.cajasQuery.isError()) void this.cajasQuery.refetch();
  }
}
