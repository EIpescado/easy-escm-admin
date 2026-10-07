import type { AxiosHeaderValue, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ResponseType } from './type';

export function getContentType(config: InternalAxiosRequestConfig) {
  const contentType: AxiosHeaderValue = config.headers?.['Content-Type'] || 'application/json';

  return contentType;
}

/**
 * check if http status is success
 *
 * @param status
 */
export function isHttpSuccess(status: number) {
  const isSuccessCode = status >= 200 && status < 300;
  return isSuccessCode || status === 304;
}

/**
 * is response json
 *
 * @param response axios response
 */
export function isResponseJson(response: AxiosResponse) {
  const { responseType } = response.config;

  return responseType === 'json' || responseType === undefined;
}

/**
 * Parse a JSON string while keeping integers that are unsafe in JS (e.g. backend Long ids) as strings.
 *
 * `JSON.parse` silently rounds integers beyond `Number.MAX_SAFE_INTEGER`, which corrupts Long ids.
 * The unsafe integer literals are therefore quoted before parsing so they survive as strings.
 *
 * @param text raw JSON text
 */
export function parseJson(text: string): unknown {
  let output = '';
  let inString = false;
  let escaped = false;
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (inString) {
      output += char;

      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;

      index += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }

    // outside a string, a `-` or a digit starts a number literal
    if (char === '-' || (char >= '0' && char <= '9')) {
      let end = index;

      if (text[end] === '-') end += 1;
      while (end < text.length && text[end] >= '0' && text[end] <= '9') end += 1;

      let isInteger = true;

      if (text[end] === '.') {
        isInteger = false;
        end += 1;
        while (end < text.length && text[end] >= '0' && text[end] <= '9') end += 1;
      }

      if (text[end] === 'e' || text[end] === 'E') {
        isInteger = false;
        end += 1;
        if (text[end] === '+' || text[end] === '-') end += 1;
        while (end < text.length && text[end] >= '0' && text[end] <= '9') end += 1;
      }

      const literal = text.slice(index, end);

      output += isInteger && !Number.isSafeInteger(Number(literal)) ? `"${literal}"` : literal;
      index = end;
      continue;
    }

    output += char;
    index += 1;
  }

  return JSON.parse(output);
}

export async function transformResponse(response: AxiosResponse) {
  const responseType: ResponseType = (response.config?.responseType as ResponseType) || 'json';

  if (responseType === 'json') {
    transformJsonToObject(response);
    return;
  }

  const isJson = (response.headers['content-type'] as string)?.includes('application/json');
  if (!isJson) return;

  if (responseType === 'blob') {
    await transformBlobToJson(response);
  }

  if (responseType === 'arrayBuffer') {
    await transformArrayBufferToJson(response);
  }
}

/** parse the raw json text into an object, keeping unsafe integers as strings */
export function transformJsonToObject(response: AxiosResponse) {
  const { data } = response;

  if (typeof data !== 'string' || !data) return;

  try {
    response.data = parseJson(data);
  } catch {}
}

export async function transformBlobToJson(response: AxiosResponse) {
  try {
    let data = response.data;

    if (typeof data === 'string') {
      data = parseJson(data);
    }

    if (Object.prototype.toString.call(data) === '[object Blob]') {
      const json = await data.text();
      data = parseJson(json);
    }

    response.data = data;
  } catch {}
}

export async function transformArrayBufferToJson(response: AxiosResponse) {
  try {
    let data = response.data;

    if (typeof data === 'string') {
      data = parseJson(data);
    }

    if (Object.prototype.toString.call(data) === '[object ArrayBuffer]') {
      const json = new TextDecoder().decode(data);
      data = parseJson(json);
    }

    response.data = data;
  } catch {}
}
