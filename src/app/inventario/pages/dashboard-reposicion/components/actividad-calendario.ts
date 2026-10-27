import { Component, computed, input, signal } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';
import type { DiaActividad } from '../dashboard-reposicion-page';

const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayName = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

@Component({
  selector: 'app-actividad-calendario',
  imports: [Icon],
  templateUrl: './actividad-calendario.html',
  host: { class: 'block min-w-0' },
})
export class ActividadCalendario {
  readonly days = input.required<readonly DiaActividad[]>();
  readonly monthOffset = signal(0);
  readonly selectedDate = signal<string | null>(null);
  readonly months = computed(() => {
    const days = this.days();
    if (!days.length) return [];
    const start = days[0].fecha.slice(0, 7);
    const end = days.at(-1)!.fecha.slice(0, 7);
    const result: string[] = [];
    const [year, month] = start.split('-').map(Number);
    for (let date = new Date(Date.UTC(year, month - 1)); date.toISOString().slice(0, 7) <= end; date.setUTCMonth(date.getUTCMonth() + 1)) {
      result.push(date.toISOString().slice(0, 7));
    }
    return result;
  });
  readonly monthIndex = computed(() => Math.max(0, Math.min(this.months().length - 1, this.months().length - 1 + this.monthOffset())));
  readonly currentMonth = computed(() => this.months()[this.monthIndex()] ?? '');
  readonly currentMonthLabel = computed(() => capitalize(monthName.format(new Date(`${this.currentMonth()}-01T00:00:00Z`))));
  readonly cells = computed(() => {
    const month = this.currentMonth();
    if (!month) return [];
    const [year, number] = month.split('-').map(Number);
    const firstWeekday = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
    const totalDays = new Date(Date.UTC(year, number, 0)).getUTCDate();
    const activity = new Map(this.days().map((day) => [day.fecha, day]));
    return Array.from({ length: firstWeekday + totalDays }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 ? activity.get(`${month}-${String(day).padStart(2, '0')}`) ?? null : null;
    });
  });
  readonly activeDay = computed(() => {
    const visibleDays = this.cells().filter((day): day is DiaActividad => day !== null);
    return visibleDays.find((day) => day.fecha === this.selectedDate()) ??
      [...visibleDays].reverse().find((day) => (day.compras ?? 0) > 0 || (day.salidas ?? 0) > 0) ??
      visibleDays.at(-1) ?? null;
  });
  readonly activeDayLabel = computed(() => {
    const day = this.activeDay();
    return day ? capitalize(dayName.format(new Date(`${day.fecha}T00:00:00Z`))) : '';
  });

  moveMonth(direction: number): void {
    const next = this.monthIndex() + direction;
    if (next < 0 || next >= this.months().length) return;
    this.monthOffset.set(next - this.months().length + 1);
    this.selectedDate.set(null);
  }
}
