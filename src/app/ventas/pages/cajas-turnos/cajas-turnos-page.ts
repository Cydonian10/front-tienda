import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { useCajas } from '../../actions/use-cajas-action';
import { CajasFiltro } from './components/cajas-filtro/cajas-filtro';
import { CajaCard } from './components/caja-card/caja-card';
import { CajasTurnosHeader } from './components/cajas-turnos-header/cajas-turnos-header';
import { CajasTurnosResumen } from './components/cajas-turnos-resumen/cajas-turnos-resumen';
import { CrearCajaDialog } from './components/crear-caja-dialog/crear-caja-dialog';

@Component({
  selector: 'app-cajas-turnos-page',
  imports: [CajasTurnosHeader, CajasTurnosResumen, CajasFiltro, CajaCard],
  templateUrl: './cajas-turnos-page.html',
  providers: [],
  host: { class: 'block' },
})
export default class CajasTurnosPage {
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly filtro = computed(() => {
    const valor = this.params().get('turno');
    return valor === 'abiertas' || valor === 'cerradas' ? valor : 'todas';
  });

  readonly listQuery = useCajas().listQuery;

  readonly cajas = computed(() => {
    const cajas = this.listQuery.data() ?? [];
    const filtro = this.filtro();
    return cajas.filter((caja) => {
      const abierta = caja.turnos.some((turno) => turno.fechaCierre === null);
      return filtro === 'todas' || (filtro === 'abiertas' ? abierta : !abierta);
    });
  });

  abrirCrearCaja(): void {
    const id = 'crear-caja';
    this.dialog.open(CrearCajaDialog, {
      id,
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }
}
