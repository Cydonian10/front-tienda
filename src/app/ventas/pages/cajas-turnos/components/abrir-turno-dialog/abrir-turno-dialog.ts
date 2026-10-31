import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import type { TurnoCaja } from '../../../../../api/interfaces/ventas/caja.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { apiMessage } from '../../../../../shared/interceptors/api-error.interceptor';
import { useCajaTurnos } from '../../../../actions/use-caja-turnos-action';

@Component({
  selector: 'app-abrir-turno-dialog',
  imports: [DialogShell],
  templateUrl: './abrir-turno-dialog.html',
  host: { class: 'block min-w-0' },
})
export class AbrirTurnoDialog {
  readonly data = inject<{ cajaId: string; nombre: string; turnos: TurnoCaja[] }>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly saldoInicial = signal('');
  readonly serverError = signal('');
  readonly abrirMutation = useCajaTurnos().abrirMutation;
  readonly fechaOperativa = signal(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()));
  readonly turnoAnterior = computed(() => this.data.turnos
    .filter((turno) => turno.fechaOperativa === this.fechaOperativa())
    .sort((a, b) => Date.parse(b.fechaApertura) - Date.parse(a.fechaApertura) || b.id.localeCompare(a.id))[0]);
  readonly faltaEfectivoContado = computed(() =>
    !!this.turnoAnterior() && this.turnoAnterior()?.efectivoContado === null,
  );

  async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    if (this.abrirMutation.isPending() || this.faltaEfectivoContado()) return;
    this.serverError.set('');
    const saldoInicial = this.saldoInicial().trim();
    if (!this.turnoAnterior() && !/^\d{1,16}(\.\d{1,2})?$/.test(saldoInicial)) {
      this.serverError.set('Ingresa un saldo válido con hasta dos decimales, por ejemplo 100.00.');
      return;
    }
    this.dialogRef.disableClose = true;
    try {
      const turno = await this.abrirMutation.mutateAsync({
        cajaId: this.data.cajaId,
        dto: this.turnoAnterior() ? {} : { saldoInicial },
      });
      this.dialogRef.close(turno);
    } catch (error) {
      this.serverError.set(error instanceof HttpErrorResponse
        ? apiMessage(error)
        : 'No se pudo abrir el turno. Inténtalo de nuevo.');
    } finally {
      this.dialogRef.disableClose = false;
    }
  }
}
