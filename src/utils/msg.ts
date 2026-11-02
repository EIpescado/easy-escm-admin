/** One message rendered from the JSON stored in `system_msg_content.content` */
export interface MsgContent {
  /** title of the pushed template */
  title: string;
  /** secondary title of the pushed template */
  subTitle: string;
  /** one `label: value` line per parameter, the remark included */
  lines: string[];
}

/** the `Msg` object a template push stores as the message content */
interface MsgPayload {
  title?: string | null;
  subTitle?: string | null;
  remark?: string | null;
  entryList?: { label?: string | null; prop?: string | null; val?: string | null }[] | null;
}

/**
 * Parse the message content
 *
 * A message stores the whole pushed `Msg` as JSON (`system_msg_content.content`), so the drawer and
 * the list show its title, parameters and remark instead of the raw JSON. Content that is not JSON
 * is returned as a single line.
 */
export function parseMsgContent(raw: string | null | undefined): MsgContent {
  const text = (raw ?? '').trim();

  if (!text) return { title: '', subTitle: '', lines: [] };

  let payload: MsgPayload;

  try {
    payload = JSON.parse(text) as MsgPayload;
  } catch {
    return { title: '', subTitle: '', lines: [text] };
  }

  if (!payload || typeof payload !== 'object') return { title: '', subTitle: '', lines: [text] };

  const lines = (payload.entryList ?? [])
    .map(entry => {
      const label = (entry.label || entry.prop || '').trim();
      const value = (entry.val ?? '').toString().trim();

      if (!value) return '';

      return label ? `${label}: ${value}` : value;
    })
    .filter(Boolean);

  const remark = (payload.remark ?? '').trim();

  if (remark) lines.push(remark);

  return {
    title: (payload.title ?? '').trim(),
    subTitle: (payload.subTitle ?? '').trim(),
    lines
  };
}

/** One-line summary of a message, for a list cell */
export function formatMsgContent(raw: string | null | undefined): string {
  const { title, subTitle, lines } = parseMsgContent(raw);

  return [title, subTitle, ...lines].filter(Boolean).join('，');
}
