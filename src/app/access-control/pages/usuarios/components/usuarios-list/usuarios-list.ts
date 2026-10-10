import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../../shared/components/icon/icon';
import { Usuario } from '../../../../../api/interfaces/access-control/usuario.interface';

@Component({
  selector: 'app-usuarios-list',
  imports: [FormsModule, Icon],
  host: {
    class: 'overflow-hidden rounded-box border border-base-300 bg-base-100 block',
    'aria-label': 'Lista de usuarios',
  },
  templateUrl: './usuarios-list.html',
})
export class UsuariosList {
  readonly users = input.required<Usuario[]>();
  readonly filteredUsers = input.required<Usuario[]>();
  readonly selectedId = input<string | null>(null);
  readonly search = input('');
  readonly status = input('all');
  readonly searchChange = output<string>();
  readonly statusChange = output<string>();
  readonly selectUser = output<string>();
  protected readonly fullName = (user: Usuario) =>
    `${user.person.firstName} ${user.person.lastName}`;
  protected readonly initials = (user: Usuario) =>
    `${user.person.firstName.charAt(0)}${user.person.lastName.charAt(0)}`.toLocaleUpperCase('es');
}
