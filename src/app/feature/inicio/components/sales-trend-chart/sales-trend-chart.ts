import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Chart, ChartDataset, registerables } from 'chart.js';
import { DateTime } from 'luxon';

import { SalesByDay } from '../../../../core/models/report.model';

type TrendPeriod = 'day' | 'week' | 'month';

interface TrendPoint {
  label: string;
  paidAmount: number;
  cancelledAmount: number;
}

Chart.register(...registerables);

@Component({
  selector: 'sales-trend-chart',
  templateUrl: './sales-trend-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesTrendChart {
  private readonly destroyRef = inject(DestroyRef);
  private chart: Chart<'line'> | null = null;

  protected readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly period = signal<TrendPeriod>('day');
  readonly sales = input.required<SalesByDay[]>();

  constructor() {
    afterRenderEffect({
      write: () => this.updateChart(this.sales(), this.period()),
    });
    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  protected selectPeriod(period: TrendPeriod): void {
    this.period.set(period);
  }

  protected isSelected(period: TrendPeriod): boolean {
    return this.period() === period;
  }

  private updateChart(sales: SalesByDay[], period: TrendPeriod): void {
    const points = this.pointsFor(sales, period);
    const paidDataset: ChartDataset<'line'> = {
      label: 'Ventas cobradas',
      data: points.map((point) => point.paidAmount),
      borderColor: '#4ade80',
      backgroundColor: 'rgba(74, 222, 128, 0.14)',
      pointBackgroundColor: '#4ade80',
      pointBorderColor: '#10151f',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2.5,
      fill: true,
      tension: 0.35,
    };
    const cancelledDataset: ChartDataset<'line'> = {
      label: 'Anulaciones',
      data: points.map((point) => point.cancelledAmount),
      borderColor: '#fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      pointBackgroundColor: '#fbbf24',
      pointBorderColor: '#10151f',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      borderDash: [6, 5],
      fill: false,
      tension: 0.35,
    };

    this.chart?.destroy();
    this.chart = new Chart<'line'>(this.canvas().nativeElement, {
      type: 'line',
      data: {
        labels: points.map((point) => point.label),
        datasets: [paidDataset, cancelledDataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 8, right: 8 } },
        plugins: {
          legend: {
            align: 'end',
            labels: { boxWidth: 10, boxHeight: 10, color: '#b8c1cf', usePointStyle: true },
          },
          tooltip: {
            backgroundColor: '#171d28',
            borderColor: '#394353',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: S/ ${(context.parsed.y ?? 0).toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8f9bad', maxRotation: 0, autoSkipPadding: 16 },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(143, 155, 173, 0.12)' },
            ticks: {
              color: '#8f9bad',
              callback: (value) => `S/ ${Number(value).toLocaleString('es-PE')}`,
            },
            border: { display: false },
          },
        },
      },
    });
  }

  private pointsFor(sales: SalesByDay[], period: TrendPeriod): TrendPoint[] {
    if (period === 'day') {
      return sales.slice(-7).map((day) => ({
        label: DateTime.fromISO(day.date).setLocale('es').toFormat('ccc dd'),
        paidAmount: day.paidAmount,
        cancelledAmount: day.cancelledAmount,
      }));
    }

    const unit = period === 'week' ? 'week' : 'month';
    const grouped = new Map<string, TrendPoint>();
    for (const day of sales) {
      const date = DateTime.fromISO(day.date).startOf(unit);
      const key = date.toISODate()!;
      const point = grouped.get(key) ?? {
        label:
          period === 'week'
            ? `Sem. ${date.setLocale('es').toFormat('dd LLL')}`
            : date.setLocale('es').toFormat('LLL yyyy'),
        paidAmount: 0,
        cancelledAmount: 0,
      };
      point.paidAmount += day.paidAmount;
      point.cancelledAmount += day.cancelledAmount;
      grouped.set(key, point);
    }

    return [...grouped.values()].slice(period === 'week' ? -8 : -12);
  }
}
