import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';

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
  /**
   * Operator used when the user keeps the default
   *
   * Defaults to the first operator of {@link QueryField.types} (or of the list derived from
   * {@link QueryField.valueType}), so it only needs to be set to deviate from that.
   */
  defaultType?: QueryOperator;
  /** Restrict the selectable operators; defaults by `valueType` */
  types?: QueryOperator[];
  /** Options for `select` fields */
  options?: SelectOption[];
  /** Placeholder of the value editor */
  placeholder?: string;
  /**
   * Whether the field is searched by the mixed `like` keyword query
   *
   * Several items are AND-ed by the backend, so the fields that should be OR-ed (e.g.
   * `a.code like '%' or a.name like '%'`) are marked with `fast: true`. They are merged into a
   * single keyword condition by {@link buildFieldSlots} (label `queryFilter.keyword`, locked to the
   * `like` operator, merged labels in the placeholder) and expanded back into one `fast` item per
   * prop by {@link toQueryItems}, so the backend OR-s them instead of AND-ing them.
   */
  fast?: boolean;
}

/** One condition edited by the query filter (backend query item + a local id) */
export interface QueryFilterCondition {
  id: string;
  prop: string;
  type: QueryOperator;
  values: string[];
  /**
   * The props of the `fast` fields merged into this condition, only set for the keyword condition
   *
   * {@link toQueryItems} expands it into one `fast: true` item per prop, so a single keyword value
   * searches every merged field.
   */
  fastProps?: string[];
}

/** One sort rule edited by the query filter (backend order item + a local id) */
export interface QuerySortItem {
  id: string;
  /** Backend property name */
  prop: string;
  /** Whether ascending */
  asc: boolean;
}

/**
 * Operators offered per value type
 *
 * The first one of each list is the default of a field that does not set `defaultType`, so a plain
 * text field defaults to a `like` (contains) search.
 */
const TEXT_OPERATORS: QueryOperator[] = ['like', 'eq', 'ne', 'notLike', 'in', 'notIn'];
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

/** Separator used by the merged keyword placeholder */
export const FAST_FIELD_SEPARATOR = ' / ';

/**
 * One condition rendered by the filter, with the props merged into it
 */
export interface QueryFieldSlot {
  /** The rendered field, the keyword one is a virtual field built by {@link buildFieldSlots} */
  field: QueryField;
  /** The props of the `fast` fields merged into this condition, only set for the keyword one */
  fastProps?: string[];
}

/**
 * Build the field slots rendered by the filter
 *
 * Every `fast` field is merged into a single virtual keyword field, rendered first as it is the
 * quickest way to narrow the list down. Its condition is locked to `like`, labelled as
 * `queryFilter.keyword`, and its placeholder lists the merged labels so the user knows which fields
 * are actually searched.
 */
export function buildFieldSlots(fields: QueryField[]): QueryFieldSlot[] {
  const fastFields = fields.filter(field => field.fast);

  if (!fastFields.length) return fields.map(field => ({ field }));

  const [first, ...rest] = fastFields;

  return [
    {
      field: {
        ...first,
        // a `like` value is a single string, so the text editor is used no matter the value types
        valueType: 'text',
        label: $t('queryFilter.keyword'),
        placeholder: [first, ...rest].map(field => field.label).join(FAST_FIELD_SEPARATOR),
        types: ['like']
      },
      fastProps: fastFields.map(field => field.prop)
    },
    ...fields.filter(field => !field.fast).map(field => ({ field }))
  ];
}

/**
 * Get the default operator of a field
 *
 * Falls back to the first operator the field offers, so a field only sets `defaultType` to deviate
 * from it and most definitions leave it out.
 */
export function getDefaultOperator(field?: QueryField | null): QueryOperator {
  if (!field) return 'eq';

  const operators = getFieldOperators(field);

  if (field.defaultType && operators.includes(field.defaultType)) {
    return field.defaultType;
  }

  return operators[0] ?? 'eq';
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
 *
 * A merged keyword condition is expanded into one item per merged field, and every one of them is
 * flagged with `fast: true`, so the backend OR-s them (`a.code like ? or a.name like ?`) instead of
 * AND-ing them like any other pair of items.
 */
export function toQueryItems(conditions: QueryFilterCondition[]): Api.SystemManage.QueryItem[] {
  return conditions.filter(isConditionFilled).flatMap(condition => {
    const values = normalizeValues(condition.type, condition.values).map(String);

    if (condition.fastProps?.length) {
      return condition.fastProps.map(prop => ({ prop, type: condition.type, values, fast: true }));
    }

    return { prop: condition.prop, type: condition.type, values };
  });
}

let sortSeed = 0;

/** Create a local unique id for a sort item */
export function createSortId() {
  sortSeed += 1;

  return `qs-${Date.now().toString(36)}-${sortSeed}`;
}

/** Create a sort item from a field, defaulting to descending */
export function createSortItem(field: QueryField, overrides?: Partial<QuerySortItem>): QuerySortItem {
  return {
    id: createSortId(),
    prop: field.prop,
    asc: false,
    ...overrides
  };
}

/** Convert the internal sort items to backend order items */
export function toOrderItems(items: QuerySortItem[]): Api.SystemManage.OrderByItem[] {
  return items.map(item => ({ prop: item.prop, asc: item.asc }));
}
