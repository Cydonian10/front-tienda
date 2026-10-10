import { Component, input } from '@angular/core';
import { Usuario } from '../../../../../api/interfaces/access-control/usuario.interface';
import { Icon } from '../../../../../shared/components/icon/icon';

@Component({
  selector: 'app-usuario-detail',
  imports: [Icon],
  host: { class: 'block min-w-0' },
  templateUrl: './usuario-detail.html',
})
export class UsuarioDetail {
  readonly user = input.required<Usuario>();

  protected readonly fullName = (user: Usuario) =>
    `${user.person.firstName} ${user.person.lastName}`;
  protected readonly initials = (user: Usuario) =>
    `${user.person.firstName.charAt(0)}${user.person.lastName.charAt(0)}`.toLocaleUpperCase('es');
}
