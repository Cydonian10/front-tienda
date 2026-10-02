import { Component, inject, OnInit } from '@angular/core';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  imports: [SearchSelect, ReactiveFormsModule],
  selector: 'app-roles',
  template: `
    <h1>Roles Page</h1>
    <app-search-select
      [options]="products"
      placeholder="Producto"
      [visibleItems]="4"
      [formControl]="idProductForm"
    />

    <button class="btn btn-primary" (click)="confirmarGuardar()">Guardar</button>
  `,
  host: { class: 'block' },
})
export default class RolesPage implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmDialogService);

  ngOnInit(): void {
    this.idProductForm.valueChanges.subscribe((value) => {
      console.log(value);
    });
  }
  readonly products: { value: number; label: string }[] = [
    { value: 1, label: 'Martillo' },
    { value: 2, label: 'Taladro' },
  ];

  idProductForm = new FormControl<number>(null as unknown as number);

  guardarProductos() {
    this.toast.error('Lo cambios se guardaron correctamente', {
      title: 'esta tdo bien ',
      duration: 3000,
    });
  }

  confirmarGuardar() {
    this.confirmation
      .confirm({
        title: '¿Eliminar este producto?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar producto',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        // Ejecutar aquí la eliminación, no antes de confirmar.
        console.log('hola mundo como estas');
        this.guardarProductos();
      });
  }
}
