// A pool card: the plain file that tells one seat — a maker, a judge or an audience — its one job, what it
// may read and must never read, how it works and what it returns (spec § 7). This is the contract every
// card keeps, the kit's own and a project's: pool/CARD-FORMAT.md says it in words, and a test holds the two
// to each other.
//
// validateCard(text, { file }) → every fault, the header's first, then the body's; [] when the card is
// valid. `file` is the card's path under pool/, as makers/structure-describer.md: with it, the shelf must
// be the folder's and the id the file's name.
//
// A person is a card of another kind: someone in a moment (spec § 8), whom the makers design for and an
// audience is seated as. validatePerson(text, { file }) reports the same way; `file` is persons/<name>.md.
//
// A profession's profile is a third: what is true of a profession, written from
// templates/people/PROFILE-CARD.md, a test holding the two to each other. validateProfile(text, { file })
// reports the same way; `file` is profiles/<name>.md. traitsOf(text, { file }) → { faults, copy, fields,
// paragraphs }: the audience's copy of a profile, its traits without what a judge holds a design to; the
// copy is null, with the faults, for a profile that fails its check or a copy that still says a criterion.
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
// What every judge is blind to: the makers' reasoning, who made what, and the other judges' ledgers (spec § 9).
export const JUDGE_BLIND = Object.freeze(['maker-notes', 'author-map', 'other-ledgers']);

// A person card: the folder of pool/ that holds the people, every key of the header (all required, and no
// other allowed), what a card can rest on, and the body's sections in order.
export const PERSON_FOLDER = 'persons';
export const PERSON_KEYS = Object.freeze(['id', 'profile', 'specialty', 'evidence']);
export const EVIDENCE = Object.freeze(['fact', 'guess', 'mixed']);
export const PERSON_SECTIONS = Object.freeze(['The moment', 'The job', 'What she never does', 'The check']);

// A profession's profile: the folder of pool/ that holds them, the one key of the header, the seven
// characteristics every profile defines, in order, the two sections that close it, and the four fields of a
// characteristic by their labels. The last field is the criterion: what a profile judge holds a design to,
// and what an audience is never handed.
export const PROFILE_FOLDER = 'profiles';
export const PROFILE_KEYS = Object.freeze(['id']);
export const CHARACTERISTICS = Object.freeze(['Scope', 'The work', 'Technological familiarity', 'Usage context', 'Time and attention', 'Error tolerance and stakes', 'Domain vocabulary']);
export const PROFILE_CLOSING = Object.freeze(['Specialties', 'Optional characteristics']);
export const FIELDS = Object.freeze(['What is true', 'Who it does not hold for', 'Evidence', 'So the interface must']);
export const CRITERION = FIELDS.at(-1);

// A skill is written as it is installed: its own name, or its plugin, a colon and its name.
const SKILL = '[a-z0-9][a-z0-9_-]*';
const ENGINE = new RegExp(`^(?:own|skill:${SKILL}(?::${SKILL})?|model:any|tool:[a-z0-9-]+)$`);
const NAME = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';
const ID = new RegExp(`^(${SHELVES.join('|')})\\.(${NAME})$`);
const FILE = new RegExp(`^(${Object.keys(FOLDERS).join('|')})/(${NAME})\\.md$`);
// A person's id and file, and the profile she inherits: each a word, a dot or a folder, and a name.
const PERSON_ID = new RegExp(`^person\\.(${NAME})$`);
const PERSON_FILE = new RegExp(`^${PERSON_FOLDER}/(${NAME})\\.md$`);
const PROFILE_ID = new RegExp(`^profile\\.(${NAME})$`);
const PROFILE_FILE = new RegExp(`^${PROFILE_FOLDER}/(${NAME})\\.md$`);
// A field's label as it is written: the words and a colon, at the start of a line.
const labelOf = field => `${field}:`;
// A heading of any level, which ends whatever block stands above it.
const ANY_HEADING = /^#{1,6} /;
// A specialty and a characteristic of it, under "Specialties".
const SPECIALTY = /^### +(.*\S)\s*$/;
const SPECIALTY_CHARACTERISTIC = /^#### +(.*\S)\s*$/;
// The words by which a paragraph of a profile's opening speaks of the fields themselves, and those no
// copy for an audience may hold, in any case.
const OF_THE_FIELDS = /\bfourth field\b|\bfour fields\b/i;
const CRITERION_WORDS = /so the interface must/i;
// The value that says there is none: no profile, no specialty.
const NONE = 'none';
const CORE_CHECKS = { least: 2, most: 6 };
// The written forms, stricter than Markdown's, and the words an error gives for each.
const HEADING = /^## +(.*\S)\s*$/;
const HEADING_FORM = 'a section\'s heading is two hashes, a space, the name, and nothing else on the line';
const ROW_FORM = `a table row begins and ends with a pipe, as | ${CHECK_COLUMNS.join(' | ')} |`;
// A fence line: up to three spaces, three or more backticks or tildes, and whatever follows them.
const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
// A list item, bulleted or numbered, up to three spaces in. What is matched ends where its text starts.
const LIST_ITEM = /^( {0,3})(?:[-*+]|\d+[.)])[ \t]+(?=\S)/;
const PIPE = /(?<!\\)\|/;
const CLOSING_PIPE = /(?<!\\)\|$/;
const DASHES = /^:?-+:?$/;

const isText = value => typeof value === 'string' && value.trim() !== '';
const show = value => JSON.stringify(value);

export function validateCard(text, { file } = {}) {
  const errors = [];
  const place = placeOf(file, errors);
  const card = open(text, 'a card', errors);
  if (!card) return errors;
  const { data, body } = card;
  // A shelf that cannot be read is taken from the folder; with neither, the card is not held to what a judge keeps.
  const isJudge = (SHELVES.includes(data.shelf) ? data.shelf : place?.shelf) === 'judge';
  checkHeader(data, place, isJudge, errors);
  checkBody(body, isJudge, errors);
  return errors;
}

export function validatePerson(text, { file } = {}) {
  const errors = [];
  const name = personOf(file, errors);
  const card = open(text, 'a person card', errors);
  if (!card) return errors;
  checkPersonHeader(card.data, name, errors);
  checkSections(card.body, PERSON_SECTIONS, { what: 'a person card' }, message => {
    errors.push(`body: ${message}`);
  });
  return errors;
}

export function validateProfile(text, { file } = {}) {
  const errors = [];
  const name = profileOf(file, errors);
  const card = open(text, 'a profession\'s profile', errors);
  if (!card) return errors;
  checkProfileHeader(card.data, name, errors);
  checkProfileBody(card.body, errors);
  return errors;
}

// The audience's copy of a profile: the profile as it is, without each field of the criterion, from its
// label to the next blank line (or the next heading, or the end), and without each paragraph of its opening,
// before the first section, that speaks of the fields themselves: the template's own account of the format.
// The blank line above what is taken out goes with it. `fields` and `paragraphs` count what was taken out.
export function traitsOf(text, { file } = {}) {
  const refused = faults => ({ faults, copy: null, fields: 0, paragraphs: 0 });
  const faults = validateProfile(text, { file });
  if (faults.length > 0) return refused(faults);
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  const blank = i => lines[i].trim() === '';
  const out = new Set();
  // Takes out the lines from `from` up to `to`, and the blank lines above them.
  const take = (from, to) => {
    for (let i = from; i < to; i++) out.add(i);
    for (let i = from - 1; i >= 0 && blank(i); i--) out.add(i);
  };
  // Where a block that starts at `from` ends: at a blank line, a heading or the end.
  const endOf = from => {
    let to = from + 1;
    while (to < lines.length && !blank(to) && !ANY_HEADING.test(lines[to])) to++;
    return to;
  };
  let fields = 0;
  let paragraphs = 0;
  // The opening ends at the first section, which a sound profile has. The header above it is a block that
  // speaks of no field: an id holds no space.
  const opening = lines.findIndex(line => HEADING.test(line));
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(labelOf(CRITERION))) {
      const to = endOf(i);
      take(i, to);
      fields += 1;
      i = to - 1;
    } else if (i < opening && !blank(i) && !ANY_HEADING.test(lines[i])) {
      const to = endOf(i);
      // Read as one line, so that the words are found across a line's end.
      if (OF_THE_FIELDS.test(lines.slice(i, to).join(' '))) {
        take(i, to);
        paragraphs += 1;
      }
      i = to - 1;
    }
  }
  const kept = lines.filter((_, i) => !out.has(i));
  const left = kept.filter(line => CRITERION_WORDS.test(line));
  if (left.length > 0) {
    return refused(left.map(line => `copy: "${CRITERION.toLowerCase()}" is still written in ${show(line.trim())}: an audience is never handed what the interface must do`));
  }
  return { faults: [], copy: kept.join('\n'), fields, paragraphs };
}

// The header and the body of a text; `what` is the kind of card it should be. Without a header that can
// be read it is not a card yet: that is one fault, nothing is returned, and the body waits.
function open(text, what, errors) {
  let card;
  try {
    card = parse(text);
  } catch (e) {
    if (!(e instanceof FrontmatterError)) throw e;
    errors.push(`header: ${e.message}`);
    return null;
  }
  if (Object.keys(card.data).length > 0) return card;
  errors.push(`header: ${what} opens with its header, the keys of the format between two "---" lines`);
  return null;
}

// Where the card is: the shelf of its folder and its name, from its path under pool/.
function placeOf(file, errors) {
  if (file === undefined) return undefined;
  const match = FILE.exec(String(file).replace(/\\/g, '/'));
  if (match) return { folder: match[1], shelf: FOLDERS[match[1]], name: match[2] };
  errors.push(`file: a card is ${Object.keys(FOLDERS).map(folder => `${folder}/<name>.md`).join(', ')}, the name in lower-case words joined by hyphens; this is ${show(file)}`);
  return undefined;
}

// Where the person is: her name, from her card's path under pool/.
function personOf(file, errors) {
  if (file === undefined) return undefined;
  const match = PERSON_FILE.exec(String(file).replace(/\\/g, '/'));
  if (match) return match[1];
  errors.push(`file: a person card is ${PERSON_FOLDER}/<name>.md, the name in lower-case words joined by hyphens; this is ${show(file)}`);
  return undefined;
}

// Where the profile is: the profession's name, from its file's path under pool/.
function profileOf(file, errors) {
  if (file === undefined) return undefined;
  const match = PROFILE_FILE.exec(String(file).replace(/\\/g, '/'));
  if (match) return match[1];
  errors.push(`file: a profession's profile is ${PROFILE_FOLDER}/<name>.md, the name in lower-case words joined by hyphens; this is ${show(file)}`);
  return undefined;
}

// The rules a header's values are held to, each said through `fail` in the same words whatever the card.
function rulesOf(data, fail) {
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
  return { oneOf, line, list };
}

// Every key of `keys` is there and passes its check, in the format's order, and no other key is there.
function checkKeys(data, keys, checks, fail) {
  for (const key of keys) {
    if (!Object.hasOwn(data, key)) fail(`"${key}" is missing`);
    else checks[key]();
  }
  for (const key of Object.keys(data)) {
    if (!keys.includes(key)) fail(`unknown key "${key}"`);
  }
}

function checkHeader(data, place, isJudge, errors) {
  const fail = message => {
    errors.push(`header: ${message}`);
  };
  const { oneOf, line, list } = rulesOf(data, fail);

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
    'never-reads': () => {
      list('never-reads', { least: 0, what: 'thing' });
      // A list that cannot be read is one fault: what it lacks is said once it is a list.
      if (!isJudge || !Array.isArray(data['never-reads'])) return;
      for (const name of JUDGE_BLIND) {
        if (!data['never-reads'].includes(name)) {
          fail(`"never-reads" of a judge must hold "${name}": every judge is blind to ${JUDGE_BLIND.join(', ')}`);
        }
      }
    },
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
  checkKeys(data, CARD_KEYS, checks, fail);
}

// A person's header: who she is, the profile she inherits, her specialty of it, and what the card rests on.
function checkPersonHeader(data, name, errors) {
  const fail = message => {
    errors.push(`header: ${message}`);
  };
  const { oneOf } = rulesOf(data, fail);

  checkKeys(data, PERSON_KEYS, {
    // person.<name>, the name the file's.
    id: () => {
      const match = typeof data.id === 'string' ? PERSON_ID.exec(data.id) : null;
      if (!match) {
        return fail(`"id" must be person.<name>, the name in lower-case words joined by hyphens, as person.first-timer; it is ${show(data.id)}`);
      }
      if (name !== undefined && match[1] !== name) {
        fail(`"id" names "${match[1]}", but the file is ${PERSON_FOLDER}/${name}.md: it must be person.${name}`);
      }
    },
    profile: () => {
      if (data.profile !== NONE && !(typeof data.profile === 'string' && PROFILE_ID.test(data.profile))) {
        fail(`"profile" must be a profile's id, as profile.<name>, or ${NONE}; it is ${show(data.profile)}`);
      }
    },
    // A specialty is one of a profile: with no profile there is none. A profile that cannot be read is its own fault.
    specialty: () => {
      if (!isText(data.specialty)) return fail(`"specialty" must be a name, or ${NONE}; it is ${show(data.specialty)}`);
      if (data.profile === NONE && data.specialty !== NONE) {
        fail(`"specialty" must be ${NONE} when "profile" is ${NONE}: a person with no profession has no specialty; it is ${show(data.specialty)}`);
      }
    },
    evidence: () => oneOf('evidence', EVIDENCE),
  }, fail);
}

// A profile's header: its id, profile.<name>, the name the file's. It holds nothing else.
function checkProfileHeader(data, name, errors) {
  const fail = message => {
    errors.push(`header: ${message}`);
  };
  checkKeys(data, PROFILE_KEYS, {
    id: () => {
      const match = typeof data.id === 'string' ? PROFILE_ID.exec(data.id) : null;
      if (!match) {
        return fail(`"id" must be profile.<name>, the name in lower-case words joined by hyphens, as profile.front-desk-coordinator; it is ${show(data.id)}`);
      }
      if (name !== undefined && match[1] !== name) {
        fail(`"id" names "${match[1]}", but the file is ${PROFILE_FOLDER}/${name}.md: it must be profile.${name}`);
      }
    },
  }, fail);
}

// A profile's body: the seven characteristics, then any the project added, then the two closing sections;
// each characteristic, and each one of a specialty, with its four fields; and the criterion's label nowhere
// but at the start of a line, since that is the rule an audience's copy is made by.
function checkProfileBody(body, errors) {
  const fail = message => {
    errors.push(`body: ${message}`);
  };
  const fixed = [...CHARACTERISTICS, ...PROFILE_CLOSING];
  const added = [...new Set(sectionsOf(body).map(section => section.name).filter(name => !fixed.includes(name)))];
  checkSections(body, [...CHARACTERISTICS, ...added, ...PROFILE_CLOSING], {
    what: 'a profession\'s profile',
    inside: (name, lines) => {
      if (name === 'Specialties') checkSpecialties(lines, fail);
      else if (!PROFILE_CLOSING.includes(name)) checkFields(lines, `"## ${name}"`, fail);
    },
  }, fail);
  const label = labelOf(CRITERION);
  for (const line of body.split('\n')) {
    if (line.lastIndexOf(label) > 0) fail(`"${label}" is not at the start of its line in ${show(line.trim())}: the field would stay in an audience's copy`);
  }
}

// The four fields of one characteristic, `where` naming it: each there once, its label at the start of a
// line, and a block of its own, so that one field can be taken out and the others left.
function checkFields(lines, where, fail) {
  for (const field of FIELDS) {
    const label = labelOf(field);
    const at = lines.flatMap((line, i) => (line.startsWith(label) ? [i] : []));
    if (at.length === 0) fail(`${where} lacks its field "${label}", the label at the start of a line`);
    else if (at.length > 1) fail(`${where} has the field "${label}" ${at.length} times; a characteristic has each field once`);
    else if (at[0] > 0 && lines[at[0] - 1].trim() !== '') fail(`${where}: the field "${label}" is not a block of its own: a field begins after a blank line and ends at the next`);
  }
}

// Under "Specialties": each "####" heading is a characteristic of the "###" specialty above it.
function checkSpecialties(lines, fail) {
  let specialty = null;
  let characteristic = null;
  const close = () => {
    if (characteristic) checkFields(characteristic.lines, `"#### ${characteristic.name}" of ${specialty === null ? 'no specialty' : `"### ${specialty}"`}`, fail);
    characteristic = null;
  };
  for (const line of lines) {
    const [, named] = SPECIALTY_CHARACTERISTIC.exec(line) ?? [];
    const [, of] = SPECIALTY.exec(line) ?? [];
    if (named !== undefined) {
      close();
      characteristic = { name: named, lines: [] };
    } else if (of !== undefined) {
      close();
      specialty = of;
    } else {
      characteristic?.lines.push(line);
    }
  }
  close();
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
  checkSections(body, order, {
    what: 'a card',
    stray: name => (JUDGE_SECTIONS.includes(name) ? `"## ${name}" belongs to a judge card` : undefined),
    inside: (name, lines) => {
      if (name === 'Core checks') checkCore(lines, fail);
      else if (name === 'Optional checks') checkOptional(lines, fail);
    },
  }, fail);
}

// A body against the sections its format gives, in `order`: each there once, in that order, with text under
// it, and no other. `what` is the kind of card, as an error names it; `stray` may say more of a section that
// is not in the order; `inside` checks what a section holds, once it holds something.
function checkSections(body, order, { what, stray = () => undefined, inside = () => {} }, fail) {
  const first = new Map();
  for (const section of sectionsOf(body)) {
    const { name } = section;
    if (first.has(name)) fail(`"## ${name}" appears twice`);
    else if (order.includes(name)) first.set(name, section);
    else fail(stray(name) ?? `"## ${name}" is not a section of ${what} (${order.join(', ')}); ${HEADING_FORM}`);
  }
  for (const name of order) {
    if (!first.has(name)) fail(`"## ${name}" is missing; ${HEADING_FORM}`);
  }
  // The sections that are there, as they come and as the format orders them.
  const found = [...first.keys()];
  const wanted = order.filter(name => first.has(name));
  if (found.join('\n') !== wanted.join('\n')) fail(`the sections are out of order: ${found.join(', ')}; the order is ${order.join(', ')}`);

  for (const name of wanted) {
    const { lines } = first.get(name);
    if (lines.every(line => line.trim() === '')) fail(`"## ${name}" has nothing under it`);
    else inside(name, lines);
  }
}

// The body's `## ` sections, each with the lines under it that are outside any code fence. A fence is open
// from its first line to a line of the same character, at least as many of it, and nothing after them. What
// it holds is passed over: a fenced line is never a heading, and a fenced list, table or command is an
// example, never a judge's check or row. The line that opens a fence is kept, so a section that holds only
// a fence has text under it.
function sectionsOf(body) {
  const sections = [];
  let open = null;
  for (const line of body.split('\n')) {
    const [, marks, rest] = FENCE.exec(line) ?? [];
    const inside = open !== null;
    const heading = inside ? null : HEADING.exec(line);
    if (!inside) open = marks ?? null;
    else if (marks?.startsWith(open) && rest.trim() === '') open = null;
    if (heading) sections.push({ name: heading[1], lines: [] });
    else if (!inside) sections.at(-1)?.lines.push(line);
  }
  return sections;
}

// The items of a list at the list's own level. An item that starts where the text of the check above it
// starts, or further in, is inside that check. A paragraph that starts further out, after a blank line,
// ends the list: what follows is read at its own indentation.
function topItems(lines) {
  let count = 0;
  let text = null;
  let afterBlank = false;
  for (const line of lines) {
    const [mark, indent] = LIST_ITEM.exec(line) ?? [];
    // Where the line's own text starts; -1 for a blank line.
    const start = line.search(/\S/);
    if (mark !== undefined) {
      if (text === null || indent.length < text) {
        count += 1;
        text = mark.length;
      }
    } else if (afterBlank && start !== -1 && start < text) {
      text = null;
    }
    afterBlank = start === -1;
  }
  return count;
}

function checkCore(lines, fail) {
  const count = topItems(lines);
  if (count < CORE_CHECKS.least || count > CORE_CHECKS.most) {
    fail(`"## Core checks" has ${count} check${count === 1 ? '' : 's'}; a judge has two to six, as a numbered or bulleted list`);
  }
}

// A table row, already trimmed, as its cells, each trimmed; a pipe written \| does not end its cell.
const cellsOf = row => row.slice(1, -1).split(PIPE).map(cell => cell.trim());
// A header cell, with or without the backticks of a code span.
const plain = cell => cell.replace(/^`(.+)`$/, '$1');

// The optional checks are one table: its header row, a line of dashes, then a row for each check, or none.
// A row begins and ends with a pipe, and no other line of the section holds one.
function checkOptional(lines, fail) {
  const columns = CHECK_COLUMNS.join(', ');
  const written = lines.map(line => line.trim());
  const odd = written.find(line => PIPE.test(line) && !(line.startsWith('|') && CLOSING_PIPE.test(line)));
  if (odd !== undefined) return fail(`"## Optional checks": ${ROW_FORM}; it has ${show(odd)}`);
  const [header, dashes, ...rows] = written.filter(line => line.startsWith('|')).map(cellsOf);
  if (!header) return fail(`"## Optional checks" needs a table with the columns ${columns} (it may have no rows); ${ROW_FORM}`);
  if (header.map(plain).join('\n') !== CHECK_COLUMNS.join('\n')) {
    return fail(`the table of "## Optional checks" must have the columns ${columns}; it has ${header.map(plain).join(', ')}`);
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
