import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { PERMISSION_CODES } from '../../../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../../../auth/services/use-permissions';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { apiMessage } from '../../../../../shared/interceptors/api-error.interceptor';
import { useCajaTurnos, useResumenTurno } from '../../../../actions/use-caja-turnos-action';

export function importeEnCentavos(importe: string, admiteNegativo = false): bigint | null {
  const patron = admiteNegativo ? /^-?\d{1,16}(\.\d{1,2})?$/ : /^\d{1,16}(\.\d{1,2})?$/;
  if (!patron.test(importe)) return null;
  const negativo = importe.startsWith('-');
  const [entero, decimal = ''] = (negativo ? importe.slice(1) : importe).split('.');
  const centavos = BigInt(entero) * 100n + BigInt(decimal.padEnd(2, '0'));
  return negativo ? -centavos : centavos;
}

export function diferenciaFormateada(centavos: bigint): string {
  const signo = centavos < 0n ? '−' : centavos > 0n ? '+' : '';
  const valor = centavos < 0n ? -centavos : centavos;
  return `${signo}S/ ${valor / 100n}.${(valor % 100n).toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-cerrar-turno-dialog',
  imports: [DialogShell],
  templateUrl: './cerrar-turno-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CerrarTurnoDialog {
  readonly data = inject<{ cajaId: string; nombre: string; turnoId: string }>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly efectivoContado = signal('');
  readonly observacionCierre = signal('');
  readonly contadoTocado = signal(false);
  readonly procesando = signal(false);
  readonly aviso = signal('');
  readonly errorCierre = signal('');
  readonly cerradoPorOtroUsuario = signal(false);
  readonly resumenQuery = useResumenTurno(() => this.data.cajaId, () => this.data.turnoId);
  readonly cerrarMutation = useCajaTurnos().cerrarMutation;
  readonly permissions = usePermissions('VENTAS', { cajasTurnos: PERMISSION_CODES.CAJAS_TURNOS_READ });
  readonly contadoCentavos = computed(() => importeEnCentavos(this.efectivoContado().trim()));
  readonly contadoInvalido = computed(() =>
    this.contadoCentavos() === null && (this.contadoTocado() || this.efectivoContado().length > 0),
  );
  readonly observacionInvalida = computed(() => this.observacionCierre().length > 500);
  readonly formularioValido = computed(() => this.contadoCentavos() !== null && !this.observacionInvalida());
  readonly diferencia = computed(() => {
    const contado = this.contadoCentavos();
    const esperado = this.resumenQuery.data()?.efectivoEsperado;
    const esperadoCentavos = esperado === undefined ? null : importeEnCentavos(esperado, true);
    return contado === null || esperadoCentavos === null ? null : contado - esperadoCentavos;
  });
  readonly diferenciaTexto = computed(() => {
    const diferencia = this.diferencia();
    return diferencia === null ? null : diferenciaFormateada(diferencia);
  });

  get turnoCerrado(): boolean {
    const error = this.resumenQuery.error();
    return this.cerradoPorOtroUsuario() || (error instanceof HttpErrorResponse && error.status === 409);
  }

  async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.contadoTocado.set(true);
    const resumen = this.resumenQuery.data();
    if (!this.permissions.cajasTurnos() || this.procesando() || this.resumenQuery.isFetching() || this.resumenQuery.isError() ||
      this.turnoCerrado || !resumen || !this.formularioValido()) return;
    const esperadoAnterior = importeEnCentavos(resumen.efectivoEsperado, true);
    if (esperadoAnterior === null) {
      this.errorCierre.set('El efectivo esperado recibido no es válido. Vuelve a consultar el resumen.');
      return;
    }

    this.procesando.set(true);
    this.dialogRef.disableClose = true;
    this.errorCierre.set('');
    this.aviso.set('');
    try {
      const actualizacion = await this.resumenQuery.refetch();
      if (actualizacion.isError || !actualizacion.data) return;
      const esperadoActual = importeEnCentavos(actualizacion.data.efectivoEsperado, true);
      if (esperadoActual === null) {
        this.errorCierre.set('El efectivo esperado recibido no es válido. Vuelve a consultar el resumen.');
        return;
      }
      if (esperadoActual !== esperadoAnterior) {
        this.aviso.set('El efectivo esperado cambió. Revisa el resumen actualizado y confirma nuevamente.');
        return;
      }
      if (!this.permissions.cajasTurnos()) return;
      const cierre = await this.cerrarMutation.mutateAsync({
        cajaId: this.data.cajaId,
        turnoId: this.data.turnoId,
        dto: {
          efectivoContado: this.efectivoContado().trim(),
          efectivoEsperadoConfirmado: actualizacion.data.efectivoEsperado,
          ...(this.observacionCierre() ? { observacionCierre: this.observacionCierre() } : {}),
        },
      });
      this.dialogRef.close(cierre);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409 && error.error?.code === 'EFECTIVO_ESPERADO_CAMBIO') {
        this.aviso.set('El efectivo esperado cambió durante el cierre. Revisa el resumen actualizado y confirma nuevamente.');
        await this.resumenQuery.refetch();
      } else if (error instanceof HttpErrorResponse && error.status === 409) {
        this.cerradoPorOtroUsuario.set(true);
      } else {
        this.errorCierre.set(error instanceof HttpErrorResponse ? apiMessage(error) : 'No se pudo cerrar el turno. Inténtalo de nuevo.');
      }
    } finally {
      this.dialogRef.disableClose = false;
      this.procesando.set(false);
    }
  }
}
