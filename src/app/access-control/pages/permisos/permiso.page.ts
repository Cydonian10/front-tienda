import { Component } from '@angular/core';
import { getPermisosQuery } from '../../actions/permisos/get-permisos-action';

@Component({
  imports: [],
  selector: 'app-permisos',
  template: `
    <h1>Permisos page</h1>

    @if (permisosQuery.isLoading()) {
      <p>Loading...</p>
    }

    @if (permisosQuery.data()) {
      @for (permisos of permisosQuery.data(); track $index) {
        <p>{{ permisos.name }}</p>
      }
    }
  `,
  host: { class: 'block' },
})
export default class PermisosPage {
  permisosQuery = getPermisosQuery();
}
