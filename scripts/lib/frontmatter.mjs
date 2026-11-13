// Flat frontmatter: the header of stage outputs, pool cards and a project's profile.
// Its limits: one `key: value` per line between two `---` lines, keys ^[a-z][a-z0-9-]*$; a value is a
// string, a whole number or an inline list `[a, b]` of strings; nothing nested; no escapes (quotes only
// wrap a value, so a list item cannot hold a `"`); an unquoted list item cannot hold `[` or `]` (quote it).

export class FrontmatterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FrontmatterError';
  }
}

const FENCE = '---';
const KEY_GRAMMAR = '[a-z][a-z0-9-]*';
const KEY = new RegExp(`^${KEY_GRAMMAR}$`);
const ENTRY = new RegExp(`^(${KEY_GRAMMAR}):(.*)$`);
const DIGITS = /^\d+$/;
const INDENTED = /^[ \t]/;

const toLf = text => text.replace(/\r\n/g, '\n');
const isFence = line => line.trimEnd() === FENCE;
const isQuoted = s => s.length >= 2 && s.startsWith('"') && s.endsWith('"');
const unquote = s => (isQuoted(s) ? s.slice(1, -1) : s);

export function parse(text) {
  const lf = toLf(text.replace(/^\uFEFF/, ''));
  const lines = lf.split('\n');
  if (!isFence(lines[0])) return { data: {}, body: lf };

  const close = lines.findIndex((line, i) => i > 0 && isFence(line));
  if (close === -1) throw new FrontmatterError('line 1: the frontmatter opened here is never closed by a "---" line');

  const data = {};
  for (let i = 1; i < close; i++) {
    if (lines[i].trim() === '') continue;
    const at = `line ${i + 1}`;
    const match = ENTRY.exec(lines[i]);
    if (!match) {
      throw new FrontmatterError(`${at}: expected "key: value" on one line, a lower-case kebab key, lists inline as [a, b]; frontmatter is flat, nothing nested`);
    }
    const [, key, raw] = match;
    const value = raw.trim();
    const next = lines[i + 1];
    if (value === '' && INDENTED.test(next) && next.trim() !== '') {
      throw new FrontmatterError(`${at}: "${key}" has a nested value below it; frontmatter is flat, so write the value on this line (lists inline as [a, b])`);
    }
    if (Object.hasOwn(data, key)) throw new FrontmatterError(`${at}: "${key}" appears twice`);
    data[key] = readValue(value, at, key);
  }
  return { data, body: lines.slice(close + 1).join('\n') };
}

function readValue(value, at, key) {
  if (value.startsWith('[') && value.endsWith(']')) return readList(value.slice(1, -1), at);
  if (isQuoted(value)) return unquote(value);
  if (!DIGITS.test(value)) return value;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || String(number) !== value) {
    throw new FrontmatterError(`${at}: "${key}" cannot be a number as written (a leading zero, or above ${Number.MAX_SAFE_INTEGER}); quote it to keep it as text: ${key}: "${value}"`);
  }
  return number;
}

// Splits on commas outside double quotes, so a quoted item may hold a comma.
function readList(inner, at) {
  if (inner.trim() === '') return [];
  const items = [];
  let item = '';
  let quoted = false;
  for (const ch of inner) {
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) {
      items.push(item);
      item = '';
    } else {
      item += ch;
    }
  }
  if (quoted) throw new FrontmatterError(`${at}: a double quote in the list is never closed`);
  items.push(item);
  return items.map(raw => readItem(raw.trim(), at));
}

// A quote may only wrap a whole item; an item is never empty unless written as ""; and only a quoted
// item may hold a bracket, so text such as `[a] and [b]` is refused rather than read as a list.
function readItem(item, at) {
  const text = unquote(item);
  if (text.includes('"')) {
    throw new FrontmatterError(`${at}: list item ${item} has a double quote that does not wrap the whole item; the format has no escapes`);
  }
  if (item === '') throw new FrontmatterError(`${at}: the list has an empty item; remove the extra comma, or write "" for an empty string`);
  if (!isQuoted(item) && /[[\]]/.test(item)) {
    throw new FrontmatterError(`${at}: list item ${item} holds a bracket; quote the item, or quote the whole value if it is not a list`);
  }
  return text;
}

export function serialize(data, body = '') {
  const lines = Object.entries(data).map(([key, value]) => {
    if (!KEY.test(key)) throw new FrontmatterError(`key "${key}" must match ${KEY.source}`);
    return `${key}: ${writeValue(key, value)}`;
  });
  return [FENCE, ...lines, FENCE, ''].join('\n') + toLf(body);
}

function writeValue(key, value) {
  if (Array.isArray(value)) return `[${value.map(item => writeItem(key, item)).join(', ')}]`;
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value >= 0) return String(value);
    throw new FrontmatterError(`"${key}": a number must be a whole number of zero or more`);
  }
  return writeString(key, value);
}

// A list is split on commas outside quotes, with no escapes: an item holding a quote cannot be written.
function writeItem(key, item) {
  if (typeof item === 'string' && item.includes('"')) throw new FrontmatterError(`"${key}": a list item cannot hold a double quote`);
  return writeString(key, item, itemNeedsQuotes);
}

function writeString(key, s, quoteWhen = needsQuotes) {
  if (typeof s !== 'string') throw new FrontmatterError(`"${key}": a value is a string, a whole number or a list of strings`);
  if (/[\r\n\u2028\u2029]/.test(s)) throw new FrontmatterError(`"${key}": a value must fit on one line`);
  return quoteWhen(s) ? `"${s}"` : s;
}

// The brief's four characters, plus every string that would not read back as itself unquoted.
const needsQuotes = s => /[:#\[,]/.test(s) || s === '' || DIGITS.test(s) || s !== s.trim() || s.startsWith('"');
// A list item also needs them for a `]`, which only a quoted item may hold (see readItem).
const itemNeedsQuotes = s => needsQuotes(s) || s.includes(']');
