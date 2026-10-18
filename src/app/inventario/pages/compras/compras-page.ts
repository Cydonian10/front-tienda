import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { usePermissions } from '../../../auth/services/use-permissions';

@Component({
  selector: 'app-compras-page',
  templateUrl: './compras-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComprasPage {
  private readonly authorization = inject(AuthorizationService);
  readonly permissions = usePermissions('INVENTARIO', { create: PERMISSION_CODES.COMPRAS_CREATE });
  readonly showCreate = signal(false);

  openCreate(): void {
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_CREATE)) return;
    this.showCreate.set(true);
  }
}
