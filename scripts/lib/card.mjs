// A pool card: the plain file that tells one seat — a maker, a judge or an audience — its one job, what it
// may read and must never read, how it works and what it returns (spec § 7). This is the contract every
// card keeps, the kit's own and a project's: pool/CARD-FORMAT.md says it in words, and a test holds the two
// to each other.
//
// validateCard(text, { file }) → every fault, the header's first, then the body's; [] when the card is
// valid. `file` is the card's path under pool/, as makers/structure-describer.md: with it, the shelf must
// be the folder's and the id the file's name.
import { FrontmatterError, parse } from './frontmatter.mjs';
import { SIZES, STAGES } from './state.mjs';

// Every key of the header, in the format's order. All are required, and no other is allowed.
export const CARD_KEYS = Object.freeze([
  'id', 'shelf', 'job', 'sits-at', 'cast-when', 'presets', 'loaded-with', 'reads', 'never-reads', 'engine',
  'suggested-model', 'suggested-effort', 'verified',
]);
export const SHELVES = Object.freeze(['maker', 'judge', 'audience']);
// The folder of pool/ that holds each shelf.
export const FOLDERS = Object.freeze({ makers: 'maker', judges: 'judge', audiences: 'audience' });
export const LOADED_WITH = Object.freeze(['profile', 'person', 'none']);
// Models by family alias, never by version; `none` is a seat with no suggestion.
export const MODELS = Object.freeze(['fable', 'opus', 'sonnet', 'haiku', 'none']);
export const EFFORTS = Object.freeze(['low', 'medium', 'high', 'xhigh', 'max', 'none']);
// What an engine is written as. model:any serves whichever provider the project's profile turns on.
export const ENGINE_FORMS = Object.freeze(['own', 'skill:<name>', 'model:any', 'tool:<name>']);
// The body's sections, in order; a judge's two come first.
export const SECTIONS = Object.freeze(['Method', 'Output', 'Never', 'Borrowed']);
export const JUDGE_SECTIONS = Object.freeze(['Core checks', 'Optional checks']);
export const CHECK_COLUMNS = Object.freeze(['id', 'trigger', 'method']);

const ENGINE = /^(?:own|skill:[a-z0-9:_-]+|model:any|tool:[a-z0-9-]+)$/;
const NAME = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';
const ID = new RegExp(`^(${SHELVES.join('|')})\\.(${NAME})$`);
const FILE = new RegExp(`^(${Object.keys(FOLDERS).join('|')})/(${NAME})\\.md$`);
const CORE_CHECKS = { least: 2, most: 6 };
const HEADING = /^## +(.*\S)\s*$/;
const FENCE = /^ {0,3}(?:```|~~~)/;
// A top-level list item, bulleted or numbered. A nested one is indented, and belongs to the item above it.
const LIST_ITEM = /^(?:[-*+]|\d+[.)])[ \t]+\S/;
const DASHES = /^:?-+:?$/;

const isText = value => typeof value === 'string' && value.trim() !== '';
const show = value => JSON.stringify(value);

export function validateCard(text, { file } = {}) {
  const errors = [];
  const place = placeOf(file, errors);

  let data;
  let body;
  try {
    ({ data, body } = parse(text));
  } catch (e) {
    if (!(e instanceof FrontmatterError)) throw e;
    return [...errors, `header: ${e.message}`];
  }
  // Without a header it is not a card yet: one fault, and the body waits.
  if (Object.keys(data).length === 0) {
    return [...errors, 'header: a card opens with its header, the keys of the format between two "---" lines'];
  }
  checkHeader(data, place, errors);
  // A shelf that cannot be read is taken from the folder; with neither, the card is not held to a judge's sections.
  const shelf = SHELVES.includes(data.shelf) ? data.shelf : place?.shelf;
  checkBody(body, shelf === 'judge', errors);
  return errors;
}

// Where the card is: the shelf of its folder and its name, from its path under pool/.
function placeOf(file, errors) {
  if (file === undefined) return undefined;
  const match = FILE.exec(String(file).replace(/\\/g, '/'));
  if (match) return { folder: match[1], shelf: FOLDERS[match[1]], name: match[2] };
  errors.push(`file: a card is ${Object.keys(FOLDERS).map(folder => `${folder}/<name>.md`).join(', ')}, the name in lower-case words joined by hyphens; this is ${show(file)}`);
  return undefined;
}

function checkHeader(data, place, errors) {
  const fail = message => {
    errors.push(`header: ${message}`);
  };
  const oneOf = (key, allowed) => {
    if (!allowed.includes(data[key])) fail(`"${key}" must be one of ${allowed.join(', ')}; it is ${show(data[key])}`);
  };
  const line = key => {
    if (!isText(data[key])) fail(`"${key}" must be one line of text; it is ${show(data[key])}`);
  };
  // A list whose every item is one of `allowed`, each called a `what`; `least` is how many it must hold.
  const list = (key, { least, what, allowed }) => {
    const items = data[key];
    if (!Array.isArray(items)) return fail(`"${key}" must be a list, as [a, b]; it is ${show(items)}`);
    if (items.length < least) return fail(`"${key}" must name at least one ${what}`);
    for (const item of items) {
      if (!isText(item)) fail(`"${key}" has an empty item`);
      else if (allowed && !allowed.includes(item)) fail(`"${key}" names ${show(item)}, which is not a ${what} (${allowed.join(', ')})`);
    }
  };

  const checks = {
    id: () => checkId(data, place, fail),
    shelf: () => {
      oneOf('shelf', SHELVES);
      if (place && SHELVES.includes(data.shelf) && data.shelf !== place.shelf) {
        fail(`"shelf" is ${data.shelf}, but the card is in ${place.folder}/, the ${place.shelf} shelf`);
      }
    },
    job: () => line('job'),
    'sits-at': () => list('sits-at', { least: 1, what: 'stage', allowed: STAGES }),
    'cast-when': () => line('cast-when'),
    presets: () => list('presets', { least: 0, what: 'size', allowed: SIZES }),
    'loaded-with': () => oneOf('loaded-with', LOADED_WITH),
    reads: () => list('reads', { least: 1, what: 'thing' }),
    'never-reads': () => list('never-reads', { least: 0, what: 'thing' }),
    engine: () => {
      if (typeof data.engine !== 'string' || !ENGINE.test(data.engine)) {
        fail(`"engine" must be ${ENGINE_FORMS.slice(0, -1).join(', ')} or ${ENGINE_FORMS.at(-1)}; it is ${show(data.engine)}`);
      }
    },
    'suggested-model': () => oneOf('suggested-model', MODELS),
    'suggested-effort': () => oneOf('suggested-effort', EFFORTS),
    verified: () => {
      if (!isDate(data.verified)) fail(`"verified" must be a date written YYYY-MM-DD; it is ${show(data.verified)}`);
    },
  };
  for (const key of CARD_KEYS) {
    if (!Object.hasOwn(data, key)) fail(`"${key}" is missing`);
    else checks[key]();
  }
  for (const key of Object.keys(data)) {
    if (!CARD_KEYS.includes(key)) fail(`unknown key "${key}"`);
  }
}

// An id is <shelf>.<name>: the shelf the header gives, and the name of the file.
function checkId(data, place, fail) {
  const match = typeof data.id === 'string' ? ID.exec(data.id) : null;
  if (!match) {
    return fail(`"id" must be <shelf>.<name>, the shelf one of ${SHELVES.join(', ')} and the name in lower-case words joined by hyphens, as maker.structure-describer; it is ${show(data.id)}`);
  }
  const [, shelf, name] = match;
  if (SHELVES.includes(data.shelf) && shelf !== data.shelf) fail(`"id" is on the ${shelf} shelf, but "shelf" is ${data.shelf}`);
  if (place && name !== place.name) {
    fail(`"id" names "${name}", but the file is ${place.folder}/${place.name}.md: it must be ${place.shelf}.${place.name}`);
  }
}

// A date that exists, written YYYY-MM-DD: the calendar is asked and must give the same text back, so the
// 30th of February is refused, and so is any other way of writing a day, and anything that is not text.
function isDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function checkBody(body, isJudge, errors) {
  const fail = message => {
    errors.push(`body: ${message}`);
  };
  const order = isJudge ? [...JUDGE_SECTIONS, ...SECTIONS] : SECTIONS;
  const sections = sectionsOf(body);

  const first = new Map();
  for (const section of sections) {
    const { name } = section;
    if (first.has(name)) fail(`"## ${name}" appears twice`);
    else if (order.includes(name)) first.set(name, section);
    else if (JUDGE_SECTIONS.includes(name)) fail(`"## ${name}" belongs to a judge card`);
    else fail(`"## ${name}" is not a section of a card (${order.join(', ')})`);
  }
  for (const name of order) {
    if (!first.has(name)) fail(`"## ${name}" is missing`);
  }
  // The sections that are there, as they come and as the format orders them.
  const found = [...first.keys()];
  const wanted = order.filter(name => first.has(name));
  if (found.join('\n') !== wanted.join('\n')) fail(`the sections are out of order: ${found.join(', ')}; the order is ${order.join(', ')}`);

  for (const name of wanted) {
    const { lines } = first.get(name);
    if (lines.every(line => line.trim() === '')) fail(`"## ${name}" has nothing under it`);
    else if (name === 'Core checks') checkCore(lines, fail);
    else if (name === 'Optional checks') checkOptional(lines, fail);
  }
}

// The body's `## ` sections, each with the lines under it. A line inside a code fence is never a heading.
function sectionsOf(body) {
  const sections = [];
  let fenced = false;
  for (const line of body.split('\n')) {
    if (FENCE.test(line)) fenced = !fenced;
    const heading = fenced ? null : HEADING.exec(line);
    if (heading) sections.push({ name: heading[1], lines: [] });
    else sections.at(-1)?.lines.push(line);
  }
  return sections;
}

function checkCore(lines, fail) {
  const count = lines.filter(line => LIST_ITEM.test(line)).length;
  if (count < CORE_CHECKS.least || count > CORE_CHECKS.most) {
    fail(`"## Core checks" has ${count} check${count === 1 ? '' : 's'}; a judge has two to six, as a numbered or bulleted list`);
  }
}

// A table row as its cells, each trimmed; a bar written \| does not end its cell.
const cellsOf = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim());

// The optional checks are one table: its header row, a line of dashes, then a row for each check, or none.
function checkOptional(lines, fail) {
  const columns = CHECK_COLUMNS.join(', ');
  const [header, dashes, ...rows] = lines.filter(line => line.trim().startsWith('|')).map(cellsOf);
  if (!header) return fail(`"## Optional checks" needs a table with the columns ${columns} (it may have no rows)`);
  if (header.join('\n') !== CHECK_COLUMNS.join('\n')) {
    return fail(`the table of "## Optional checks" must have the columns ${columns}; it has ${header.join(', ')}`);
  }
  if (!dashes || dashes.length !== CHECK_COLUMNS.length || !dashes.every(cell => DASHES.test(cell))) {
    return fail('the table of "## Optional checks" needs a line of dashes under its header row');
  }
  rows.forEach((row, i) => {
    const at = `"## Optional checks" row ${i + 1}`;
    if (row.length !== CHECK_COLUMNS.length) return fail(`${at} has ${row.length} cells; a row is ${columns}`);
    row.forEach((cell, c) => cell === '' && fail(`${at}: the ${CHECK_COLUMNS[c]} is empty`));
  });
}
