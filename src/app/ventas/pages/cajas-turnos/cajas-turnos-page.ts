import { Dialog } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { CajasTurnosHeader } from './components/cajas-turnos-header/cajas-turnos-header';
import { CajasTurnosResumen } from './components/cajas-turnos-resumen/cajas-turnos-resumen';
import { CrearCajaDialog } from './components/crear-caja-dialog/crear-caja-dialog';

@Component({
  selector: 'app-cajas-turnos-page',
  imports: [CajasTurnosHeader, CajasTurnosResumen],
  templateUrl: './cajas-turnos-page.html',
  providers: [],
  host: { class: 'block' },
})
export default class CajasTurnosPage {
  private readonly dialog = inject(Dialog);

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
