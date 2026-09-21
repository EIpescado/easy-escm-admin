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
