import { PaginationQuery } from './pagination.model';

export interface MeasurementUnit {
  id: number;
  name: string;
  value: string;
}

export interface MeasurementUnitFilter extends PaginationQuery {
  search?: string;
}
