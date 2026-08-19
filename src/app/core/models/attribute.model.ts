import { PaginationQuery } from './pagination.model';

export interface AttributeValue {
  id: number;
  value: string;
}

export interface AttributeWithValues {
  id: number;
  name: string;
  values: AttributeValue[];
}

export interface AttributeWithValuesFilter extends PaginationQuery {
  search?: string;
}
