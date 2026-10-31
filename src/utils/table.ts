import { h } from 'vue';
import { NTag } from 'naive-ui';
import { $t } from '@/locales';
import type { QueryField } from '@/components/advanced/query-filter/types';

/**
 * Calculate the width of a table operation column from its action labels
 *
 * - When actions are collapsed into a dropdown, use a compact width
 * - Otherwise estimate the width from the label lengths
 *
 * @param labels Action labels
 * @param max Max button count before collapsing into a dropdown
 * @param extra Extra width, e.g. the tree expand placeholder in a tree table
 */
export function getTableOperateColumnWidth(labels: string[], max = 2, extra = 0) {
  if (labels.length > max) {
    return 96 + extra;
  }

  const contentWidth = labels.reduce((sum, label) => sum + label.length * 14 + 30, 0);
  const gapWidth = Math.max(0, labels.length - 1) * 4;

  return Math.ceil(contentWidth + gapWidth + 24 + extra);
}

/** Column keys that are not backend entity fields, e.g. the operation / selection columns */
const NON_DATA_KEYS = ['operate', '__selection__', '__expand__'];

/** Keep only the data columns (dropping the operation / selection ones), in table order */
function getDataColumns(checks: NaiveUI.TableColumnCheck[], exclude: string[] = []) {
  const excluded = new Set([...NON_DATA_KEYS, ...exclude]);

  return checks.filter(check => !excluded.has(check.key));
}

/** Display label of a column check, falling back to its key */
function getColumnLabel(check: NaiveUI.TableColumnCheck) {
  return typeof check.title === 'string' ? check.title : check.key;
}

/**
 * Build the backend export items from the table column checks, keeping only the checked data columns
 *
 * The order follows the column checks array, so it matches the table (including drag reordering).
 *
 * @param checks Table column checks
 * @param exclude Extra column keys to exclude
 */
export function getExportItems(
  checks: NaiveUI.TableColumnCheck[],
  exclude: string[] = []
): Api.SystemManage.ExportItem[] {
  return getDataColumns(checks, exclude)
    .filter(check => check.checked && check.visible)
    .map(check => ({
      prop: check.key,
      label: getColumnLabel(check)
    }));
}

/**
 * Build the sortable fields from the table column checks
 *
 * Every data column is sortable, including the ones hidden in the column settings: hiding a column
 * only hides it from the table, it must not prevent sorting by it.
 */
export function getSortFields(checks: NaiveUI.TableColumnCheck[]): QueryField[] {
  return getDataColumns(checks).map(check => ({
    prop: check.key,
    label: getColumnLabel(check)
  }));
}

/** Render an enable/disable tag; `value` is the enum name stored in the row */
export function renderEnabledTag(value: unknown, onValue = 'ON') {
  const enabled = String(value) === onValue;

  return h(
    NTag,
    { type: enabled ? 'success' : 'error', size: 'small', bordered: false },
    { default: () => $t(enabled ? 'common.enable' : 'common.disable') }
  );
}

/** Render a yes/no tag */
export function renderBooleanTag(value: unknown) {
  return h(
    NTag,
    { type: value ? 'warning' : 'default', size: 'small', bordered: false },
    { default: () => $t(value ? 'common.yesOrNo.yes' : 'common.yesOrNo.no') }
  );
}

/**
 * A management list column
 *
 * `cell` picks a built-in renderer, so a page does not repeat the enable/disable or the yes/no tag
 * on every list:
 *
 * ```ts
 * { key: 'state', title: $t('…'), cell: 'enabled' }
 * ```
 */
export type ManageColumn<Row> = NaiveUI.TableColumn<Row> & {
  /** Built-in cell renderer */
  cell?: 'enabled' | 'boolean';
  /**
   * Row field the built-in renderer reads, defaults to the column `key`
   *
   * The `enabled` renderer reads `<key>Enum` instead when the row carries it, see
   * {@link withCellRenderer}.
   */
  cellKey?: string;
  /** Enum name the `enabled` renderer treats as enabled */
  onValue?: string;
};

/**
 * Whether a column key holds a date / datetime, e.g. `createTime`, `requestTime`, `request_time`
 *
 * Case-sensitive on the camelCase suffix so words like `validate` are not mistaken for dates.
 */
function isDateColumnKey(key: string) {
  return /(Time|Date)s?$/.test(key) || /(^|_)(time|date)s?$/i.test(key);
}

/** Width of a datetime cell: `yyyy-MM-dd HH:mm:ss` plus the cell padding */
const DATE_TIME_COLUMN_WIDTH = 170;

/**
 * Keep a date / datetime column on one line at a fixed width
 *
 * The backend serialises them as `yyyy-MM-dd` or `yyyy-MM-dd HH:mm:ss`; the space lets a narrow
 * column wrap a timestamp into two lines, so the width is fixed and the cells never wrap.
 */
export function withDateColumnStyle<Row>(column: NaiveUI.TableColumn<Row>): NaiveUI.TableColumn<Row> {
  if (!('key' in column) || typeof column.key !== 'string' || !isDateColumnKey(column.key)) {
    return column;
  }

  const { cellProps, width } = column;
  const columnWidth = typeof width === 'number' ? Math.max(width, DATE_TIME_COLUMN_WIDTH) : DATE_TIME_COLUMN_WIDTH;

  return {
    ...column,
    width: columnWidth,
    cellProps: (row: Row, index: number) => ({
      ...cellProps?.(row, index),
      style: { whiteSpace: 'nowrap' }
    })
  } as NaiveUI.TableColumn<Row>;
}

/** Apply the built-in `cell` renderer of a column, leaving the other columns untouched */
export function withCellRenderer<Row>(column: ManageColumn<Row>): NaiveUI.TableColumn<Row> {
  const { cell, cellKey, onValue, ...rest } = column;

  if (!cell) return rest as unknown as NaiveUI.TableColumn<Row>;

  const key = cellKey ?? (rest as { key?: string }).key ?? '';

  return {
    ...rest,
    render: (row: Row) => {
      const record = row as Record<string, unknown>;
      const value = record[key];

      if (cell === 'boolean') return renderBooleanTag(value);

      // the backend writes an enum field twice: `state` holds the text (启用), `stateEnum` the enum
      // name (ON); the tag must read the enum name, so prefer it whenever the row carries it
      return renderEnabledTag(record[`${key}Enum`] ?? value, onValue);
    }
  } as unknown as NaiveUI.TableColumn<Row>;
}
