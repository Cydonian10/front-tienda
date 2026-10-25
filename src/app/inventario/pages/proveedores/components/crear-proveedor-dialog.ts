import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { CatalogoFormDialog } from '../../../components/catalogo-form-dialog';
import { ToastService } from '../../../../shared/services/toast/toast.service';
import { useCrearProveedor } from '../../../actions/use-proveedores-action';

@Component({
  selector: 'app-crear-proveedor-dialog',
  imports: [CatalogoFormDialog],
  templateUrl: './crear-proveedor-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearProveedorDialog {
  private readonly toast = inject(ToastService);
  readonly closeRequested = output<void>();
  readonly nombre = signal('');
  readonly documento = signal('');
  readonly contacto = signal('');
  readonly nombreError = signal('');
  readonly documentoError = signal('');
  readonly contactoError = signal('');
  readonly error = signal('');
  readonly create = useCrearProveedor();
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  constructor() {
    afterNextRender(() => this.cancelButton()?.nativeElement.focus());
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.create.isPending()) return;
    this.nombreError.set('');
    this.documentoError.set('');
    this.contactoError.set('');
    this.error.set('');
    const nombre = this.nombre().trim();
    const documento = this.documento().trim();
    const contacto = this.contacto().trim();
    if (!nombre) {
      this.nombreError.set('El nombre es obligatorio.');
      return;
    }
    if (nombre.length > 200) {
      this.nombreError.set('El nombre no puede superar los 200 caracteres.');
      return;
    }
    if (documento.length > 100) {
      this.documentoError.set('El documento no puede superar los 100 caracteres.');
      return;
    }
    if (contacto.length > 200) {
      this.contactoError.set('El contacto no puede superar los 200 caracteres.');
      return;
    }
    try {
      const created = await this.create.mutateAsync({
        nombre,
        ...(documento ? { documento } : {}),
        ...(contacto ? { contacto } : {}),
      });
      this.toast.success(`Proveedor ${created.nombre} registrado.`);
      this.closeRequested.emit();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.documentoError.set('Este documento ya pertenece a otro proveedor.');
      } else if (error instanceof HttpErrorResponse && error.status === 403) {
        this.error.set('Ya no tienes permiso para crear proveedores.');
      } else {
        this.error.set(error instanceof Error && error.message.startsWith('No tienes permiso')
          ? error.message
          : 'No se pudo registrar el proveedor. Intenta nuevamente.');
      }
    }
  }
}
