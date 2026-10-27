import { afterRenderEffect, Component, computed, ElementRef, input, viewChild } from '@angular/core';
import type { Chart as ChartInstance, ChartConfiguration } from 'chart.js';
import type { DiaActividad } from '../dashboard-reposicion-page';

@Component({
  selector: 'app-actividad-chart',
  template: '<canvas #canvas role="img" [attr.aria-label]="chartLabel()"></canvas>',
  host: { class: 'block h-64 min-w-0 sm:h-72' },
})
export class ActividadChart {
  readonly days = input.required<readonly DiaActividad[]>();
  readonly warehouseName = input.required<string>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly chartLabel = computed(() => {
    const hasPurchases = this.days().some((day) => day.compras !== null);
    const hasExits = this.days().some((day) => day.salidas !== null);
    const series = [hasPurchases && 'compras', hasExits && 'salidas'].filter(Boolean).join(' y ');
    return `Gráfico de barras de ${series} por día; valores exactos en la tabla siguiente`;
  });

  constructor() {
    afterRenderEffect({
      mixedReadWrite: (onCleanup) => {
        const days = this.days();
        const warehouseName = this.warehouseName();
        const canvas = this.canvas().nativeElement;
        const context = canvas.getContext('2d');
        if (!context) return;

        let chart: ChartInstance<'bar'> | undefined;
        let active = true;
        const render = async () => {
          const { default: Chart } = await import('chart.js/auto');
          if (!active) return;
          const style = getComputedStyle(canvas);
          const primary = style.getPropertyValue('--color-primary').trim();
          const secondary = style.getPropertyValue('--color-secondary').trim();
          const text = style.getPropertyValue('--color-base-content').trim();
          const border = style.getPropertyValue('--color-base-300').trim();
          const panel = style.getPropertyValue('--color-base-200').trim();
          const config: ChartConfiguration<'bar', (number | null)[], string> = {
            type: 'bar',
            data: {
              labels: days.map((day) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', timeZone: 'UTC' })
                .format(new Date(`${day.fecha}T00:00:00Z`))),
              datasets: [
                ...(days.some((day) => day.compras !== null) ? [{
                  label: 'Compras · Todos los almacenes',
                  data: days.map((day) => day.compras),
                  backgroundColor: primary,
                  borderRadius: 3,
                  maxBarThickness: 18,
                }] : []),
                ...(days.some((day) => day.salidas !== null) ? [{
                  label: `Salidas · ${warehouseName}`,
                  data: days.map((day) => day.salidas),
                  backgroundColor: secondary,
                  borderRadius: 3,
                  maxBarThickness: 18,
                }] : []),
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              locale: 'es-PE',
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: panel,
                  titleColor: text,
                  bodyColor: text,
                  borderColor: border,
                  borderWidth: 1,
                  callbacks: { title: (items) => items[0] ? `${days[items[0].dataIndex].fecha}` : '' },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: text, maxTicksLimit: 8, maxRotation: 0 } },
                y: { beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: border } },
              },
            },
          };
          chart?.destroy();
          chart = new Chart(context, config);
        };

        void render();
        const observer = new MutationObserver(() => void render());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        onCleanup(() => {
          active = false;
          observer.disconnect();
          chart?.destroy();
        });
      },
    });
  }
}
