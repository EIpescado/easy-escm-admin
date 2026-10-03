import { localStg } from './storage';

/** Persisted column check state of a table */
export interface TableColumnSetting {
  key: string;
  checked: boolean;
  fixed: 'left' | 'right' | 'unFixed';
}

/** Persisted sort rule of a table */
export interface TableOrderSetting {
  prop: string;
  asc?: boolean;
}

/** Persisted settings of a table */
export interface TableSetting {
  /** Column check state, the array order is the column order */
  columns?: TableColumnSetting[];
  /** Custom sort rules, applied in order */
  orders?: TableOrderSetting[];
}

/**
 * Get the persisted settings of a table
 *
 * @param key unique table key, e.g. the route name
 */
export function getTableSetting(key: string): TableSetting | undefined {
  return localStg.get('tableSettings')?.[key];
}

/**
 * Patch and persist the settings of a table
 *
 * @param key unique table key, e.g. the route name
 * @param setting the partial settings to merge
 */
export function setTableSetting(key: string, setting: TableSetting) {
  const settings = localStg.get('tableSettings') ?? {};

  settings[key] = { ...settings[key], ...setting };

  localStg.set('tableSettings', settings);
}
