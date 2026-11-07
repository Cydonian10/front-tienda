import { DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, Component, computed, inject, Injector, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CajaApi } from '../../../../../api/ventas/caja/caja-api';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { AuthStore } from '../../../../../store/auth/auth.store';
import { cajasQueryKey } from '../../../../actions/use-cajas-action';
import { RegistrarMovimientoCajaAction } from '../../../../actions/use-movimientos-caja-action';
import { PERMISSION_CODES } from '../../../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../../../auth/services/use-permissions';
import { ToastService } from '../../../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-registrar-movimiento-dialog',
  imports: [DialogShell],
  templateUrl: './registrar-movimiento-dialog.html',
  host: { class: 'block min-w-0' },
})
export class RegistrarMovimientoDialog {
  readonly dialogRef = inject(DialogRef);
  private readonly injector = inject(Injector);
  private readonly api = inject(CajaApi);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  readonly registro = inject(RegistrarMovimientoCajaAction);
  readonly permissions = usePermissions('VENTAS', {
    crear: PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE,
  });
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly fieldId = `${this.dialogRef.id}-field`;
  readonly paso = signal<1 | 2>(1);
  readonly cajaId = signal('');
  readonly tipo = signal('');
  readonly monto = signal('');
  readonly motivo = signal('');
  readonly montoTocado = signal(false);
  readonly motivoTocado = signal(false);
  readonly usuario = computed(() => this.auth.authPerfil()?.nickName || 'Usuario no disponible');
  readonly cajasQuery = injectQuery(() => ({
    queryKey: cajasQueryKey({ estado: 'todas' }),
    queryFn: () => this.api.list({ estado: 'todas' }),
    retry: false,
    staleTime: 0,
  }));
  readonly cajasAbiertas = computed(() =>
    (this.cajasQuery.data() ?? []).flatMap((caja) => {
      const turno = caja.turnos.find((item) => item.fechaCierre === null);
      if (!turno) return [];
      const turnosDelDia = caja.turnos
        .filter((item) => item.fechaOperativa === turno.fechaOperativa)
        .sort(
          (a, b) =>
            Date.parse(a.fechaApertura) - Date.parse(b.fechaApertura) || a.id.localeCompare(b.id),
        );
      const numero = String(turnosDelDia.findIndex((item) => item.id === turno.id) + 1).padStart(
        2,
        '0',
      );
      return [{ caja, turno, numero }];
    }),
  );
  readonly seleccion = computed(() =>
    this.cajasAbiertas().find(({ caja }) => caja.id === this.cajaId()),
  );
  readonly montoValido = computed(() => {
    const monto = this.monto().trim();
    return /^\d{1,16}(\.\d{1,2})?$/.test(monto) && /[1-9]/.test(monto);
  });
  readonly motivoValido = computed(
    () => this.motivo().trim().length > 0 && this.motivo().trim().length <= 500,
  );
  readonly puedeRegistrar = computed(
    () =>
      !!this.seleccion() &&
      this.permissions.crear() &&
      !this.registro.bloqueado() &&
      (this.tipo() === 'ingreso' || this.tipo() === 'egreso') &&
      this.montoValido() &&
      this.motivoValido(),
  );

  async registrar(): Promise<void> {
    const seleccion = this.seleccion();
    const tipo = this.tipo();
    if (!this.puedeRegistrar() || !seleccion || (tipo !== 'ingreso' && tipo !== 'egreso')) return;
    this.dialogRef.disableClose = true;
    try {
      const registrado = await this.registro.registrar(
        {
          turnoId: seleccion.turno.id,
          tipo,
          importe: this.monto().trim(),
          motivo: this.motivo().trim(),
        },
        seleccion.caja.id,
      );
      if (registrado) {
        this.toast.success('Movimiento registrado correctamente.');
        this.dialogRef.close();
      }
    } finally {
      this.dialogRef.disableClose = false;
    }
  }

  continuar(): void {
    if (!this.seleccion() || this.cajasQuery.isError() || this.cajasQuery.isPending()) return;
    this.paso.set(2);
    this.enfocar(`${this.fieldId}-tipo`);
  }

  volver(): void {
    this.paso.set(1);
    this.enfocar(`${this.fieldId}-caja`);
  }

  private enfocar(id: string): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
