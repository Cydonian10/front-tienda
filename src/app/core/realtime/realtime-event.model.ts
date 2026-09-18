export type RealtimeEventName =
  | 'sale.created'
  | 'sale.paid'
  | 'sale.cancelled'
  | 'cash.opened'
  | 'cash.closed'
  | 'cash.movement.created'
  | 'stock.low';

export interface RealtimeEvent {
  name: RealtimeEventName;
  occurredAt: string;
  entityId: number;
  cashRegisterId?: number;
}

export interface StockLowEvent extends RealtimeEvent {
  name: 'stock.low';
  productId: number;
  productName: string;
  stock: number;
  lowStockThreshold: number;
}

export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
