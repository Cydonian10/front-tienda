import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SalesSummaryComponent } from './sales-summary';

describe('SalesSummaryComponent', () => {
  it('renders paid and cancelled metrics supplied by the report endpoint', async () => {
    await TestBed.configureTestingModule({ imports: [SalesSummaryComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SalesSummaryComponent);
    fixture.componentRef.setInput('summary', {
      from: '2026-09-12T00:00:00.000-05:00',
      to: '2026-09-12T23:59:59.999-05:00',
      paidAmount: 150,
      paidCount: 2,
      averageTicket: 75,
      cancelledCount: 1,
      cancelledAmount: 25,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('150');
    expect(fixture.nativeElement.textContent).toContain('75');
    expect(fixture.nativeElement.textContent).toContain('25');
  });
});
