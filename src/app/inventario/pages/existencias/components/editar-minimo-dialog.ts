import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import type { ExistenciaItem } from '../../../../api/interfaces/inventario/existencia.interface';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../../auth/services/use-permissions';
import { decimalCompacto } from '../../../../shared/formatters/decimal';
import { useEditarMinimoExistencia } from '../../../actions/use-existencias-action';
import { CatalogoFormDialog } from '../../../components/catalogo-form-dialog';

@Component({
  selector: 'app-editar-minimo-dialog',
  imports: [CatalogoFormDialog],
  templateUrl: './editar-minimo-dialog.html',
})
export class EditarMinimoDialog {
  readonly fila = input.required<ExistenciaItem>();
  readonly closed = output<void>();
  readonly access = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM });
  readonly mutation = useEditarMinimoExistencia();
  readonly confirming = signal(false);
  readonly draft = linkedSignal(() => this.fila().minimoBase === null ? '' : decimalCompacto(this.fila().minimoBase!));
  readonly error = signal('');
  readonly busy = computed(() => this.mutation.guardar.isPending() || this.mutation.quitar.isPending());
  readonly inputId = computed(() => `minimo-${this.fila().variante.id}-${this.fila().almacen.id}`);
  readonly decimalCompacto = decimalCompacto;

  cerrar(): void {
    if (!this.busy()) this.closed.emit();
  }

  async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.access.edit() || this.busy()) return;
    const value = this.draft().trim();
    if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/.test(value) || !/[1-9]/.test(value)) {
      this.error.set('Ingresa un mínimo positivo de hasta seis decimales en unidad base.');
      return;
    }
    this.error.set('');
    try {
      await this.mutation.guardar.mutateAsync({
        varianteId: this.fila().variante.id,
        almacenId: this.fila().almacen.id,
        minimoBase: value,
      });
      this.closed.emit();
    } catch (error) {
      this.error.set((error as { status?: number }).status === 403
        ? 'Ya no tienes permiso para editar mínimos.'
        : 'No se pudo guardar el mínimo. Revisa el valor e inténtalo de nuevo.');
    }
  }

  async quitar(): Promise<void> {
    if (!this.access.edit() || !this.confirming() || this.busy()) return;
    this.error.set('');
    try {
      await this.mutation.quitar.mutateAsync({
        varianteId: this.fila().variante.id,
        almacenId: this.fila().almacen.id,
      });
      this.closed.emit();
    } catch (error) {
      this.error.set((error as { status?: number }).status === 403
        ? 'Ya no tienes permiso para quitar mínimos.'
        : 'No se pudo quitar el mínimo. Inténtalo de nuevo.');
    }
  }
}
