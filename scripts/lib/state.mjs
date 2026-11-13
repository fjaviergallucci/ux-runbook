// The state of a package: the stages a design's size routes (spec § 5), which outputs are approved and
// in which of the founder's words, and whether anything they were built from moved afterwards (§ 6).
// state.json is the record. STATE.md is generated from it on every write and never edited by hand.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, serialize, FrontmatterError } from './frontmatter.mjs';

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
// Nothing later inherits from the last two stages, so only they may end without a carry list.
const CARRY_OPTIONAL = ['handoff', 'acceptance'];
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const INPUT = /^([a-z]+)@(\d+)$/;
const SECTION_ENTRY = /^- ([a-z]+)@(\d+)#(\S+)$/;
const SOURCE_ENTRY = /^- source:\s*\S/;
const HEADING = /^#{1,6}[ \t]+(.+?)[ \t]*$/;
const CARRY_HEADING = /^##[ \t]+Carry[ \t]*$/;

const at = stage => STAGES.indexOf(stage);
// Free text the founder or a stage writes (a design's name, his words, a reason) is kept on one line.
const oneLine = value => (typeof value === 'string' ? value.replace(/\s*[\r\n\u2028\u2029]\s*/g, ' ').trim() : '');
const hashOf = body => createHash('sha256').update(body, 'utf8').digest('hex');
// A heading's slug: lower-cased, every run of characters that are not letters or digits made one `-`.
const slug = heading => heading.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

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
    stages[stage] = { status: skipped ? 'skipped' : 'not-started', version: 1, approved: null, words: null, hash: null };
    if (skipped) reasons[stage] = `skipped by the ${size} route`;
  }
  mkdirSync(pkgDir, { recursive: true });
  save(pkgDir, { design: name, kind, foundation, size, started: date, route, reasons, stages, question: null });
}

export function stamp(pkgDir, stage, { words, date } = {}) {
  const state = load(pkgDir);
  requireStage(stage);
  const said = oneLine(words);
  if (!said) throw new StateError(`${stage} cannot be stamped without the founder's words: give the words in which he approved it`);
  requireDate(date);
  const entry = state.stages[stage];
  if (entry.status === 'skipped') throw new StateError(`${stage} is skipped by the ${state.size} route; resize to run it`);
  if (entry.status === 'approved') throw new StateError(`${stage} is already approved at version ${entry.version}; reopen it to change it`);
  const { data, body } = mustRead(pkgDir, stage);
  const problems = [
    ...headerProblems(stage, data, entry.version),
    ...staleInputs(state, stage, data),
    ...carryProblems(pkgDir, state, stage, entry.version, body).map(p => p.message),
  ];
  if (problems.length) throw new StateError(`${stage} cannot be stamped:\n${problems.map(p => `- ${p}`).join('\n')}`);
  writeArtefact(pkgDir, stage, { ...data, status: 'approved', approved: date, words: said }, body);
  state.stages[stage] = { status: 'approved', version: entry.version, approved: date, words: said, hash: hashOf(body) };
  save(pkgDir, state);
  return { version: entry.version };
}

// The stage gets a new version, in work; every later output built from an old version of it, or from an
// output this marks stale, is marked stale (§ 6).
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
  state.stages[stage] = { status: 'in-work', version, approved: null, words: null, hash: null };
  state.reasons[stage] = `reopened on ${date}: ${why}`;
  const stale = [];
  for (const later of STAGES.slice(at(stage) + 1)) {
    if (['not-started', 'skipped'].includes(state.stages[later].status)) continue;
    const art = readArtefact(pkgDir, later);
    const built = inputsOf(later, art?.data).some(ref => (ref.stage === stage && ref.version < version) || stale.includes(ref.stage));
    if (!built) continue;
    state.stages[later].status = 'stale';
    stale.push(later);
  }
  save(pkgDir, state);
  return { version, stale };
}

// The size only moves up (§ 5); a larger size can only run stages a smaller one skipped.
export function resize(pkgDir, size) {
  const state = load(pkgDir);
  requireSize(size);
  if (SIZES.indexOf(size) < SIZES.indexOf(state.size)) {
    throw new StateError(`the size only moves up: ${state.size} cannot become ${size}; nothing moves down mid-run`);
  }
  const route = routeFor(size);
  for (const stage of STAGES) {
    if (route[stage] === 'skipped' || state.stages[stage].status !== 'skipped') continue;
    state.stages[stage].status = 'not-started';
    delete state.reasons[stage];
  }
  Object.assign(state, { size, route });
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

// Checks every stage that has begun against its output on disk; a stage not started is not looked at.
export function validate(pkgDir) {
  const state = load(pkgDir);
  const problems = [];
  for (const stage of STAGES) {
    const add = (code, message) => problems.push({ stage, code, message });
    const entry = state.stages[stage];
    if (entry.status === 'skipped') {
      if (!oneLine(state.reasons[stage])) add('skip-without-reason', `${stage} is skipped and the state gives no reason why`);
      continue;
    }
    if (entry.status === 'not-started') continue;
    const art = readArtefact(pkgDir, stage);
    if (!art) {
      add('missing-artefact', `${stage} is ${entry.status}, but ${ARTEFACT[stage]} does not exist`);
      continue;
    }
    if (art.error) {
      add('bad-header', art.error);
      continue;
    }
    if (entry.status === 'stale') {
      add('stale-input', `${stage} was built from an output that has since been reopened; redo it or re-confirm it, then stamp it`);
      continue;
    }
    const { data, body } = art;
    const approved = entry.status === 'approved';
    for (const message of headerProblems(stage, data, entry.version)) add('bad-header', message);
    if (HEADER_STATUSES.includes(data.status) && approved !== (data.status === 'approved')) {
      add('bad-header', approved
        ? `${stage} is approved, but its header says status ${data.status}`
        : `the header says approved, but ${stage} was never stamped; stamp it with the founder's words`);
    }
    for (const message of staleInputs(state, stage, data)) add('stale-input', message);
    if (!approved) continue;
    if (!oneLine(String(data.approved ?? ''))) add('bad-header', `${stage} is approved, but its header has no approval date`);
    if (!oneLine(String(data.words ?? '')) || !oneLine(entry.words)) {
      add('approved-without-words', `${stage} is approved, but the founder's words are missing from its ${oneLine(entry.words) ? 'header' : 'state'}`);
    }
    for (const p of carryProblems(pkgDir, state, stage, entry.version, body)) add(p.code, p.message);
    if (hashOf(body) !== entry.hash) {
      add('changed-since-approval', `${ARTEFACT[stage]} changed after it was approved on ${entry.approved}; reopen it, or put back what was approved`);
    }
  }
  return { ok: problems.length === 0, problems };
}

// ---- checks shared by stamp and validate

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
  const out = [];
  for (const ref of inputsOf(stage, data)) {
    const why = staleness(state, ref);
    if (why) out.push(`built from ${ref.stage}@${ref.version}, but ${why}`);
  }
  return out;
}

function staleness(state, { stage, version }) {
  const now = state.stages[stage];
  if (version !== now.version) return `${stage} is at version ${now.version}, not ${version}: a stale input; rebuild on ${stage}@${now.version} or re-confirm it`;
  if (now.status !== 'approved') return `${stage} is ${now.status}, not approved`;
  return null;
}

// The carry list is the last section, `## Carry`; each entry names a section of this or an earlier output
// at its current version (`- stage@version#heading-slug`) or a project source (`- source:path`), which is
// accepted without resolving: the project root is not the package's to know.
function carryProblems(pkgDir, state, stage, version, body) {
  const lines = body.split('\n');
  const start = lines.findLastIndex(line => CARRY_HEADING.test(line));
  if (start === -1) {
    if (CARRY_OPTIONAL.includes(stage)) return [];
    return [{ code: 'carry-unresolved', message: `${ARTEFACT[stage]} has no "## Carry" section; it is the last section of every output from frame to look` }];
  }
  const out = [];
  const unresolved = message => out.push({ code: 'carry-unresolved', message });
  for (const line of lines.slice(start + 1).map(l => l.trim()).filter(Boolean)) {
    if (HEADING.test(line)) {
      unresolved(`"## Carry" must be the last section, but "${line}" follows it`);
      continue;
    }
    if (SOURCE_ENTRY.test(line)) continue;
    const match = SECTION_ENTRY.exec(line);
    if (!match) {
      unresolved(`"${line}" is not a carry entry; write - <stage>@<version>#<heading-slug> or - source:<path>`);
      continue;
    }
    const [, from, written, wanted] = match;
    const ref = { stage: from, version: Number(written) };
    if (at(from) === -1 || at(from) > at(stage)) {
      unresolved(`"${line}" names ${from}, which is not this stage or an earlier one`);
      continue;
    }
    let text = body;
    if (from === stage) {
      if (ref.version !== version) {
        unresolved(`"${line}" names version ${ref.version}, but this is version ${version}`);
        continue;
      }
    } else {
      const why = staleness(state, ref);
      if (why) {
        out.push({ code: 'stale-input', message: `carry entry "${line}": ${why}` });
        continue;
      }
      const art = readArtefact(pkgDir, from);
      if (!art || art.error) {
        unresolved(`"${line}": ${ARTEFACT[from]} cannot be read`);
        continue;
      }
      text = art.body;
    }
    const slugs = text.split('\n').map(l => HEADING.exec(l)).filter(Boolean).map(m => slug(m[1]));
    if (!slugs.includes(wanted.normalize('NFC'))) unresolved(`"${line}": ${ARTEFACT[from]} has no heading whose slug is "${wanted}"`);
  }
  return out;
}

// ---- files

function load(pkgDir) {
  const file = join(pkgDir, STATE_FILE);
  if (!existsSync(file)) throw new StateError(`${pkgDir} is not a package: it has no ${STATE_FILE}; run init first`);
  let state;
  try {
    state = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    throw new StateError(`${file} is not valid JSON; this script writes it, so restore it from version control`);
  }
  const broken = STAGES.find(stage => !STATUSES.includes(state?.stages?.[stage]?.status) || !Number.isSafeInteger(state.stages[stage].version));
  if (!SIZES.includes(state?.size) || broken) {
    throw new StateError(`${file} is damaged (${broken ? `stage ${broken}` : 'size'}); this script writes it, so restore it from version control`);
  }
  state.reasons ??= {};
  return state;
}

function save(pkgDir, state) {
  writeFileSync(join(pkgDir, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
  writeFileSync(join(pkgDir, STATE_PAGE), page(state));
}

// { data, body } with line endings normalised; null when there is no file; { error } when the header
// cannot be read.
function readArtefact(pkgDir, stage) {
  const file = join(pkgDir, ARTEFACT[stage]);
  if (!existsSync(file)) return null;
  try {
    return parse(readFileSync(file, 'utf8'));
  } catch (e) {
    if (e instanceof FrontmatterError) return { error: `${ARTEFACT[stage]}: ${e.message}` };
    throw e;
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
  writeFileSync(join(pkgDir, ARTEFACT[stage]), serialize(Object.fromEntries(keys.map(key => [key, data[key]])), body));
}

function reference(item) {
  const match = typeof item === 'string' ? INPUT.exec(item) : null;
  return match && at(match[1]) !== -1 ? { stage: match[1], version: Number(match[2]) } : null;
}

// The well-formed stage@version entries of a header's built-from list that name a stage before `stage`.
function inputsOf(stage, data) {
  const inputs = Array.isArray(data?.['built-from']) ? data['built-from'] : [];
  return inputs.map(reference).filter(ref => ref && at(ref.stage) < at(stage));
}

function page(state) {
  const cell = value => (value === null || value === undefined || value === '' ? '—' : oneLine(String(value)).replace(/\|/g, '\\|'));
  const rows = STAGES.map(stage => {
    const { status, version, approved } = state.stages[stage];
    const begun = !['not-started', 'skipped'].includes(status);
    return `| ${stage} | ${cell(state.route?.[stage])} | ${status} | ${begun ? version : '—'} | ${cell(approved)} | \`${ARTEFACT[stage]}\` | ${cell(state.reasons[stage])} |`;
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
    `- Started: ${state.started ?? '—'}`,
    '',
    '| Stage | Route | Status | Version | Approved | Artefact | Note |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Open question',
    '',
    oneLine(state.question) || 'None.',
    '',
  ].join('\n');
}

// ---- arguments

function requireStage(stage) {
  if (!STAGES.includes(stage)) throw new StateError(`unknown stage "${stage}"; the stages are ${STAGES.join(', ')}`);
}

function requireSize(size) {
  if (!SIZES.includes(size)) throw new StateError(`unknown size "${size}"; the sizes are ${SIZES.join(', ')}`);
}

function requireDate(date) {
  const real = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
    && new Date(date).toISOString().startsWith(date);
  if (!real) throw new StateError(`the date "${date}" must be a real day written YYYY-MM-DD`);
}
