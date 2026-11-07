import { DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, Component, computed, inject, Injector, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CajaApi } from '../../../../../api/ventas/caja/caja-api';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { AuthStore } from '../../../../../store/auth/auth.store';
import { cajasQueryKey } from '../../../../actions/use-cajas-action';

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
  readonly motivoValido = computed(() => this.motivo().trim().length > 0);

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
