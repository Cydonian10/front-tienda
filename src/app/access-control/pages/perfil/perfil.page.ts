import { Component, computed, inject } from '@angular/core';
import { AuthPerfil } from '../../../api/interfaces/access-control/auth.interface';
import { IconName } from '../../../shared/components/icon/icons';
import { Icon } from '../../../shared/components/icon/icon';
import { AuthStore } from '../../../store/auth/auth.store';

interface ProfileRow {
  label: string;
  value: string;
  icon: IconName;
  state?: 'success' | 'warning' | 'error';
}

const RESOURCE_LABELS: Readonly<Record<string, string>> = {
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  sales: 'Ventas',
  products: 'Productos',
  inventory: 'Inventario',
};

@Component({
  imports: [Icon],
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.css',
  host: { class: 'block' },
})
export default class PerfilPage {
  readonly perfil = inject(AuthStore).authPerfil;

  readonly fullName = computed(() => {
    const perfil = this.perfil();
    return (
      [perfil?.person?.firstName, perfil?.person?.lastName].filter(Boolean).join(' ').trim() ||
      perfil?.nickName ||
      perfil?.email ||
      'Mi cuenta'
    );
  });

  readonly initials = computed(() => {
    const names = this.fullName().split(/\s+/).filter(Boolean);
    return `${names[0]?.charAt(0) ?? ''}${names.length > 1 ? names.at(-1)!.charAt(0) : ''}`.toLocaleUpperCase(
      'es',
    );
  });

  readonly accountRows = computed<ProfileRow[]>(() => {
    const perfil = this.perfil();
    if (!perfil) return [];

    return [
      { label: 'Correo electrónico', value: perfil.email || 'No registrado', icon: 'mail' },
      { label: 'Nombre de usuario', value: perfil.nickName || 'No registrado', icon: 'at-sign' },
      {
        label: 'Correo verificado',
        value: perfil.emailVerified ? 'Verificado' : 'Pendiente',
        icon: 'shield-check',
        state: perfil.emailVerified ? 'success' : 'warning',
      },
      {
        label: 'Estado de cuenta',
        value: perfil.active ? 'Activa' : 'Inactiva',
        icon: 'check',
        state: perfil.active ? 'success' : 'error',
      },
    ];
  });

  readonly personalRows = computed<ProfileRow[]>(() => {
    const person = this.perfil()?.person;
    if (!person) return [];

    return [
      { label: 'Nombre completo', value: this.fullName(), icon: 'user' },
      {
        label: 'Documento de identidad',
        value: person.identityDocument || 'No registrado',
        icon: 'id-card',
      },
      {
        label: 'Fecha de nacimiento',
        value: this.formatBirthDate(person.dateOfBirth),
        icon: 'calendar',
      },
      {
        label: 'Estado de persona',
        value: person.active ? 'Activa' : 'Inactiva',
        icon: 'check',
        state: person.active ? 'success' : 'error',
      },
    ];
  });

  readonly permissionGroups = computed(() => {
    const groups = new Map<string, AuthPerfil['permissions']>();
    for (const permission of this.perfil()?.permissions ?? []) {
      const resource = permission.resourceCode || 'Otros';
      const items = groups.get(resource) ?? [];
      items.push(permission);
      groups.set(resource, items);
    }

    return Array.from(groups, ([code, permissions]) => ({
      code,
      label: Object.hasOwn(RESOURCE_LABELS, code.toLowerCase())
        ? RESOURCE_LABELS[code.toLowerCase()]
        : code,
      permissions,
    }));
  });

  private formatBirthDate(value: string): string {
    // A birth date is a calendar date, not a local-time timestamp.
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value ?? '');
    if (!match) return 'No registrada';
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== match[0].slice(0, 10)
    ) {
      return 'No registrada';
    }
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
}
