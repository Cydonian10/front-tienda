import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'gestion-productos-page',
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5 pb-10">
      <h1 id="admin-section-title" class="text-3xl font-bold tracking-tight sm:text-4xl">
        Gestionar productos
      </h1>
      <p>La búsqueda y edición de productos estará disponible próximamente.</p>
      <a routerLink="/admin/inventario/productos" class="btn">Volver a crear productos</a>
    </section>
  `,
})
export default class GestionProductosPage {}
