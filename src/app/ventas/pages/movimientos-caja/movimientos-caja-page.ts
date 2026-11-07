import { Dialog } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { RegistrarMovimientoDialog } from './components/registrar-movimiento-dialog/registrar-movimiento-dialog';

@Component({
  selector: 'app-movimientos-caja-page',
  templateUrl: './movimientos-caja-page.html',
  host: { class: 'block' },
})
export default class MovimientosCajaPage {
  private readonly dialog = inject(Dialog);
  readonly permissions = usePermissions('VENTAS', {
    cajasTurnos: PERMISSION_CODES.CAJAS_TURNOS_READ,
  });

  abrirRegistro(): void {
    if (!this.permissions.cajasTurnos()) return;
    const id = 'registrar-movimiento-caja';
    this.dialog.open(RegistrarMovimientoDialog, {
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
