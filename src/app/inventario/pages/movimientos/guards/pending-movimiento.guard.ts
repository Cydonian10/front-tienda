import type { CanDeactivateFn } from '@angular/router';
import type MovimientosPage from '../movimientos-page';

export const canLeaveMovimiento: CanDeactivateFn<MovimientosPage> = (page) => !page.bloqueado();
