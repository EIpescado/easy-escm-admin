import type { AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';

/** read a blob slice as an ArrayBuffer, letting the event loop breathe between slices */
function readSlice(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer), { once: true });
    reader.addEventListener('error', () => reject(reader.error), { once: true });
    reader.readAsArrayBuffer(blob);
  });
}

/** slice size while hashing: small enough to keep the UI responsive */
const HASH_SLICE_SIZE = 4 * 1024 * 1024;

/**
 * Compute the MD5 (hex) of a file without blocking the main thread
 *
 * The backend uses this value as the `identifier` of a chunked upload: it keys both the resume
 * records and the instant-upload (`秒传`) index, so it must be the real MD5 of the content.
 *
 * @param file the file (or blob) to hash
 * @param onProgress called with a 0-100 percentage while hashing
 */
export async function getFileMd5(file: Blob, onProgress?: (percent: number) => void) {
  const hasher = CryptoJS.algo.MD5.create();
  const total = file.size || 1;

  for (let start = 0; start < file.size; start += HASH_SLICE_SIZE) {
    const buffer = await readSlice(file.slice(start, start + HASH_SLICE_SIZE));
    hasher.update(CryptoJS.lib.WordArray.create(new Uint8Array(buffer)));
    onProgress?.(Math.min(100, Math.round(((start + buffer.byteLength) / total) * 100)));
  }

  return hasher.finalize().toString(CryptoJS.enc.Hex);
}

/**
 * Format a byte count as a human readable size, e.g. `1.5 MB`
 *
 * The backend serializes `Long` as a string (global `WriteLongAsString`), so the size usually
 * arrives as a numeric string.
 */
export function formatFileSize(size?: number | string | null) {
  const raw = typeof size === 'string' ? size.trim() : size;

  if (raw === null || raw === undefined || raw === '') return '-';

  const bytes = Number(raw);

  if (Number.isNaN(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Read the download file name from the `content-disposition` header
 *
 * @param response the raw axios response
 * @param fallback used when the header is missing
 */
export function getDownloadFileName(response?: AxiosResponse, fallback = `download-${Date.now()}`) {
  const disposition = response?.headers?.['content-disposition'] as string | undefined;
  const matched = disposition
    ?.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)?.[1]
    ?.replace(/"/g, '')
    .trim();

  if (!matched) return fallback;

  try {
    return decodeURIComponent(matched.replace(/\+/g, ' '));
  } catch {
    return matched;
  }
}

/**
 * Trigger a browser download for a blob
 */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
