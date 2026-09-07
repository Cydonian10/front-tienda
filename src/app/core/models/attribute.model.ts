import { PaginationQuery } from './pagination.model';

export interface AttributeValue {
  id: number;
  value: string;
  attributeId: number;
}

export interface Attribute {
  id: number;
  name: string;
}

export interface AttributeWithValues extends Attribute {
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

export interface UpdateAttribute {
  name: string;
}

export interface CreateAttributeValue {
  value: string;
  attributeId: number;
}

export interface UpdateAttributeValue {
  value: string;
}

export interface AttributeBatchResult {
  attribute: AttributeWithValues;
  created: boolean;
}

export type AttributeWithValuesFilter = AttributeFilter;
