// The state of a package: the stages a design's size routes (spec § 5), which outputs are approved and
// in which of the founder's words, and whether anything they were built from moved afterwards (§ 6).
// state.json is the record. STATE.md is generated from it on every write and never edited by hand.
//
// What a stamp holds an output to, beside its header: it is built from the stage before it on the route,
// on inputs that are approved and current; his words are in it, under "## Reviewed by the founder", and
// nothing of its template is left (see `unfilled`); its carry list names sections that are there, and
// project sources that are there, each looked for from `root`, the folder the command is run in.
// What a stamp guards: the output's body, and every file of the stage's folder (see `filesOf`), each by
// its hash. A stage stamped before folders were guarded has no list on record, and is held to its output.
// Nothing is begun, or put to the founder, before the gate that precedes it (§ 18): `begin` and `await`
// refuse a stage while a stage the route runs before it is not approved.
// A stage has two notes: why the route has it as it does (`reasons`), and, while it is stale, what moved
// under it (`staleBecause`). The second goes when the stage is approved again.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, readlinkSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { FrontmatterError, parse, serialize } from './frontmatter.mjs';
import { carryProblems, slug } from './carry.mjs';
import { isLeftover } from './leftovers.mjs';

export { slug };

export const STAGES = ['frame', 'context', 'intent', 'cast', 'structure', 'detail', 'look', 'handoff', 'acceptance'];
export const ARTEFACT = {
  frame: '00-frame.md',
  context: '01-context.md',
  intent: '02-intent.md',
  cast: '03-cast.md',
  structure: '04-structure/CHOSEN.md',
  detail: '05-detail/DETAIL.md',
  look: '06-look/LOOK.md',
  handoff: '07-handoff/HANDOFF.md',
  acceptance: '08-acceptance/REPORT.md',
};
export const SIZES = ['correction', 'adjustment', 'surface', 'flow', 'system'];
export const FOUNDATIONS = ['no-system', 'new-surface', 'redesign', 'small-change'];
export const KINDS = ['working-surface', 'first-run', 'form', 'message', 'public-page'];
export const MODES = ['full', 'short', 'skipped'];

export class StateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StateError';
  }
}

const STATE_FILE = 'state.json';
const STATE_PAGE = 'STATE.md';
const STATUSES = ['not-started', 'in-work', 'awaiting', 'approved', 'skipped', 'stale'];
const HEADER_STATUSES = ['draft', 'awaiting', 'approved'];
// The status the header of a stage's output has in each status the state gives a stage that has one.
const HEADER_STATUS = { 'in-work': 'draft', awaiting: 'awaiting', approved: 'approved' };
const HEADER_ORDER = ['stage', 'version', 'status', 'approved', 'words', 'built-from'];
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const INPUT = /^([a-z]+)@(\d+)$/;

const at = stage => STAGES.indexOf(stage);
// Free text the founder or a stage writes (a design's name, his words, a question, a reason) is one line.
// A vertical tab (a soft line break pasted from a document), a form feed and U+0085 are line breaks too.
const oneLine = value => (typeof value === 'string' ? value.replace(/\s*[\r\n\u000b\u000c\u0085\u2028\u2029]\s*/g, ' ').trim() : '');
const hashOf = body => createHash('sha256').update(body, 'utf8').digest('hex');
const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const cell = value => (value === null || value === undefined || value === '' ? '—' : oneLine(String(value)).replace(/\|/g, '\\|'));
const skippedBy = size => `the ${size} route skips it`;
// The larger of two modes (full > short > skipped, the order of MODES): a resize never lowers a mode.
const larger = (a, b) => MODES[Math.min(MODES.indexOf(a), MODES.indexOf(b))];
// The built-from list a stage was stamped with; nothing for a stage never stamped.
const recordedInputs = entry => (Array.isArray(entry.builtFrom) ? entry.builtFrom : []).map(reference).filter(Boolean);
// A stage's entry in state.json with no approval on record.
const entryOf = (status, version) => ({ status, version, approved: null, words: null, hash: null, builtFrom: null, files: null, since: null });
// The folder a stage owns, from the package's: the one its output lies in. From frame to cast the output
// lies in the package's own folder, beside the other stages' and the state: such a stage owns its output
// and nothing else, and has no folder.
const folderOf = stage => (dirname(ARTEFACT[stage]) === '.' ? null : dirname(ARTEFACT[stage]));

// ---- routes (§ 5)

export function routeFor(size) {
  requireSize(size);
  return Object.fromEntries(STAGES.map(stage => [stage, routeOf(size, stage)]));
}

function routeOf(size, stage) {
  if (size === 'correction') return ['frame', 'detail', 'handoff', 'acceptance'].includes(stage) ? 'short' : 'skipped';
  if (size === 'adjustment') return { frame: 'full', structure: 'skipped' }[stage] ?? 'short';
  return 'full';
}

// The nearest earlier stage the route runs: what this stage's output must be built from (none for the first).
function predecessor(state, stage) {
  return STAGES.slice(0, at(stage)).reverse().find(earlier => state.route[earlier] !== 'skipped');
}

// ---- the verbs

export function init(pkgDir, { design, kind, foundation, size, date } = {}) {
  if (existsSync(join(pkgDir, STATE_FILE))) throw new StateError(`${pkgDir} already has a ${STATE_FILE}; a package is initialised once`);
  const name = oneLine(design);
  if (!name) throw new StateError('the design needs a name');
  if (typeof kind !== 'string' || !KEBAB.test(kind)) {
    throw new StateError(`the kind "${kind}" must be kebab-case: one of ${KINDS.join(', ')}, or a kind the project adds`);
  }
  if (!FOUNDATIONS.includes(foundation)) throw new StateError(`unknown foundation "${foundation}"; the foundations are ${FOUNDATIONS.join(', ')}`);
  const route = routeFor(size);
  requireDate(date);
  const stages = {};
  const reasons = {};
  for (const stage of STAGES) {
    const skipped = route[stage] === 'skipped';
    stages[stage] = entryOf(skipped ? 'skipped' : 'not-started', 1);
    if (skipped) reasons[stage] = skippedBy(size);
  }
  io(pkgDir, 'create the folder', () => mkdirSync(pkgDir, { recursive: true }));
  save(pkgDir, { design: name, kind, foundation, size, started: date, route, reasons, staleBecause: {}, stages, question: null, questionStage: null });
}

// The stage is in work since `date`. Its output may not exist yet; when it does, its header goes back to
// draft. An approval it had before it went stale no longer stands; the hash and inputs stay, for stamp.
// A question that was open for it is closed: a stage back in work is no longer in front of the founder.
// Refused while a stage the route runs before it is not approved.
export function begin(pkgDir, stage, { date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  requireDate(date);
  requireOpen(state, stage);
  requireGates(state, stage, 'be begun');
  backInWork(pkgDir, state, stage, date);
  closeQuestion(state, [stage]);
  save(pkgDir, state);
}

// A stage goes back in work since `date`, its header, when its output can be read, back to draft.
function backInWork(pkgDir, state, stage, date) {
  const art = readArtefact(pkgDir, stage);
  if (art && !art.error) writeArtefact(pkgDir, stage, { ...art.data, status: 'draft', approved: '', words: '' }, art.body);
  Object.assign(state.stages[stage], { status: 'in-work', approved: null, words: null, since: date });
}

// The stage's output goes to the founder with the one open question (`await` is a reserved word).
// Refused while a stage the route runs before it is not approved.
export function awaitFounder(pkgDir, stage, { question, date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  const asked = oneLine(question);
  if (!asked) throw new StateError(`${stage} cannot await the founder without the one question to put to him`);
  requireDate(date);
  requireOpen(state, stage);
  requireGates(state, stage, 'await the founder');
  const entry = state.stages[stage];
  const { data, body } = mustRead(pkgDir, stage);
  refuse(`${stage} cannot await the founder`, headerProblems(stage, data, entry.version));
  // An approval it had before it went stale no longer stands; the hash it had stays, for stamp (§ 6).
  writeArtefact(pkgDir, stage, { ...data, status: 'awaiting', approved: '', words: '' }, body);
  Object.assign(entry, { status: 'awaiting', approved: null, words: null, since: date });
  Object.assign(state, { question: asked, questionStage: stage });
  save(pkgDir, state);
}

// `root` is the project's root, which the carry list's sources are looked for from: the folder the command
// is run in, when it is not given.
export function stamp(pkgDir, stage, { words, date, root = process.cwd() } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  const said = oneLine(words);
  if (!said) throw new StateError(`${stage} cannot be stamped without the founder's words: give the words in which he approved it`);
  requireDate(date);
  requireOpen(state, stage);
  const entry = state.stages[stage];
  const { data, body } = mustRead(pkgDir, stage);
  const before = predecessor(state, stage);
  const named = inputsOf(stage, data).some(ref => ref.stage === before);
  refuse(`${stage} cannot be stamped`, [
    ...headerProblems(stage, data, entry.version),
    ...(before && !named ? [`it must be built from ${before}, the stage before it on the route: add ${before}@${state.stages[before].version} to built-from`] : []),
    ...staleInputs(state, stage, data),
    ...unfilled(ARTEFACT[stage], body).map(p => p.message),
    ...carryProblems(body, carryContext(pkgDir, state, stage, data, root)).map(p => p.message),
  ]);
  // Approved once and not reopened since (gone stale, or skipped and put back on the route), and stamped
  // with a different body: that is a new version (§ 6). The hash is the memory of the last approval.
  const hash = hashOf(body);
  const version = entry.hash && entry.hash !== hash ? entry.version + 1 : entry.version;
  // Every file of the stage's folder as it is at this stamp: read before anything is written.
  const files = filesOf(pkgDir, stage);
  writeArtefact(pkgDir, stage, { ...data, version, status: 'approved', approved: date, words: said }, body);
  state.stages[stage] = { ...entryOf('approved', version), approved: date, words: said, hash, builtFrom: data['built-from'], files };
  // Approved again: what had moved under it is no longer its note.
  delete state.staleBecause[stage];
  const stale = version > entry.version ? cascade(state, stage, `${stage} went to version ${version} on ${date}`) : [];
  closeQuestion(state, [stage, ...stale]);
  save(pkgDir, state);
  return { version };
}

// The stage gets a new version, in work, and everything built on the old one turns stale (§ 6). A later
// stage that was awaiting the founder rested on the version reopened, whether or not it was ever stamped:
// the question put for it can no longer be answered as asked, so it goes back in work and its question is
// closed. One the cascade marks stale is stale, and its question is closed with it.
// → { version, stale, recalled }: the new version, the stages marked stale, and those taken out of awaiting.
export function reopen(pkgDir, stage, { reason, date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  const why = oneLine(reason);
  if (!why) throw new StateError(`reopening ${stage} needs a reason`);
  requireDate(date);
  const entry = state.stages[stage];
  if (!['approved', 'stale'].includes(entry.status)) {
    throw new StateError(`${stage} is ${entry.status}: only an approved or stale stage can be reopened`);
  }
  const { data, body } = mustRead(pkgDir, stage);
  const version = entry.version + 1;
  writeArtefact(pkgDir, stage, { ...data, version, status: 'draft', approved: '', words: '' }, body);
  state.stages[stage] = entryOf('in-work', version);
  state.reasons[stage] = `reopened on ${date}: ${why}`;
  delete state.staleBecause[stage];
  const stale = cascade(state, stage, `${stage} went to version ${version} on ${date}`);
  const recalled = STAGES.slice(at(stage) + 1).filter(later => state.stages[later].status === 'awaiting');
  for (const later of recalled) backInWork(pkgDir, state, later, date);
  closeQuestion(state, [stage, ...stale, ...recalled]);
  save(pkgDir, state);
  return { version, stale, recalled };
}

// Frame's call for one stage (§ 4.0): full, short or skipped, always with the reason.
export function setRoute(pkgDir, stage, mode, { reason, date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  if (!MODES.includes(mode)) throw new StateError(`unknown route "${mode}"; a stage is routed ${MODES.join(', ')}`);
  const why = oneLine(reason);
  if (!why) throw new StateError(`routing ${stage} ${mode} needs a reason`);
  requireDate(date);
  const entry = state.stages[stage];
  const added = mode !== 'skipped' && entry.status === 'skipped';
  if (mode === 'skipped') {
    if (stage === 'frame') throw new StateError('frame cannot be skipped: it is the stage that decides the route');
    if (entry.status === 'approved') throw new StateError(`${stage} is approved: reopen it before skipping it`);
    if (entry.status === 'awaiting') throw new StateError(`${stage} is awaiting the founder: stamp it or begin it again before skipping it`);
    // The approval no longer stands. Its hash and version stay, so a later stamp can tell what changed;
    // and what it was built from stays, so a change above it still reaches what was built on it.
    Object.assign(entry, { status: 'skipped', approved: null, words: null, since: null });
    delete state.staleBecause[stage];
  } else if (added) {
    entry.status = 'not-started';
  } else if (entry.status === 'approved' && mode !== state.route[stage]) {
    entry.status = 'stale';
  }
  state.route[stage] = mode;
  state.reasons[stage] = `${why} (set ${mode} on ${date})`;
  if (added) builtWithout(state, stage);
  closeQuestion(state, ['stale', 'skipped'].includes(entry.status) ? [stage] : []);
  save(pkgDir, state);
}

// The size only moves up (§ 5), and a resize never lowers a stage's mode: each stage takes the larger of
// its mode and the new size's. A stage whose mode changes is noted as resized, and if it was approved it
// re-enters at the larger size, stale. A stage that stays skipped keeps a reason given by hand.
export function resize(pkgDir, size) {
  const state = load(pkgDir);
  requireSize(size);
  const from = state.size;
  if (SIZES.indexOf(size) < SIZES.indexOf(from)) {
    throw new StateError(`the size only moves up: ${from} cannot become ${size}; nothing moves down mid-run`);
  }
  if (size === from) return;
  const sized = routeFor(size);
  const stale = [];
  const added = [];
  for (const stage of STAGES) {
    const entry = state.stages[stage];
    const was = state.route[stage];
    const mode = larger(sized[stage], was);
    if (mode === 'skipped') {
      if (state.reasons[stage] === skippedBy(from)) state.reasons[stage] = skippedBy(size);
    } else if (entry.status === 'skipped') {
      entry.status = 'not-started';
      delete state.reasons[stage];
      added.push(stage);
    } else if (mode !== was) {
      state.reasons[stage] = `resized from ${from} to ${size}`;
      if (entry.status === 'approved') {
        entry.status = 'stale';
        stale.push(stage);
      }
    }
    state.route[stage] = mode;
  }
  state.size = size;
  for (const stage of added) builtWithout(state, stage);
  closeQuestion(state, stale);
  save(pkgDir, state);
}

// Resuming (§ 6): the first stage on the route that is not approved, or null when the run is done.
export function next(pkgDir) {
  const { stages } = load(pkgDir);
  return STAGES.find(stage => !['approved', 'skipped'].includes(stages[stage].status)) ?? null;
}

// STATE.md as generated from state.json.
export function status(pkgDir) {
  return page(load(pkgDir));
}

// Checks every stage that has begun against its output on disk, and against what was stamped. `root` is
// the project's root, as for stamp.
export function validate(pkgDir, { root = process.cwd() } = {}) {
  const state = load(pkgDir);
  const problems = [];
  for (const stage of STAGES) {
    const add = (code, message) => problems.push({ stage, code, message });
    const entry = state.stages[stage];
    const mismatch = data => `the header says ${data.status} while the state says ${entry.status}`;
    if (entry.status === 'skipped') {
      if (!oneLine(state.reasons[stage])) add('skip-without-reason', `${stage} is skipped and the state gives no reason why`);
      continue;
    }
    const art = readArtefact(pkgDir, stage);
    if (entry.status === 'not-started') {
      // Not looked at, unless its output claims an approval it never had.
      if (art?.data?.status === 'approved') add('bad-header', mismatch(art.data));
      continue;
    }
    if (!art) {
      // A stage in work may not have written its output yet.
      if (entry.status !== 'in-work') add('missing-artefact', `${stage} is ${entry.status}, but ${ARTEFACT[stage]} does not exist`);
      continue;
    }
    if (art.error) {
      add('bad-header', art.error);
      continue;
    }
    if (entry.status === 'stale') {
      add('stale-input', `${stage} is stale: ${oneLine(state.staleBecause[stage]) || oneLine(state.reasons[stage]) || 'no reason recorded'}; redo it or re-confirm it, then stamp it`);
      continue;
    }
    const { data, body } = art;
    const approved = entry.status === 'approved';
    for (const message of headerProblems(stage, data, entry.version)) add('bad-header', message);
    // The header says of a stage what the state says of it: draft while it is in work, else the same word.
    if (HEADER_STATUSES.includes(data.status) && data.status !== HEADER_STATUS[entry.status]) add('bad-header', mismatch(data));
    for (const message of staleInputs(state, stage, data)) add('stale-input', message);
    if (!approved) continue;
    const before = predecessor(state, stage);
    if (before && !recordedInputs(entry).some(ref => ref.stage === before)) {
      add('stale-input', `${stage} was stamped without ${before}, the stage before it on the route; redo it on ${before}`);
    }
    if (!oneLine(String(data.approved ?? ''))) add('bad-header', `${stage} is approved, but its header has no approval date`);
    if (!oneLine(String(data.words ?? '')) || !oneLine(entry.words)) {
      add('approved-without-words', `${stage} is approved, but the founder's words are missing from its ${oneLine(entry.words) ? 'header' : 'state'}`);
    }
    const changed = [
      data.words !== entry.words && 'words',
      data.approved !== entry.approved && 'approved',
      data.version !== entry.version && 'version',
      JSON.stringify(data['built-from']) !== JSON.stringify(entry.builtFrom) && 'built-from',
    ].filter(Boolean);
    if (changed.length) {
      add('changed-since-approval', `the header's ${changed.join(', ')} changed after ${stage} was stamped on ${entry.approved}; reopen it, or put back what was stamped`);
    }
    for (const p of unfilled(ARTEFACT[stage], body)) add(p.code, p.message);
    for (const p of carryProblems(body, carryContext(pkgDir, state, stage, data, root))) add(p.code, p.message);
    if (hashOf(body) !== entry.hash) {
      add('changed-since-approval', `${ARTEFACT[stage]} changed after it was approved on ${entry.approved}; reopen it, or put back what was approved`);
    }
    // A stage stamped before folders were guarded has no list on record: it is held to its output alone.
    if (isObject(entry.files)) for (const message of filesMoved(stage, entry, filesOf(pkgDir, stage))) add('changed-since-approval', message);
  }
  return { ok: problems.length === 0, problems };
}

// ---- what a stamp guards beside the output (R184)

// One hash for each file of the stage's folder, by its path from that folder with `/` between the parts,
// in the order of the paths; null for a stage that has no folder. Every file counts, in every folder
// under it, but the output itself (its body has a hash of its own, and its header is the script's) and
// what a mount or a file browser leaves behind (lib/leftovers.mjs). A link is never followed: it is held
// to where it points.
function filesOf(pkgDir, stage) {
  const folder = folderOf(stage);
  if (folder === null) return null;
  const found = [];
  const walk = inside => {
    const dir = join(pkgDir, folder, inside);
    for (const entry of io(dir, 'read', () => readdirSync(dir, { withFileTypes: true }))) {
      if (isLeftover(entry.name)) continue;
      const name = (inside ? `${inside}/${entry.name}` : entry.name).normalize('NFC');
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(name);
      else if (entry.isSymbolicLink()) found.push([name, hashOf(`link: ${io(path, 'read', () => readlinkSync(path))}`)]);
      else if (entry.isFile() && join(folder, name) !== join(ARTEFACT[stage])) found.push([name, fileHash(path)]);
    }
  };
  if (existsSync(join(pkgDir, folder))) walk('');
  return Object.fromEntries(found.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

// A text file is hashed as the output's body is: its line endings made one, so that a checkout that
// writes them another way changes nothing. Any other file (a picture, a font) by its bytes. Text is what
// reads as UTF-8 and holds no NUL.
const UTF8 = new TextDecoder('utf-8', { fatal: true });
function fileHash(path) {
  const bytes = io(path, 'read', () => readFileSync(path));
  let text = null;
  try {
    text = UTF8.decode(bytes);
  } catch {}
  if (text === null || text.includes('\u0000')) return createHash('sha256').update(bytes).digest('hex');
  return hashOf(text.replace(/\r\n/g, '\n'));
}

// How many files a problem line is written for, each by its name; the rest are counted in one line.
const FILES_NAMED = 10;

// What became of the files a stamp recorded: one line for each that changed, went or came since, the
// first FILES_NAMED of them by name.
function filesMoved(stage, entry, now) {
  const folder = folderOf(stage);
  const was = entry.files;
  const moved = [
    ...Object.keys(was).filter(name => Object.hasOwn(now, name) && now[name] !== was[name]).map(name => [name, 'changed', 'put back what was approved']),
    ...Object.keys(was).filter(name => !Object.hasOwn(now, name)).map(name => [name, 'was removed', 'put it back']),
    ...Object.keys(now).filter(name => !Object.hasOwn(was, name)).map(name => [name, 'was added', 'take it out']),
  ];
  const lines = moved.slice(0, FILES_NAMED).map(([name, what, undo]) => `${folder}/${name} ${what} after ${stage} was approved on ${entry.approved}; reopen ${stage}, or ${undo}`);
  const more = moved.length - lines.length;
  if (more > 0) lines.push(`${more} more ${more === 1 ? 'file' : 'files'} of ${folder}/ changed, were removed or were added after ${stage} was approved on ${entry.approved}; reopen ${stage}, or put back what was approved`);
  return lines;
}

// ---- what a stamp asks of the output's own words (G7)

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const REVIEWED = /^##[ \t]+Reviewed by the founder[ \t]*$/;
const ANY_HEADING = /^#{1,6}[ \t]+(.+?)[ \t]*$/;
const SECTION_HEADING = /^#{1,2}[ \t]+\S/;
const TEMPLATE_COMMENT = /^<!--\s*Template\./;
// How many headings a problem names where instructions are left; the rest are counted.
const HEADINGS_NAMED = 3;

// What is still missing from an output, or still left in it of its template, each as { code, message }:
//   - no "## Reviewed by the founder" section, or one that holds nothing but an instruction in braces:
//     an approval that is only in the chat is not one;
//   - the template's opening comment, the one that begins "Template.";
//   - an instruction in braces left as the template has it: a block of lines of its own that opens with
//     `{` and closes with `}`, the one closing the other.
// Fenced code is never read as either, and a block in braces that is a JSON object is no instruction.
// Braces inside a line (a table's cell, a heading) are not looked at: the short forms pass, and so does
// any output that says something under each heading.
function unfilled(file, body) {
  // The lines as prose: a line of fenced code is kept as a mark that is not blank, and comments are
  // taken out (the carry list's own comment stays in every output, above its heading).
  let fence = null;
  const marked = body.split('\n').map(line => {
    const open = FENCE.exec(line)?.[1];
    if (fence === null && open) {
      fence = open;
      return '\u0001';
    }
    if (fence !== null) {
      if (open && open[0] === fence[0] && open.length >= fence.length && line.trim() === open) fence = null;
      return '\u0001';
    }
    return line;
  });
  let templateComment = false;
  const lines = marked.join('\n').replace(/<!--[\s\S]*?-->/g, comment => {
    if (TEMPLATE_COMMENT.test(comment)) templateComment = true;
    // The lines it took stay, empty, so that what follows keeps its place.
    return comment.replace(/[^\n]/g, '');
  }).split('\n');
  // The instructions left: each block that opens a line with `{` and closes one with `}` before a blank
  // line, and is no JSON.
  const left = new Set();
  const under = [];
  let heading = null;
  for (let i = 0; i < lines.length; i++) {
    heading = ANY_HEADING.exec(lines[i])?.[1] ?? heading;
    if (!/^ {0,3}\{/.test(lines[i])) continue;
    let end = i;
    while (end < lines.length && lines[end].trim() !== '' && !lines[end].trimEnd().endsWith('}')) end++;
    if (end === lines.length || lines[end].trim() === '') continue;
    const block = lines.slice(i, end + 1).join('\n').trim();
    if (oneGroup(block) && !isJson(block)) {
      for (let k = i; k <= end; k++) left.add(k);
      under.push(heading);
    }
    i = end;
  }
  const out = [];
  const add = (code, message) => out.push({ code, message: `${file} ${message}` });
  if (templateComment) add('unfilled', 'still holds its template\'s opening comment: it is deleted once the template is filled in');
  if (under.length > 0) {
    const where = [...new Set(under)].map(name => (name === null ? 'before its first heading' : `under "${name}"`));
    const named = where.slice(0, HEADINGS_NAMED).join(', ') + (where.length > HEADINGS_NAMED ? ` and ${where.length - HEADINGS_NAMED} more` : '');
    add('unfilled', `still holds ${under.length === 1 ? 'an instruction in braces' : `${under.length} instructions in braces`} of its template, ${named}: replace each with what it asks for`);
  }
  const start = lines.findIndex(line => REVIEWED.test(line));
  const say = 'what he said is written there, in his words, before the stamp';
  if (start === -1) {
    add('approved-without-words', `has no "## Reviewed by the founder" section: ${say}`);
    return out;
  }
  let end = lines.findIndex((line, i) => i > start && SECTION_HEADING.test(line));
  if (end === -1) end = lines.length;
  const instructed = lines.slice(start + 1, end).some((_, i) => left.has(start + 1 + i));
  const written = lines.slice(start + 1, end).some((line, i) => !left.has(start + 1 + i) && line.trim() !== '');
  if (!written) add('approved-without-words', `holds nothing under "## Reviewed by the founder"${instructed ? ' but an instruction in braces' : ''}: ${say}`);
  return out;
}

// Whether a text that opens with `{` and closes with `}` is one group in braces: its first brace is closed
// by its last, and by none before it. `{name}, as in {greeting}` is a line that names two things.
function oneGroup(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i === text.length - 1;
  }
  return false;
}

function isJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// ---- what turns stale

// Every later stage on record as built from `stage`, directly or through a stage this reaches, turns stale
// (§ 6). Read from what was stamped, never from the files as they are now. A stage that is skipped, or
// not started since it was put back on the route, keeps what it was stamped as built from: the change
// passes through it to what was built on it, and its own status stays as it is, since it holds no
// approval to lose. → the stages marked stale. The reason is the stage's stale note, and no other.
function cascade(state, stage, reason) {
  const reached = [stage];
  const stale = [];
  for (const later of STAGES.slice(at(stage) + 1)) {
    const entry = state.stages[later];
    if (!recordedInputs(entry).some(ref => reached.includes(ref.stage))) continue;
    reached.push(later);
    if (['skipped', 'not-started'].includes(entry.status)) continue;
    entry.status = 'stale';
    state.staleBecause[later] = reason;
    stale.push(later);
  }
  return stale;
}

// A stage added to the route: the next stage the route runs after it was built without it, and turns stale.
// Only an approved stage is marked, and an approved stage holds no open question.
function builtWithout(state, added) {
  const after = STAGES.slice(at(added) + 1).find(later => state.route[later] !== 'skipped');
  if (!after || state.stages[after].status !== 'approved') return;
  state.stages[after].status = 'stale';
  state.staleBecause[after] = `${added} was added to the route before it`;
}

// ---- checks shared by the verbs and validate

function headerProblems(stage, data, version) {
  const out = [];
  if (data.stage !== stage) out.push(`the header says stage "${data.stage ?? ''}", not "${stage}"`);
  if (data.version !== version) out.push(`the header says version ${data.version ?? 'nothing'}, the state says ${version}`);
  if (!HEADER_STATUSES.includes(data.status)) out.push(`the header status must be one of ${HEADER_STATUSES.join(', ')}`);
  const inputs = data['built-from'];
  if (!Array.isArray(inputs)) {
    out.push('the header has no built-from list; write built-from: [] when it is built from nothing');
    return out;
  }
  for (const item of inputs) {
    const ref = reference(item);
    if (!ref || at(ref.stage) >= at(stage)) out.push(`built-from entry "${item}" must name an earlier stage as stage@version`);
  }
  return out;
}

// An input must be the approved, current version of its stage.
function staleInputs(state, stage, data) {
  return inputsOf(stage, data).map(ref => staleness(state, ref)).filter(Boolean).map(why => `built from ${why}`);
}

function staleness(state, { stage, version }) {
  const now = state.stages[stage];
  if (version !== now.version) return `${stage}@${version}, but ${stage} is at version ${now.version}: a stale input; rebuild on ${stage}@${now.version} or re-confirm it`;
  if (now.status !== 'approved') return `${stage}@${version}, but ${stage} is ${now.status}, not approved`;
}

// What the carry checks need from the package and the project: stage order, the built-from list, an
// earlier output, and whether a source is there, looked for from the project's root.
function carryContext(pkgDir, state, stage, data, root) {
  return {
    source: path => (existsSync(resolve(root, path)) ? null : `${path} is not there, looked for from ${resolve(root)}: a source is named by its path from the project's root, where the command is run`),
    stage,
    file: ARTEFACT[stage],
    required: !['handoff', 'acceptance'].includes(stage),
    earlier: from => at(from) !== -1 && at(from) < at(stage),
    inputs: inputsOf(stage, data).map(ref => ref.stage),
    // The body of an earlier output at `version`, or why it cannot be carried from.
    earlierBody(from, version) {
      const why = staleness(state, { stage: from, version });
      if (why) return { code: 'stale-input', message: `carries from ${why}` };
      const art = readArtefact(pkgDir, from);
      if (!art || art.error) return { code: 'carry-unresolved', message: `${ARTEFACT[from]} cannot be read` };
      return { body: art.body, file: ARTEFACT[from] };
    },
  };
}

// ---- files

function load(pkgDir) {
  const file = join(pkgDir, STATE_FILE);
  if (!existsSync(file)) throw new StateError(`${pkgDir} is not a package: it has no ${STATE_FILE}; run init first`);
  const text = readText(file);
  let state;
  try {
    state = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new StateError(`${file} is not valid JSON; this script writes it, so restore it from version control`);
  }
  const damage = damaged(state);
  if (damage) throw new StateError(`${file} is damaged (${damage}); this script writes it, so restore it from version control`);
  // A state written before a stage had a stale note of its own has none: its notes are all in `reasons`.
  if (!isObject(state.staleBecause)) state.staleBecause = {};
  return state;
}

function damaged(state) {
  if (!isObject(state)) return 'it is not an object';
  if (!SIZES.includes(state.size)) return `unknown size "${state.size}"`;
  for (const key of ['route', 'reasons', 'stages']) if (!isObject(state[key])) return `${key} is not an object`;
  for (const stage of STAGES) {
    const entry = state.stages[stage];
    if (!MODES.includes(state.route[stage])) return `the route of ${stage} is "${state.route[stage]}"`;
    if (!isObject(entry)) return `stage ${stage} is missing`;
    if (!STATUSES.includes(entry.status)) return `stage ${stage} has status "${entry.status}"`;
    if (!Number.isSafeInteger(entry.version) || entry.version < 1) return `stage ${stage} has version ${entry.version}`;
  }
}

function save(pkgDir, state) {
  writeText(join(pkgDir, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
  writeText(join(pkgDir, STATE_PAGE), page(state));
}

// A file-system failure on the package becomes a StateError naming the path; anything else is a bug and
// is thrown as it is.
function io(path, doing, action) {
  try {
    return action();
  } catch (e) {
    if (typeof e?.code !== 'string') throw e;
    throw new StateError(`cannot ${doing} ${path}: ${e.code}`);
  }
}

const readText = file => io(file, 'read', () => readFileSync(file, 'utf8'));

// Written beside the target and renamed over it, so a failed write never leaves half a file.
function writeText(file, text) {
  const temp = `${file}.${process.pid}.tmp`;
  io(file, 'write', () => {
    try {
      writeFileSync(temp, text);
      renameSync(temp, file);
    } finally {
      rmSync(temp, { force: true });
    }
  });
}

// { data, body } with line endings normalised; null when there is no file; { error } when the header
// cannot be read (parse refuses only with a FrontmatterError).
function readArtefact(pkgDir, stage) {
  const file = join(pkgDir, ARTEFACT[stage]);
  if (!existsSync(file)) return null;
  const text = readText(file);
  try {
    return parse(text);
  } catch (e) {
    return { error: `${ARTEFACT[stage]}: ${e.message}` };
  }
}

function mustRead(pkgDir, stage) {
  const art = readArtefact(pkgDir, stage);
  if (!art) throw new StateError(`${stage} has no output: ${ARTEFACT[stage]} does not exist`);
  if (art.error) throw new StateError(`${stage}: ${art.error}`);
  return art;
}

// A header that cannot be written, as one whose words hold a control character, is a refusal like any
// other: nothing has been written when it is made.
function writeArtefact(pkgDir, stage, data, body) {
  const keys = [...HEADER_ORDER.filter(key => Object.hasOwn(data, key)), ...Object.keys(data).filter(key => !HEADER_ORDER.includes(key))];
  let text;
  try {
    text = serialize(Object.fromEntries(keys.map(key => [key, data[key]])), body);
  } catch (e) {
    if (!(e instanceof FrontmatterError)) throw e;
    throw new StateError(`the header of ${stage} cannot be written: ${e.message}`);
  }
  writeText(join(pkgDir, ARTEFACT[stage]), text);
}

function reference(item) {
  const match = typeof item === 'string' ? INPUT.exec(item) : null;
  return match && at(match[1]) !== -1 ? { stage: match[1], version: Number(match[2]) } : null;
}

// The well-formed stage@version entries of a header's built-from list that name a stage before `stage`.
function inputsOf(stage, data) {
  const inputs = Array.isArray(data['built-from']) ? data['built-from'] : [];
  return inputs.map(reference).filter(ref => ref && at(ref.stage) < at(stage));
}

// ---- STATE.md

function page(state) {
  const rows = STAGES.map(stage => {
    const { status, version, approved, since } = state.stages[stage];
    const begun = !['not-started', 'skipped'].includes(status);
    const working = ['in-work', 'awaiting'].includes(status);
    // The two notes: why the route has it so, then what moved under it.
    const note = [state.reasons[stage], state.staleBecause[stage]].map(oneLine).filter(Boolean).join('; ');
    const columns = [stage, state.route[stage], status, begun ? version : '—', cell(working ? since : null), cell(approved),
      `\`${ARTEFACT[stage]}\``, cell(note)];
    return `| ${columns.join(' | ')} |`;
  });
  return [
    `# State of ${oneLine(state.design)}`,
    '',
    '_Generated from `state.json` by `scripts/state.mjs` on every write. Never edit this file by hand._',
    '',
    `- Design: ${oneLine(state.design)}`,
    `- Kind: ${state.kind}`,
    `- Foundation: ${state.foundation}`,
    `- Size: ${state.size}`,
    `- Started: ${cell(state.started)}`,
    castLine(state),
    '',
    '| Stage | Route | Status | Version | Since | Approved | Artefact | Note |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Open question',
    '',
    question(state),
    '',
  ].join('\n');
}

// A pointer to the cast, not a copy of it (§ 6).
function castLine(state) {
  const { status, version } = state.stages.cast;
  if (status === 'skipped') return `- Cast: skipped by the route — ${oneLine(state.reasons.cast) || 'no reason given'}`;
  if (status === 'not-started') return '- Cast: not chosen yet';
  return `- Cast: \`${ARTEFACT.cast}\` — ${status}, version ${version}`;
}

function question(state) {
  const asked = oneLine(state.question);
  if (!asked) return 'None.';
  return state.questionStage ? `${state.questionStage}: ${asked}` : asked;
}

// The open question is closed when the stage it was put for is approved, reopened, skipped, marked stale,
// begun again, or taken out of awaiting because an earlier stage was reopened.
function closeQuestion(state, stages) {
  if (stages.includes(state.questionStage)) Object.assign(state, { question: null, questionStage: null });
}

// ---- arguments

function refuse(what, problems) {
  if (problems.length) throw new StateError(`${what}:\n${problems.map(p => `- ${p}`).join('\n')}`);
}

function requireStage(stage) {
  if (!STAGES.includes(stage)) throw new StateError(`unknown stage "${stage}"; the stages are ${STAGES.join(', ')}`);
}

// Nothing is begun, or put to the founder, before the gate that precedes it (§ 18): every stage the route
// runs before this one is approved first. The stamp holds an output to its inputs; this holds the order.
function requireGates(state, stage, doing) {
  const open = STAGES.slice(0, at(stage)).find(earlier => !['skipped', 'approved'].includes(state.stages[earlier].status));
  if (open) {
    throw new StateError(`${stage} cannot ${doing}: ${open}, before it on the route, is ${state.stages[open].status}, not approved; \`next\` names the stage to run`);
  }
}

// A stage the route skips cannot be worked on until it is routed; an approved one until it is reopened.
function requireOpen(state, stage) {
  const entry = state.stages[stage];
  if (entry.status === 'skipped') throw new StateError(`${stage} is skipped on this route; route it full or short to run it`);
  if (entry.status === 'approved') throw new StateError(`${stage} is already approved at version ${entry.version}; reopen it to change it`);
}

function requireSize(size) {
  if (!SIZES.includes(size)) throw new StateError(`unknown size "${size}"; the sizes are ${SIZES.join(', ')}`);
}

function requireDate(date) {
  const real = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
    && new Date(date).toISOString().startsWith(date);
  if (!real) throw new StateError(`the date "${date}" must be a real day written YYYY-MM-DD`);
}
