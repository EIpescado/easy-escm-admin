import type { SelectOption } from 'naive-ui';

/**
 * Shared types & helpers for the advanced query filter.
 *
 * The component edits a list of {@link QueryFilterCondition} and converts it to the backend dynamic
 * query shape {@link Api.SystemManage.QueryItem} ({ prop, values, type }).
 */

/** Query operator supported by the backend dynamic query (`Api.SystemManage.QueryItem.type`) */
export type QueryOperator = 'eq' | 'ne' | 'like' | 'notLike' | 'gt' | 'ge' | 'lt' | 'le' | 'between' | 'in' | 'notIn';

/** How many values an operator consumes */
export type QueryOperatorValueKind = 'none' | 'single' | 'range' | 'multiple';

export interface QueryOperatorMeta {
  value: QueryOperator;
  valueKind: QueryOperatorValueKind;
}

/**
 * All operators supported by the backend `DynamicConditionInterceptor#buildRightExpression`
 *
 * - single value: eq / in, ne / notIn, like, notLike, gt, ge, lt, le
 * - multiple values: eq / in, ne / notIn, like, notLike, gt, ge, lt, le, between
 */
export const QUERY_OPERATORS: Record<QueryOperator, QueryOperatorMeta> = {
  eq: { value: 'eq', valueKind: 'single' },
  ne: { value: 'ne', valueKind: 'single' },
  like: { value: 'like', valueKind: 'single' },
  notLike: { value: 'notLike', valueKind: 'single' },
  gt: { value: 'gt', valueKind: 'single' },
  ge: { value: 'ge', valueKind: 'single' },
  lt: { value: 'lt', valueKind: 'single' },
  le: { value: 'le', valueKind: 'single' },
  between: { value: 'between', valueKind: 'range' },
  in: { value: 'in', valueKind: 'multiple' },
  notIn: { value: 'notIn', valueKind: 'multiple' }
};

/** Stable order used to render operator selects */
export const QUERY_OPERATOR_ORDER = Object.keys(QUERY_OPERATORS) as QueryOperator[];

/** Value widget type of a field, decides the input rendered for a condition */
export type QueryFieldValueType = 'text' | 'number' | 'date' | 'select';

/** A searchable field exposed to the query filter */
export interface QueryField {
  /** Backend property name */
  prop: string;
  /** Display label (already translated) */
  label: string;
  /** Value widget type, defaults to `text` */
  valueType?: QueryFieldValueType;
  /** Operator used when the user keeps the default; defaults by `valueType` */
  defaultType?: QueryOperator;
  /** Restrict the selectable operators; defaults by `valueType` */
  types?: QueryOperator[];
  /** Options for `select` fields */
  options?: SelectOption[];
  /** Placeholder of the value editor */
  placeholder?: string;
}

/** One condition edited by the query filter (backend query item + a local id) */
export interface QueryFilterCondition {
  id: string;
  prop: string;
  type: QueryOperator;
  values: string[];
}

const TEXT_OPERATORS: QueryOperator[] = ['eq', 'ne', 'like', 'notLike', 'in', 'notIn'];
const NUMBER_OPERATORS: QueryOperator[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'in', 'notIn'];
const DATE_OPERATORS: QueryOperator[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between'];
const SELECT_OPERATORS: QueryOperator[] = ['eq', 'ne', 'in', 'notIn'];

/** Get the operators available for a field */
export function getFieldOperators(field?: QueryField | null): QueryOperator[] {
  if (!field) return QUERY_OPERATOR_ORDER;
  if (field.types?.length) return field.types;

  switch (field.valueType) {
    case 'number':
      return NUMBER_OPERATORS;
    case 'date':
      return DATE_OPERATORS;
    case 'select':
      return SELECT_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

/** Get the default operator of a field (used by quick query when the user keeps the default) */
export function getDefaultOperator(field?: QueryField | null): QueryOperator {
  if (!field) return 'eq';

  if (field.defaultType && getFieldOperators(field).includes(field.defaultType)) {
    return field.defaultType;
  }

  return field.valueType === 'text' ? 'like' : 'eq';
}

/** Get how many values an operator consumes */
export function getOperatorValueKind(type: QueryOperator): QueryOperatorValueKind {
  return QUERY_OPERATORS[type]?.valueKind ?? 'single';
}

/** Normalize a values array to fit the operator (e.g. keep at most one value for `single`) */
export function normalizeValues(type: QueryOperator, values: string[]): string[] {
  const kind = getOperatorValueKind(type);

  if (kind === 'none') return [];
  if (kind === 'single') return values.slice(0, 1);
  if (kind === 'range') return values.slice(0, 2);

  return values;
}

let conditionSeed = 0;

/** Create a local unique id for a condition */
export function createConditionId() {
  conditionSeed += 1;

  return `qf-${Date.now().toString(36)}-${conditionSeed}`;
}

/** Create a condition from a field, applying its default operator */
export function createCondition(field: QueryField, overrides?: Partial<QueryFilterCondition>): QueryFilterCondition {
  return {
    id: createConditionId(),
    prop: field.prop,
    type: getDefaultOperator(field),
    values: [],
    ...overrides
  };
}

/** Whether a condition has the values required by its operator */
export function isConditionFilled(condition: QueryFilterCondition) {
  const kind = getOperatorValueKind(condition.type);

  if (kind === 'none') return true;

  const filled = condition.values.filter(value => value !== '' && value !== null && value !== undefined);

  if (kind === 'range') return filled.length === 2;

  return filled.length > 0;
}

/**
 * Convert the internal conditions to backend query items
 *
 * Empty conditions are dropped, so the caller does not need to filter them.
 */
export function toQueryItems(conditions: QueryFilterCondition[]): Api.SystemManage.QueryItem[] {
  return conditions.filter(isConditionFilled).map(condition => ({
    prop: condition.prop,
    type: condition.type,
    values: normalizeValues(condition.type, condition.values).map(String)
  }));
}
