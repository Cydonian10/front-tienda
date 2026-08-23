import { Injectable } from '@angular/core';

export interface OrderedItem {
  order: number;
}

@Injectable({ providedIn: 'root' })
export class ProductAttributeOrderService {
  private readonly bufferSpace = 10;

  getPosition(cards: readonly OrderedItem[], currentIndex: number): number {
    if (cards.length === 1) {
      return this.bufferSpace;
    }

    if (cards.length > 1 && currentIndex === 0) {
      return cards[1].order / 2;
    }

    const lastIndex = cards.length - 1;
    if (cards.length > 2 && currentIndex > 0 && currentIndex < lastIndex) {
      const previousPosition = cards[currentIndex - 1].order;
      const nextPosition = cards[currentIndex + 1].order;
      return (previousPosition + nextPosition) / 2;
    }

    if (cards.length > 1 && currentIndex === lastIndex) {
      return cards[lastIndex - 1].order + this.bufferSpace;
    }

    return 0;
  }

  getPositionNewCard(cards: readonly OrderedItem[]): number {
    if (cards.length === 0) {
      return this.bufferSpace;
    }

    return cards[cards.length - 1].order + this.bufferSpace;
  }
}
