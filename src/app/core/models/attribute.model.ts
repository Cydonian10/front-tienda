import { PaginationQuery } from './pagination.model';

export interface AttributeValue {
  id: number;
  value: string;
  attributeId: number;
}

export interface AttributeWithValues {
  id: number;
  name: string;
  values: AttributeValue[];
}

export interface AttributeFilter extends PaginationQuery {
  search?: string;
}

export interface CreateAttributeBatchValue {
  value: string;
}

export interface CreateAttributeBatch {
  name: string;
  values: CreateAttributeBatchValue[];
}

export interface AttributeBatchResult {
  attribute: AttributeWithValues;
  created: boolean;
}

export type AttributeWithValuesFilter = AttributeFilter;
