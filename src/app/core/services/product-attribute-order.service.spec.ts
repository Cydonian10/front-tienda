import { describe, expect, it } from 'vitest';

import { ProductAttributeOrderService } from './product-attribute-order.service';

describe('ProductAttributeOrderService', () => {
  const service = new ProductAttributeOrderService();

  it('assigns the buffer to the first card and appends new cards', () => {
    expect(service.getPosition([], 0)).toBe(0);
    expect(service.getPosition([{ order: 10 }], 0)).toBe(10);
    expect(service.getPositionNewCard([])).toBe(10);
    expect(service.getPositionNewCard([{ order: 10 }, { order: 20 }])).toBe(30);
  });

  it('calculates positions at the top, middle and bottom', () => {
    const cards = [{ order: 10 }, { order: 20 }, { order: 30 }];

    expect(service.getPosition(cards, 0)).toBe(10);
    expect(service.getPosition(cards, 1)).toBe(20);
    expect(service.getPosition(cards, 2)).toBe(30);
  });

  it('calculates a position between neighboring cards after a move', () => {
    const cards = [{ order: 30 }, { order: 10 }, { order: 20 }, { order: 40 }];

    expect(service.getPosition(cards, 0)).toBe(5);
    expect(service.getPosition(cards, 1)).toBe(25);
    expect(service.getPosition(cards, 2)).toBe(25);
  });
});
