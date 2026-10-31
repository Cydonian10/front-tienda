import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cajas-filtro',
  imports: [RouterLink],
  templateUrl: './cajas-filtro.html',
})
export class CajasFiltro {
  readonly filtro = input.required<'todas' | 'abiertas' | 'cerradas'>();
}
