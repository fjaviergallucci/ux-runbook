// Flat frontmatter: the header of stage outputs, pool cards and a project's profile.
// Its limits: one `key: value` per line between two `---` lines, keys ^[a-z][a-z0-9-]*$; a value is a
// string, a whole number or an inline list `[a, b]` of strings; nothing nested.
// The grammar is a subset of YAML: a header that serialize writes is one a YAML reader takes too, with the
// same text in every string (it may take a plain `true`, `null`, `1.5` or a date for more than text; here
// they are text). A string is written plain, or in one of two quoted forms, with no escapes in either but
// the one named:
//   in double quotes   "sí, continúa"         the value as it is; never one that holds a `"` or a `\`
//   in single quotes   'he said "it''s so"'   for a value that holds a `"`, or a `\` and needs quotes: the
//                                             value as it is, each single quote inside it doubled
// A value is quoted when plain it would read as something else, here or in YAML: one that holds `:`, `#`,
// `[`, `,`, `"` or a tab; is empty, all digits, `=` or `<<`, or padded with spaces; or opens with a mark
// YAML gives a meaning. A list item is quoted for a `]`, a brace or a `?` too.
// A list item has the first form only, so it cannot hold a `"`, and one that needs quotes and holds a `\`
// is not YAML's; an unquoted list item cannot hold `[` or `]` (quote it).
// parse also reads what was written before there were two forms: double quotes wrap a value as it is,
// whatever it holds; and a single quote that does not wrap the whole value, each one inside it doubled,
// is part of the value.

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
// In single quotes: wrapped in them, and every single quote inside is one of a pair.
const isSingleQuoted = s => s.length >= 2 && s.startsWith("'") && s.endsWith("'") && !s.slice(1, -1).replace(/''/g, '').includes("'");

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
  if (isSingleQuoted(value)) return value.slice(1, -1).replace(/''/g, "'");
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

// A list is split on commas outside double quotes, with no escapes: an item holding one cannot be written.
function writeItem(key, item) {
  if (typeof item === 'string' && item.includes('"')) throw new FrontmatterError(`"${key}": a list item cannot hold a double quote`);
  return writeString(key, item, itemNeedsQuotes, inDoubleQuotes);
}

function writeString(key, s, quoteWhen = needsQuotes, quote = inQuotes) {
  if (typeof s !== 'string') throw new FrontmatterError(`"${key}": a value is a string, a whole number or a list of strings`);
  if (/[\r\n\u2028\u2029]/.test(s)) throw new FrontmatterError(`"${key}": a value must fit on one line`);
  return quoteWhen(s) ? quote(s) : s;
}

// The two quoted forms. YAML reads a backslash inside double quotes as an escape, and a double quote as
// their end: a value that holds either goes in single quotes, where only the single quote is doubled.
const inDoubleQuotes = s => `"${s}"`;
const inQuotes = s => (/["\\]/.test(s) ? `'${s.replace(/'/g, "''")}'` : inDoubleQuotes(s));

// The marks YAML reads at the start of a value as something other than text: a quote, an anchor, an alias,
// a tag, a block, a directive, a reserved mark, a flow bracket; and a dash or a question mark on its own.
const YAML_OPENS = /^(?:['&*!|>%@`{}\]]|[-?](?: |$))/;
// Two values YAML 1.1 keeps for itself, and a reader of it refuses as text.
const YAML_WORDS = ['=', '<<'];
// The brief's four characters, plus every string that would not read back as itself unquoted, here or in
// YAML: a double quote anywhere puts the value in single quotes.
const needsQuotes = s => /[:#\[,"\t]/.test(s) || s === '' || DIGITS.test(s) || s !== s.trim() || YAML_OPENS.test(s) || YAML_WORDS.includes(s);
// A list item also needs them for a `]`, which only a quoted item may hold (see readItem), and for a brace
// or a question mark, which YAML reads inside a list as the edge or the key of a map.
const itemNeedsQuotes = s => needsQuotes(s) || /[\]{}?]/.test(s);
