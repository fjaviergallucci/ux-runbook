// The state of a package: the stages a design's size routes (spec § 5), which outputs are approved and
// in which of the founder's words, and whether anything they were built from moved afterwards (§ 6).
// state.json is the record. STATE.md is generated from it on every write and never edited by hand.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, serialize } from './frontmatter.mjs';
import { carryProblems, slug } from './carry.mjs';

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
const HEADER_ORDER = ['stage', 'version', 'status', 'approved', 'words', 'built-from'];
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const INPUT = /^([a-z]+)@(\d+)$/;

const at = stage => STAGES.indexOf(stage);
// Free text the founder or a stage writes (a design's name, his words, a question, a reason) is one line.
const oneLine = value => (typeof value === 'string' ? value.replace(/\s*[\r\n\u2028\u2029]\s*/g, ' ').trim() : '');
const hashOf = body => createHash('sha256').update(body, 'utf8').digest('hex');
const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const cell = value => (value === null || value === undefined || value === '' ? '—' : oneLine(String(value)).replace(/\|/g, '\\|'));
const skippedBy = size => `the ${size} route skips it`;
// The larger of two modes (full > short > skipped, the order of MODES): a resize never lowers a mode.
const larger = (a, b) => MODES[Math.min(MODES.indexOf(a), MODES.indexOf(b))];
// The built-from list a stage was stamped with; nothing for a stage never stamped.
const recordedInputs = entry => (Array.isArray(entry.builtFrom) ? entry.builtFrom : []).map(reference).filter(Boolean);
// A stage's entry in state.json with no approval on record.
const entryOf = (status, version) => ({ status, version, approved: null, words: null, hash: null, builtFrom: null, since: null });

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
  save(pkgDir, { design: name, kind, foundation, size, started: date, route, reasons, stages, question: null, questionStage: null });
}

// The stage is in work since `date`. Its output may not exist yet; when it does, its header goes back to
// draft. An approval it had before it went stale no longer stands; the hash and inputs stay, for stamp.
export function begin(pkgDir, stage, { date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  requireDate(date);
  requireOpen(state, stage);
  const art = readArtefact(pkgDir, stage);
  if (art && !art.error) writeArtefact(pkgDir, stage, { ...art.data, status: 'draft', approved: '', words: '' }, art.body);
  Object.assign(state.stages[stage], { status: 'in-work', approved: null, words: null, since: date });
  save(pkgDir, state);
}

// The stage's output goes to the founder with the one open question (`await` is a reserved word).
export function awaitFounder(pkgDir, stage, { question, date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  const asked = oneLine(question);
  if (!asked) throw new StateError(`${stage} cannot await the founder without the one question to put to him`);
  requireDate(date);
  requireOpen(state, stage);
  const entry = state.stages[stage];
  const { data, body } = mustRead(pkgDir, stage);
  refuse(`${stage} cannot await the founder`, headerProblems(stage, data, entry.version));
  // An approval it had before it went stale no longer stands; the hash it had stays, for stamp (§ 6).
  writeArtefact(pkgDir, stage, { ...data, status: 'awaiting', approved: '', words: '' }, body);
  Object.assign(entry, { status: 'awaiting', approved: null, words: null, since: date });
  Object.assign(state, { question: asked, questionStage: stage });
  save(pkgDir, state);
}

export function stamp(pkgDir, stage, { words, date } = {}) {
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
    ...carryProblems(body, carryContext(pkgDir, state, stage, data)).map(p => p.message),
  ]);
  // Approved once, gone stale since, and redone with a different body: that is a new version (§ 6).
  const hash = hashOf(body);
  const version = entry.hash && entry.hash !== hash ? entry.version + 1 : entry.version;
  writeArtefact(pkgDir, stage, { ...data, version, status: 'approved', approved: date, words: said }, body);
  state.stages[stage] = { ...entryOf('approved', version), approved: date, words: said, hash, builtFrom: data['built-from'] };
  const stale = version > entry.version ? cascade(state, stage, `${stage} went to version ${version} on ${date}`) : [];
  closeQuestion(state, [stage, ...stale]);
  save(pkgDir, state);
  return { version };
}

// The stage gets a new version, in work, and everything built on the old one turns stale (§ 6).
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
  const stale = cascade(state, stage, `${stage} went to version ${version} on ${date}`);
  closeQuestion(state, [stage, ...stale]);
  save(pkgDir, state);
  return { version, stale };
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
    Object.assign(state.stages, { [stage]: entryOf('skipped', entry.version) });
  } else if (added) {
    entry.status = 'not-started';
  } else if (entry.status === 'approved' && mode !== state.route[stage]) {
    entry.status = 'stale';
  }
  state.route[stage] = mode;
  state.reasons[stage] = `${why} (set ${mode} on ${date})`;
  const stale = added ? builtWithout(state, stage) : [];
  closeQuestion(state, ['stale', 'skipped'].includes(state.stages[stage].status) ? [stage, ...stale] : stale);
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
  for (const stage of added) stale.push(...builtWithout(state, stage));
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

// Checks every stage that has begun against its output on disk, and against what was stamped.
export function validate(pkgDir) {
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
      add('stale-input', `${stage} is stale: ${oneLine(state.reasons[stage]) || 'no reason recorded'}; redo it or re-confirm it, then stamp it`);
      continue;
    }
    const { data, body } = art;
    const approved = entry.status === 'approved';
    for (const message of headerProblems(stage, data, entry.version)) add('bad-header', message);
    if (HEADER_STATUSES.includes(data.status) && approved !== (data.status === 'approved')) add('bad-header', mismatch(data));
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
    for (const p of carryProblems(body, carryContext(pkgDir, state, stage, data))) add(p.code, p.message);
    if (hashOf(body) !== entry.hash) {
      add('changed-since-approval', `${ARTEFACT[stage]} changed after it was approved on ${entry.approved}; reopen it, or put back what was approved`);
    }
  }
  return { ok: problems.length === 0, problems };
}

// ---- what turns stale

// Every later stage on record as built from `stage`, directly or through a stage this marks, turns stale
// (§ 6). Read from what was stamped, never from the files as they are now. A stage skipped or not started
// has nothing on record: skipping clears it.
function cascade(state, stage, reason) {
  const stale = [];
  for (const later of STAGES.slice(at(stage) + 1)) {
    const entry = state.stages[later];
    if (!recordedInputs(entry).some(ref => [stage, ...stale].includes(ref.stage))) continue;
    Object.assign(entry, { status: 'stale' });
    state.reasons[later] = reason;
    stale.push(later);
  }
  return stale;
}

// A stage added to the route: the next stage the route runs after it was built without it, and turns stale.
function builtWithout(state, added) {
  const after = STAGES.slice(at(added) + 1).find(later => state.route[later] !== 'skipped');
  if (!after || state.stages[after].status !== 'approved') return [];
  state.stages[after].status = 'stale';
  state.reasons[after] = `${added} was added to the route before it`;
  return [after];
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

// What the carry checks need from the package: stage order, the built-from list, and an earlier output.
function carryContext(pkgDir, state, stage, data) {
  return {
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

function writeArtefact(pkgDir, stage, data, body) {
  const keys = [...HEADER_ORDER.filter(key => Object.hasOwn(data, key)), ...Object.keys(data).filter(key => !HEADER_ORDER.includes(key))];
  writeText(join(pkgDir, ARTEFACT[stage]), serialize(Object.fromEntries(keys.map(key => [key, data[key]])), body));
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
    const columns = [stage, state.route[stage], status, begun ? version : '—', cell(working ? since : null), cell(approved),
      `\`${ARTEFACT[stage]}\``, cell(state.reasons[stage])];
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

// The open question is closed when the stage it was put for is approved, reopened, skipped or marked stale.
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
