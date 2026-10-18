import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Ruta temporal para no enviar a una página inexistente antes de implementar el detalle. */
@Component({
  selector: 'app-compra-detalle-pendiente',
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-3xl space-y-5" aria-labelledby="detalle-title">
      <h1 id="detalle-title" class="text-2xl font-semibold tracking-tight">Detalle de compra</h1>
      <p class="text-sm text-base-content/70">Referencia solicitada: {{ id }}</p>
      <div role="status" class="alert alert-info alert-soft">
        La consulta y el reintento de subida del comprobante estarán disponibles en el siguiente
        paso. La compra y su ingreso no se modifican al abrir esta página.
      </div>
      <a class="btn btn-outline min-h-11" routerLink="/admin/inventario/compras"
        >Volver a compras</a
      >
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompraDetallePendiente {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
}
