import { Component, computed, signal } from '@angular/core';
import type { FiltroExistencias } from '../../../api/interfaces/inventario/existencia.interface';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { useAlmacenesExistencias, useExistencias } from '../../actions/use-existencias-action';

/** Redondea a centavos sin pasar por aritmética binaria. */
export function soles(valor: string): string {
  const match = /^(\-?)(\d+)(?:\.(\d+))?$/.exec(valor);
  if (!match) return '—';
  const [, sign, integer, decimals = ''] = match;
  const cents = BigInt(integer) * 100n + BigInt(decimals.padEnd(3, '0').slice(0, 2));
  const rounded = cents + (Number(decimals[2] ?? '0') >= 5 ? 1n : 0n);
  const absolute = rounded / 100n;
  const fraction = String(rounded % 100n).padStart(2, '0');
  return `S/ ${sign && rounded !== 0n ? '-' : ''}${new Intl.NumberFormat('es-PE').format(absolute)}.${fraction}`;
}

export function promedio(valor: string | null): string {
  if (valor === null) return '—';
  const match = /^(\-?)(\d+)(?:\.(\d+))?$/.exec(valor);
  if (!match) return '—';
  const [, sign, integer, fraction = ''] = match;
  return `S/ ${sign}${new Intl.NumberFormat('es-PE').format(BigInt(integer))}${fraction ? `.${fraction.slice(0, 6)}` : ''}`;
}

@Component({
  selector: 'app-existencias-page',
  imports: [EmptyState, Pagination],
  templateUrl: './existencias-page.html',
  host: { class: 'block min-w-0' },
})
export default class ExistenciasPage {
  readonly almacenId = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly q = signal('');
  readonly productoId = signal<string | undefined>(undefined);
  readonly disponibilidad = signal<FiltroExistencias['disponibilidad']>('todas');
  readonly filtro = computed<FiltroExistencias | null>(() => {
    const almacenId = this.almacenId();
    return almacenId
      ? {
          almacenId,
          page: this.page(),
          limit: this.pageSize(),
          q: this.q(),
          productoId: this.productoId(),
          disponibilidad: this.disponibilidad(),
        }
      : null;
  });
  readonly almacenes = useAlmacenesExistencias();
  readonly existencias = useExistencias(this.filtro);
  readonly totalPages = computed(() => {
    const response = this.existencias.data();
    return response ? Math.ceil(response.totalItems / response.limit) : 0;
  });
  readonly soles = soles;
  readonly promedio = promedio;

  elegirAlmacen(id: string): void {
    this.almacenId.set(id || null);
    this.page.set(1);
  }

  cambiarTamano(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
