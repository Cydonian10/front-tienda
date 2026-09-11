import { PaginationQuery } from './pagination.model';
import { Product } from './product.model';

export type SaleStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type SalePaymentStatus = 'PAID' | 'CANCELLED';

export interface SaleDetail {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalePayment {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  status: SalePaymentStatus;
}

export interface Sale {
  id: number;
  saleDate: string;
  customerId: number;
  customerName: string;
  sellerId: number;
  sellerName: string;
  cashOpeningId: number;
  discount: number;
  totalAmount: number;
  status: SaleStatus;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelledById: number | null;
  cancellationReason: string | null;
  payment: SalePayment | null;
  details: SaleDetail[];
}

export interface CreateSaleDetail {
  productId: number;
  quantity: number;
}

export interface CreateSale {
  cashOpeningId: number;
  customerId: number;
  discount?: number;
  details: CreateSaleDetail[];
}

export interface UpdateSale {
  customerId?: number;
  discount?: number;
  details?: CreateSaleDetail[];
}

export interface PaySale {
  paymentMethodId: number;
  amount: number;
}

export interface CancelSale {
  cancellationReason: string;
}

export interface SaleFilter extends PaginationQuery {
  status?: SaleStatus;
  cashOpeningId?: number;
  sellerId?: number;
  startDate?: string;
  endDate?: string;
}

export interface SaleCartLine {
  product: Product;
  quantity: number;
}
