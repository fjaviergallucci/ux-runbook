import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, serialize } from '../scripts/lib/frontmatter.mjs';
import {
  STAGES, ARTEFACT, SIZES, FOUNDATIONS, KINDS, MODES, StateError,
  routeFor, init, begin, awaitFounder, stamp, reopen, setRoute, resize, validate, next, status, slug,
} from '../scripts/lib/state.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'state.mjs');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'state-'));
after(() => rmSync(root, { recursive: true, force: true }));
// A source of a carry list is looked for from the folder a command is run in, the project's root: here
// the kit's own, whose README.md the bodies below name.
const KIT = join(here, '..');
process.chdir(KIT);

const DAY = '2026-11-13';
const WORDS = 'sí, continúa';
const META = { design: 'front desk', kind: 'working-surface', foundation: 'new-surface', size: 'surface', date: DAY };
let made = 0;
const fresh = () => join(root, `p${++made}`);
const refusal = (e, pattern) => e instanceof StateError && e.name === 'StateError' && pattern.test(e.message);
const refused = (fn, pattern) => assert.throws(fn, e => refusal(e, pattern));
// A refused stamp lists one problem per line, after its first line.
const refusedOnce = (fn, pattern) => assert.throws(fn, e => refusal(e, pattern) && e.message.split('\n').length === 2);
const defined = data => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
const files = dir => readdirSync(dir).flatMap(f => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
// The nearest earlier stage the route runs, as the library must find it.
const predecessorOf = (state, stage) => STAGES.slice(0, STAGES.indexOf(stage)).reverse().find(s => state.route[s] !== 'skipped');

// A stage output's body: one section to carry and, unless `carry` is null, a carry list as its last section.
const text = (title, carry = ['- source:README.md']) =>
  `# ${title}\n\n## The one job\n\nFind what is free now.\n\n## Reviewed by the founder\n\nYes.\n` +
  (carry ? `\n## Carry\n\n${carry.join('\n')}\n` : '');

// A temp package, initialised, with helpers that write stage outputs with given headers and bodies.
function pkg(meta = {}) {
  const dir = fresh();
  init(dir, { ...META, ...meta });
  const file = stage => join(dir, ARTEFACT[stage]);
  const p = {
    dir,
    file,
    state: () => JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')),
    setState(change) {
      const state = p.state();
      change(state);
      writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 2));
    },
    page: () => readFileSync(join(dir, 'STATE.md'), 'utf8'),
    read: stage => parse(readFileSync(file(stage), 'utf8')),
    // A draft at the stage's current version, built from the stage before it on the route, merged with
    // `header`; an undefined value drops the key.
    write(stage, header = {}, body = text(stage)) {
      const state = p.state();
      const before = predecessorOf(state, stage);
      const inputs = before ? [`${before}@${state.stages[before].version}`] : [];
      mkdirSync(dirname(file(stage)), { recursive: true });
      writeFileSync(file(stage), serialize(defined({ stage, version: state.stages[stage].version, status: 'draft', 'built-from': inputs, ...header }), body));
    },
    // Rewrites an artefact's header fields, leaving its body as it is.
    setHeader(stage, header) {
      const { data, body } = p.read(stage);
      writeFileSync(file(stage), serialize(defined({ ...data, ...header }), body));
    },
    edit(stage, change) {
      writeFileSync(file(stage), change(readFileSync(file(stage), 'utf8')));
    },
    // Writes and stamps each stage in turn.
    approve(...stages) {
      for (const stage of stages) {
        p.write(stage);
        stamp(dir, stage, { words: WORDS, date: DAY });
      }
    },
    // A status no verb gives a stage any more, since begin and await hold the order of the gates: a stage
    // in work or awaiting while one before it is not approved. A package begun before they did may be in
    // one, so it is written by hand, in the state and, when the output is there, in its header.
    force(stage, status, change = {}) {
      p.setState(state => Object.assign(state.stages[stage], { status, since: DAY }) && Object.assign(state, change));
      if (existsSync(file(stage))) p.setHeader(stage, { status: status === 'in-work' ? 'draft' : status });
    },
    problems: () => validate(dir).problems,
    codes: () => validate(dir).problems.map(q => `${q.stage}:${q.code}`),
  };
  return p;
}

// ---- routes (§ 5)

test("routeFor('correction'): frame, detail, handoff and acceptance short; the rest skipped", () => {
  const route = routeFor('correction');
  assert.deepEqual(Object.keys(route), STAGES);
  for (const stage of ['frame', 'detail', 'handoff', 'acceptance']) assert.equal(route[stage], 'short', stage);
  for (const stage of ['context', 'intent', 'cast', 'structure', 'look']) assert.equal(route[stage], 'skipped', stage);
});

test("routeFor('adjustment'): structure skipped, frame full, every other stage short", () => {
  const route = routeFor('adjustment');
  assert.equal(route.structure, 'skipped');
  assert.equal(route.frame, 'full');
  for (const stage of STAGES.filter(s => s !== 'structure' && s !== 'frame')) assert.equal(route[stage], 'short', stage);
});

test("routeFor('surface'), 'flow' and 'system': every stage full", () => {
  for (const size of ['surface', 'flow', 'system']) {
    for (const stage of STAGES) assert.equal(routeFor(size)[stage], 'full', `${size} ${stage}`);
  }
});

test('the constants name the stages, their outputs, the sizes, the foundations, the kit kinds and the modes', () => {
  assert.deepEqual(STAGES, ['frame', 'context', 'intent', 'cast', 'structure', 'detail', 'look', 'handoff', 'acceptance']);
  assert.deepEqual(ARTEFACT, {
    frame: '00-frame.md', context: '01-context.md', intent: '02-intent.md', cast: '03-cast.md',
    structure: '04-structure/CHOSEN.md', detail: '05-detail/DETAIL.md', look: '06-look/LOOK.md',
    handoff: '07-handoff/HANDOFF.md', acceptance: '08-acceptance/REPORT.md',
  });
  assert.deepEqual(SIZES, ['correction', 'adjustment', 'surface', 'flow', 'system']);
  assert.deepEqual(FOUNDATIONS, ['no-system', 'new-surface', 'redesign', 'small-change']);
  assert.deepEqual(KINDS, ['working-surface', 'first-run', 'form', 'message', 'public-page']);
  assert.deepEqual(MODES, ['full', 'short', 'skipped']);
});

test('an unknown size is refused by routeFor, init and resize', () => {
  refused(() => routeFor('medium'), /unknown size "medium"/);
  refused(() => init(fresh(), { ...META, size: 'medium' }), /unknown size "medium"/);
  refused(() => resize(pkg().dir, 'medium'), /unknown size "medium"/);
});

// ---- init

test('init writes state.json and STATE.md; skipped stages are skipped, with a reason; a second init throws', () => {
  const p = pkg({ size: 'correction' });
  assert.ok(existsSync(join(p.dir, 'STATE.md')));
  const state = p.state();
  assert.deepEqual(
    [state.design, state.kind, state.foundation, state.size, state.started, state.question, state.questionStage],
    ['front desk', 'working-surface', 'new-surface', 'correction', DAY, null, null],
  );
  assert.deepEqual(state.route, routeFor('correction'));
  for (const stage of STAGES) {
    const skipped = routeFor('correction')[stage] === 'skipped';
    const status = skipped ? 'skipped' : 'not-started';
    assert.deepEqual(state.stages[stage], { status, version: 1, approved: null, words: null, hash: null, builtFrom: null, files: null, since: null });
    assert.equal(state.reasons[stage], skipped ? 'the correction route skips it' : undefined, stage);
  }
  refused(() => init(p.dir, META), /already/);
});

test('init accepts any kebab-case kind and refuses one that is not', () => {
  assert.equal(pkg({ kind: 'booking-shell' }).state().kind, 'booking-shell');
  refused(() => init(fresh(), { ...META, kind: 'Radiology Shell' }), /kebab/);
  refused(() => init(fresh(), { ...META, kind: undefined }), /kebab/);
});

test('init refuses an unknown foundation and a blank design', () => {
  refused(() => init(fresh(), { ...META, foundation: 'greenfield' }), /unknown foundation "greenfield"/);
  refused(() => init(fresh(), { ...META, design: ' \n ' }), /design/);
});

test('init on a path that is a file is refused, naming the path', () => {
  const file = join(root, 'a-file');
  writeFileSync(file, 'not a folder');
  refused(() => init(file, META), /cannot create the folder .*a-file: E[A-Z]+/);
});

test('every verb that takes a date refuses one that is not a real day written YYYY-MM-DD', () => {
  refused(() => init(fresh(), { ...META, date: '13/11/2026' }), /YYYY-MM-DD/);
  const p = pkg();
  p.write('frame');
  refused(() => begin(p.dir, 'frame', { date: '2026-11-31' }), /YYYY-MM-DD/);
  refused(() => awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: 'today' }), /YYYY-MM-DD/);
  refused(() => stamp(p.dir, 'frame', { words: WORDS, date: '2026-02-30' }), /YYYY-MM-DD/);
  refused(() => stamp(p.dir, 'frame', { words: WORDS, date: '2026-13-01' }), /YYYY-MM-DD/);
  refused(() => setRoute(p.dir, 'cast', 'short', { reason: 'r', date: '2026-00-10' }), /YYYY-MM-DD/);
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  refused(() => reopen(p.dir, 'frame', { reason: 'the job changed', date: undefined }), /YYYY-MM-DD/);
});

// ---- begin and await: a stage in work, a stage awaiting the founder, the one open question

test('begin sets a stage in work since the day given; STATE.md shows it; its output need not exist yet', () => {
  const p = pkg();
  begin(p.dir, 'frame', { date: DAY });
  const { status: state, since } = p.state().stages.frame;
  assert.deepEqual([state, since], ['in-work', DAY]);
  assert.ok(!existsSync(p.file('frame')));
  assert.match(p.page(), /^\| frame \| full \| in-work \| 1 \| 2026-11-13 \| — \| `00-frame\.md` \| — \|$/m);
  assert.equal(next(p.dir), 'frame');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('begin takes a stage that is stale, awaiting or in work, and leaves its body alone', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.approve('context');
  assert.equal(p.state().stages.intent.status, 'stale');
  const { body } = p.read('intent');
  begin(p.dir, 'intent', { date: DAY });
  assert.equal(p.state().stages.intent.status, 'in-work');
  assert.equal(p.read('intent').body, body);
  awaitFounder(p.dir, 'intent', { question: 'Is this still the one job?', date: DAY });
  begin(p.dir, 'intent', { date: '2026-11-14' });
  assert.deepEqual([p.state().stages.intent.status, p.state().stages.intent.since], ['in-work', '2026-11-14']);
  begin(p.dir, 'intent', { date: '2026-11-15' });
  assert.deepEqual([p.state().stages.intent.status, p.state().stages.intent.since], ['in-work', '2026-11-15']);
});

test('begin refuses an unknown stage, a stage the route skips and a stage already approved', () => {
  const p = pkg({ size: 'adjustment' });
  refused(() => begin(p.dir, 'structure', { date: DAY }), /structure is skipped on this route; route it full or short/);
  p.approve('frame');
  refused(() => begin(p.dir, 'frame', { date: DAY }), /frame is already approved at version 1; reopen/);
  refused(() => begin(p.dir, 'review', { date: DAY }), /unknown stage "review"/);
  assert.equal(p.state().stages.structure.status, 'skipped');
});

test('begin on a stage with an output puts its header back to draft and drops the old approval; validate is clean', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  const { hash } = p.state().stages.intent;
  setRoute(p.dir, 'intent', 'short', { reason: 'a shorter intent', date: DAY });
  begin(p.dir, 'intent', { date: DAY });
  assert.deepEqual(p.read('intent').data, { stage: 'intent', version: 1, status: 'draft', approved: '', words: '', 'built-from': ['context@1'] });
  const entry = p.state().stages.intent;
  assert.deepEqual([entry.status, entry.approved, entry.words, entry.hash], ['in-work', null, null, hash]);
  assert.match(p.page(), /^\| intent \| short \| in-work \| 1 \| 2026-11-13 \| — \|/m);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
  const q = pkg();
  q.approve('frame', 'context', 'intent');
  writeFileSync(q.file('cast'), '---\nstage: cast\n');
  begin(q.dir, 'cast', { date: DAY });
  assert.equal(readFileSync(q.file('cast'), 'utf8'), '---\nstage: cast\n', 'an output it cannot read is left as it is');
  assert.equal(q.state().stages.cast.status, 'in-work');
});

test('await sets the header and state.json to awaiting and stores the question with its stage and day', () => {
  const p = pkg();
  p.write('frame');
  awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: DAY });
  const { data, body } = p.read('frame');
  assert.deepEqual(data, { stage: 'frame', version: 1, status: 'awaiting', approved: '', words: '', 'built-from': [] });
  assert.equal(body, text('frame'));
  const state = p.state();
  assert.deepEqual([state.stages.frame.status, state.stages.frame.since], ['awaiting', DAY]);
  assert.deepEqual([state.question, state.questionStage], ['Is the job right?', 'frame']);
  assert.match(p.page(), /^\| frame \| full \| awaiting \| 1 \| 2026-11-13 \| — \|/m);
  assert.equal(next(p.dir), 'frame');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('await stores a multi-line question on one line', () => {
  const p = pkg();
  p.write('frame');
  awaitFounder(p.dir, 'frame', { question: 'Which desk,\r\n\r\n  which day?', date: DAY });
  assert.equal(p.state().question, 'Which desk, which day?');
});

test('await refuses an empty question, an unknown, skipped or approved stage, a missing output and a bad header', () => {
  const p = pkg({ size: 'adjustment' });
  p.write('frame');
  refused(() => awaitFounder(p.dir, 'review', { question: 'Is the job right?', date: DAY }), /unknown stage "review"/);
  refused(() => awaitFounder(p.dir, 'frame', { question: ' \n ', date: DAY }), /without the one question/);
  refused(() => awaitFounder(p.dir, 'frame', { date: DAY }), /without the one question/);
  p.write('structure');
  refused(() => awaitFounder(p.dir, 'structure', { question: 'Which layout?', date: DAY }), /skipped on this route/);
  p.approve('frame');
  refused(() => awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: DAY }), /already approved at version 1/);
  refused(() => awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY }), /01-context\.md does not exist/);
  p.write('context', { stage: 'intent' });
  refused(() => awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY }), /says stage "intent"/);
  writeFileSync(p.file('context'), '---\nstage: context\n');
  refused(() => awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY }), /never closed/);
  const state = p.state();
  assert.deepEqual([state.stages.context.status, state.question, state.questionStage], ['not-started', null, null]);
});

test('a stale stage begun and then awaited loses the approval it had, in its header and its state', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  const { hash } = p.state().stages.intent;
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.approve('context');
  begin(p.dir, 'intent', { date: DAY });
  awaitFounder(p.dir, 'intent', { question: 'Is this still the one job?', date: DAY });
  const entry = p.state().stages.intent;
  assert.deepEqual([entry.status, entry.approved, entry.words, entry.hash], ['awaiting', null, null, hash]);
  const { data } = p.read('intent');
  assert.deepEqual([data.status, data.approved, data.words], ['awaiting', '', '']);
});

test('STATE.md shows the open question and the stage it belongs to', () => {
  const p = pkg();
  p.approve('frame');
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Which angle | which day?', date: DAY });
  assert.match(p.page(), /## Open question\n\ncontext: Which angle \| which day\?\n/);
  assert.match(p.page(), /^\| context \| full \| awaiting \| 1 \| 2026-11-13 \| — \| `01-context\.md` \|/m);
  assert.equal(status(p.dir), p.page());
});

test("stamp closes the open question of its own stage and leaves another stage's", () => {
  // The frame is stale while the context awaits him: its mode changed after the context was put to him.
  const p = pkg();
  p.approve('frame');
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY });
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], ['Which angle?', 'context']);
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], [null, null]);
  assert.match(p.page(), /## Open question\n\nNone\./);
});

test('reopen closes the open question of the reopened stage, of a stage it marks stale, and of a later stage that was awaiting', () => {
  // A later stage never stamped, awaiting the founder: its output rested on the version reopened, so its question goes.
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  p.write('cast');
  awaitFounder(p.dir, 'cast', { question: 'Which seats?', date: DAY });
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: DAY }), { version: 2, stale: ['intent'], recalled: ['cast'] });
  assert.deepEqual([p.state().question, p.state().questionStage], [null, null]);
  assert.match(p.page(), /## Open question\n\nNone\./);

  const q = pkg();
  q.approve('frame', 'context', 'intent');
  reopen(q.dir, 'context', { reason: 'r', date: DAY });
  q.approve('context');
  begin(q.dir, 'intent', { date: DAY });
  awaitFounder(q.dir, 'intent', { question: 'Still the one job?', date: DAY });
  assert.deepEqual(reopen(q.dir, 'context', { reason: 'r', date: DAY }).stale, ['intent']);
  assert.deepEqual([q.state().question, q.state().questionStage], [null, null]);

  // No verb leaves a question on an approved stage, so the state is written by hand here.
  const r = pkg();
  r.approve('frame');
  r.setState(state => Object.assign(state, { question: 'Still the right job?', questionStage: 'frame' }));
  reopen(r.dir, 'frame', { reason: 'r', date: DAY });
  assert.deepEqual([r.state().question, r.state().questionStage], [null, null]);
});

test('reopen takes a later stage out of awaiting: back in work since the day, its header draft, its body as it was', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast');
  p.write('structure');
  awaitFounder(p.dir, 'structure', { question: 'Which structure?', date: DAY });
  const { body } = p.read('structure');
  assert.deepEqual(reopen(p.dir, 'intent', { reason: 'the job was stated wrong', date: '2026-11-14' }), { version: 2, stale: ['cast'], recalled: ['structure'] });
  const { stages, question, questionStage } = p.state();
  assert.deepEqual(stages.structure, { status: 'in-work', version: 1, approved: null, words: null, hash: null, builtFrom: null, files: null, since: '2026-11-14' });
  assert.deepEqual([question, questionStage], [null, null]);
  assert.deepEqual(p.read('structure'), { data: { stage: 'structure', version: 1, status: 'draft', approved: '', words: '', 'built-from': ['cast@1'] }, body });
  assert.match(p.page(), /^\| structure \| full \| in-work \| 1 \| 2026-11-14 \| — \|/m);
  assert.match(p.page(), /## Open question\n\nNone\./);
  // Nothing else of the reopening changes: the reopened stage is next, and what was built on it is stale.
  assert.equal(next(p.dir), 'intent');
  assert.deepEqual([stages.intent.status, stages.intent.version, stages.cast.status, stages.context.status], ['in-work', 2, 'stale', 'approved']);
  // With its output moved away, the stage is in work and owes none: validate has nothing to say of it.
  unlinkSync(p.file('structure'));
  assert.deepEqual(p.codes(), ['cast:stale-input']);
  // And it can be begun, awaited and stamped again like any stage in work, once the stages before it are
  // approved again.
  p.approve('intent', 'cast');
  begin(p.dir, 'structure', { date: DAY });
  assert.deepEqual([p.state().stages.structure.status, p.state().stages.structure.since], ['in-work', DAY]);
});

test('reopen takes out of awaiting every later stage that was, and only those: not an earlier one, not one in work or not started', () => {
  // Two later stages awaiting, the question the second one's: both go back to work.
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent');
  awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY });
  p.write('cast');
  p.force('cast', 'awaiting', { question: 'Which seats?', questionStage: 'cast' });
  p.force('structure', 'in-work');
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: '2026-11-14' }), { version: 2, stale: [], recalled: ['intent', 'cast'] });
  const after = p.state();
  assert.deepEqual(STAGES.map(stage => after.stages[stage].status), ['approved', 'in-work', 'in-work', 'in-work', 'in-work', 'not-started', 'not-started', 'not-started', 'not-started']);
  assert.deepEqual([after.stages.intent.since, after.stages.cast.since, after.stages.structure.since], ['2026-11-14', '2026-11-14', DAY]);
  assert.deepEqual([p.read('intent').data.status, p.read('cast').data.status], ['draft', 'draft']);
  assert.deepEqual([after.question, after.questionStage], [null, null]);

  // An earlier stage awaiting keeps its status and its question; the later one awaiting goes back to work.
  const q = pkg();
  q.approve('frame', 'context', 'intent');
  reopen(q.dir, 'context', { reason: 'r', date: DAY });
  q.write('cast');
  q.force('cast', 'awaiting');
  q.write('context');
  awaitFounder(q.dir, 'context', { question: 'Which angle?', date: DAY });
  assert.equal(q.state().stages.intent.status, 'stale');
  assert.deepEqual(reopen(q.dir, 'intent', { reason: 'r', date: DAY }).recalled, ['cast']);
  const kept = q.state();
  assert.deepEqual([kept.stages.context.status, kept.stages.cast.status], ['awaiting', 'in-work']);
  assert.deepEqual([kept.question, kept.questionStage], ['Which angle?', 'context']);
  assert.equal(q.read('context').data.status, 'awaiting');

  // A later stage awaiting whose output cannot be read, or is gone, goes back to work all the same, the file left as it is.
  const r = pkg();
  r.approve('frame', 'context');
  writeFileSync(r.file('intent'), '---\nstage: intent\n');
  r.setState(state => {
    Object.assign(state.stages.intent, { status: 'awaiting', since: DAY });
    Object.assign(state.stages.cast, { status: 'awaiting', since: DAY });
    Object.assign(state, { question: 'Which seats?', questionStage: 'cast' });
  });
  reopen(r.dir, 'context', { reason: 'r', date: DAY });
  assert.equal(readFileSync(r.file('intent'), 'utf8'), '---\nstage: intent\n');
  assert.ok(!existsSync(r.file('cast')));
  assert.deepEqual([r.state().stages.intent.status, r.state().stages.cast.status, r.state().question], ['in-work', 'in-work', null]);
});

test("begin closes the open question of its own stage and leaves another stage's", () => {
  // The frame is stale while the context awaits him: its mode changed after the context was put to him.
  const p = pkg();
  p.approve('frame');
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY });
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  begin(p.dir, 'frame', { date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], ['Which angle?', 'context']);
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  begin(p.dir, 'context', { date: DAY });
  assert.deepEqual([p.state().stages.context.status, p.state().question, p.state().questionStage], ['in-work', null, null]);
  assert.match(p.page(), /## Open question\n\nNone\./);
  // Awaited again, it asks again: the question is the new one.
  awaitFounder(p.dir, 'context', { question: 'Which day?', date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], ['Which day?', 'context']);
});

// ---- stamp

test('stamp approves a draft: the header records the date and the words; the state records what was stamped', () => {
  const p = pkg();
  p.write('frame');
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 1 });
  const { data, body } = p.read('frame');
  assert.deepEqual(data, { stage: 'frame', version: 1, status: 'approved', approved: DAY, words: WORDS, 'built-from': [] });
  assert.equal(body, text('frame'));
  const { hash, ...rest } = p.state().stages.frame;
  assert.deepEqual(rest, { status: 'approved', version: 1, approved: DAY, words: WORDS, builtFrom: [], files: null, since: null });
  assert.match(hash, /^[0-9a-f]{64}$/);
  p.approve('context');
  assert.deepEqual(p.state().stages.context.builtFrom, ['frame@1']);
});

test('stamp keeps header keys it does not know, after its own', () => {
  const p = pkg();
  p.write('frame', { owner: 'maker.one', stage: 'frame' });
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  assert.deepEqual(Object.keys(p.read('frame').data), ['stage', 'version', 'status', 'approved', 'words', 'built-from', 'owner']);
  assert.equal(p.read('frame').data.owner, 'maker.one');
});

test('stamp refuses empty words', () => {
  const p = pkg();
  p.write('frame');
  refused(() => stamp(p.dir, 'frame', { words: '', date: DAY }), /words/);
  refused(() => stamp(p.dir, 'frame', { words: ' \r\n ', date: DAY }), /words/);
  refused(() => stamp(p.dir, 'frame', { date: DAY }), /words/);
});

test('stamp writes the words on one line: each line break becomes a single space', () => {
  const p = pkg();
  p.write('frame');
  stamp(p.dir, 'frame', { words: 'sí,\r\n\r\n  continúa\u2028ya', date: DAY });
  assert.equal(p.read('frame').data.words, 'sí, continúa ya');
  assert.equal(p.state().stages.frame.words, 'sí, continúa ya');
});

// S8 of the fix review: a soft line break pasted from a document (a vertical tab), a form feed and U+0085 are breaks too.
test('stamp and await take a vertical tab, a form feed and U+0085 for line breaks: each becomes a single space', () => {
  const p = pkg();
  p.write('frame');
  awaitFounder(p.dir, 'frame', { question: 'Is the frame\x0b right,\x0c\x0c as it\x85stands?', date: DAY });
  assert.equal(p.state().question, 'Is the frame right, as it stands?');
  stamp(p.dir, 'frame', { words: 'sí,\x0bcontinúa \x0c ya\x85mismo', date: DAY });
  assert.equal(p.read('frame').data.words, 'sí, continúa ya mismo');
  assert.equal(p.state().stages.frame.words, 'sí, continúa ya mismo');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('stamp refuses words that hold a control character, saying which stage and why, and writes nothing', () => {
  const p = pkg();
  p.write('frame');
  const [header, state] = [readFileSync(p.file('frame'), 'utf8'), JSON.stringify(p.state())];
  for (const words of ['sí\x07, continúa', 'sí\x00', '\x1b[1msí\x1b[0m', 'sí\x7f']) {
    refused(() => stamp(p.dir, 'frame', { words, date: DAY }), /^the header of frame cannot be written: "words": .*control character/);
  }
  assert.equal(readFileSync(p.file('frame'), 'utf8'), header);
  assert.equal(JSON.stringify(p.state()), state);
  // The command says it in one line, with no stack.
  const done = spawnSync(process.execPath, [cli, 'stamp', p.dir, 'frame', '--words', 'sí\x07, continúa'], { encoding: 'utf8' });
  assert.deepEqual([done.status, done.stdout], [1, '']);
  assert.match(done.stderr, /^the header of frame cannot be written: "words": [^\n]*control character[^\n]*\n$/);
});

// R170 of the dry run: his words held a double quote, and the header a stamp wrote was not YAML.
test('stamp writes words that hold a double quote in single quotes, his words unchanged; begin, await and validate read them back', () => {
  const said = 'Approved. One remark: "right now" means the next hour, and it\'s fine';
  const p = pkg();
  p.write('frame');
  stamp(p.dir, 'frame', { words: said, date: DAY });
  const header = readFileSync(p.file('frame'), 'utf8').split('\n').slice(0, 8);
  assert.deepEqual(header, ['---', 'stage: frame', 'version: 1', 'status: approved', `approved: ${DAY}`,
    'words: \'Approved. One remark: "right now" means the next hour, and it\'\'s fine\'', 'built-from: []', '---']);
  assert.equal(p.read('frame').data.words, said);
  assert.equal(p.state().stages.frame.words, said);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
  // The next stage is built on it, and a reopened stage keeps a header that still reads.
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Is "today" the surface?', date: DAY });
  stamp(p.dir, 'context', { words: '"yes"', date: DAY });
  assert.equal(readFileSync(p.file('context'), 'utf8').split('\n')[5], 'words: \'"yes"\'');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
  reopen(p.dir, 'frame', { reason: 'r', date: DAY });
  assert.deepEqual([p.read('frame').data.words, p.read('frame').data.status], ['', 'draft']);
  // Words without one are written as they always were.
  const q = pkg();
  q.write('frame');
  stamp(q.dir, 'frame', { words: WORDS, date: DAY });
  assert.equal(readFileSync(q.file('frame'), 'utf8').split('\n')[5], `words: "${WORDS}"`);
});

// A header stamped before there were two quoted forms is read as it was, and validate does not take it for changed.
test('a header stamped in the earlier form, double quotes around words that hold one, still reads and validates', () => {
  const said = 'Approved. One remark: "right now" means the next hour';
  const p = pkg();
  p.write('frame');
  stamp(p.dir, 'frame', { words: said, date: DAY });
  p.edit('frame', text => text.replace(`words: '${said}'`, `words: "${said}"`));
  assert.equal(readFileSync(p.file('frame'), 'utf8').split('\n')[5], `words: "${said}"`);
  assert.equal(p.read('frame').data.words, said);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('stamp reads a CRLF artefact and writes it back with LF', () => {
  const p = pkg();
  p.write('frame');
  p.edit('frame', s => s.replace(/\n/g, '\r\n'));
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  assert.ok(!readFileSync(p.file('frame'), 'utf8').includes('\r'));
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('stamp without "## Carry" throws for frame to look, and not for handoff and acceptance', () => {
  const p = pkg();
  for (const stage of STAGES) {
    p.write(stage, {}, text(stage, null));
    if (stage === 'handoff' || stage === 'acceptance') {
      stamp(p.dir, stage, { words: WORDS, date: DAY });
    } else {
      refusedOnce(() => stamp(p.dir, stage, { words: WORDS, date: DAY }), /has no "## Carry" section/);
      p.approve(stage);
    }
  }
  assert.equal(next(p.dir), null);
});

test('stamp of intent built from context@1 while context is at version 2 throws as stale', () => {
  const p = pkg();
  p.approve('frame', 'context');
  reopen(p.dir, 'context', { reason: 'the angles were thin', date: DAY });
  p.approve('context');
  p.write('intent', { 'built-from': ['context@1'] });
  refused(() => stamp(p.dir, 'intent', { words: WORDS, date: DAY }), /stale/);
});

test('stamp refuses an input that is not approved', () => {
  const p = pkg();
  p.write('frame');
  p.write('context');
  refusedOnce(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), /frame is not-started, not approved/);
});

test('stamp refuses an output not built from the stage before it on the route; a skipped stage is passed over', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', { 'built-from': ['frame@1'] });
  refusedOnce(() => stamp(p.dir, 'intent', { words: WORDS, date: DAY }),
    /it must be built from context, the stage before it on the route: add context@1 to built-from/);
  const q = pkg({ size: 'adjustment' });
  q.approve('frame', 'context', 'intent', 'cast');
  q.write('detail', { 'built-from': ['cast@1'] });
  stamp(q.dir, 'detail', { words: WORDS, date: DAY });
  const r = pkg();
  r.approve('frame');
  setRoute(r.dir, 'context', 'skipped', { reason: 'nothing to read', date: DAY });
  r.write('intent', { 'built-from': ['frame@1'] });
  stamp(r.dir, 'intent', { words: WORDS, date: DAY });
});

test('stamp refuses an unknown stage, a stage the route skips, an approved stage and a missing output', () => {
  const p = pkg({ size: 'correction' });
  refused(() => stamp(p.dir, 'review', { words: WORDS, date: DAY }), /unknown stage "review"/);
  p.write('context');
  refused(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), /skipped on this route/);
  p.approve('frame');
  refused(() => stamp(p.dir, 'frame', { words: WORDS, date: DAY }), /already approved at version 1; reopen/);
  refused(() => stamp(p.dir, 'detail', { words: WORDS, date: DAY }), /05-detail\/DETAIL\.md does not exist/);
});

const badHeaders = [
  ['the wrong stage', { stage: 'intent' }, /says stage "intent"/],
  ['another version', { version: 7 }, /says version 7/],
  ['an unknown status', { status: 'done' }, /status must be/],
  ['no built-from key', { 'built-from': undefined }, /no built-from list/],
  ['built-from that is not a list', { 'built-from': 'frame@1' }, /no built-from list/],
  ['a malformed input', { 'built-from': ['frame'] }, /built-from entry "frame"/],
  ['an input from a later stage', { 'built-from': ['intent@1'] }, /built-from entry "intent@1"/],
  ['an input naming an unknown stage', { 'built-from': ['frame@1', 'review@1'] }, /built-from entry "review@1"/],
  ['an input naming the stage itself', { 'built-from': ['frame@1', 'context@1'] }, /built-from entry "context@1"/],
];

test('stamp refuses a header that does not match its stage and its state', () => {
  for (const [name, header, pattern] of badHeaders) {
    const p = pkg();
    p.approve('frame');
    p.write('context', header);
    refused(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), pattern);
    assert.equal(p.state().stages.context.status, 'not-started', name);
  }
  const p = pkg();
  writeFileSync(p.file('frame'), '---\nstage: frame\n');
  refused(() => stamp(p.dir, 'frame', { words: WORDS, date: DAY }), /never closed/);
});

test('stamp accepts carry entries that resolve: sections of outputs it is built from, punctuation, accents in either normal form', () => {
  const p = pkg();
  p.write('frame', {}, `# Frame\n\n## The founder's own words\n\nx\n\n## Qué puede mostrar, hoy\n\ny\n\n## Reviewed by the founder\n\nYes.\n\n## Carry\n\n- source:README.md\n`);
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  p.write('context', {}, text('context', [
    '- frame@1#the-founder-s-own-words', '- frame@1#qué-puede-mostrar-hoy', `- frame@1#${'qué-puede-mostrar-hoy'.normalize('NFD')}`,
    '- source: docs/design', '- source:  tests/fixtures/acceptance.json',
  ]));
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('stamp refuses a carry list that is not the last section, a line that is not an entry, and an entry that does not resolve', () => {
  const cases = [
    [['- context@1#the-one-job', '', '## Notes'], /must be the last section, but "## Notes" follows it/],
    [['the context, all of it'], /"the context, all of it" is not a carry entry/],
    [['- source:'], /"- source:" is not a carry entry/],
    [['- context@1#no-such-heading'], /01-context\.md has no heading whose slug is "no-such-heading"/],
    [['- cast@1#the-one-job'], /names cast, which is not an earlier stage/],
    [['- review@1#the-one-job'], /names review, which is not an earlier stage/],
    [['- intent@1#the-one-job'], /names intent, which is not an earlier stage/],
    [['- frame@1#no-such-heading'], /names frame, which intent is not built from; add it to built-from/],
    [['- context@2#no-such-heading'], /stale/],
  ];
  for (const [carry, pattern] of cases) {
    const p = pkg();
    p.approve('frame', 'context');
    p.write('intent', {}, text('intent', carry));
    refusedOnce(() => stamp(p.dir, 'intent', { words: WORDS, date: DAY }), pattern);
  }
});

test('a stale stage re-confirmed with the same body keeps its version; redone with another body it gets the next one', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.approve('context');
  p.setHeader('intent', { 'built-from': ['context@2'] });
  assert.deepEqual(stamp(p.dir, 'intent', { words: WORDS, date: DAY }), { version: 1 });

  const q = pkg();
  q.approve('frame', 'context', 'intent', 'cast');
  reopen(q.dir, 'context', { reason: 'r', date: DAY });
  q.approve('context');
  q.write('intent', {}, text('intent').replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(stamp(q.dir, 'intent', { words: WORDS, date: DAY }), { version: 2 });
  assert.deepEqual([q.read('intent').data.version, q.state().stages.intent.version], [2, 2]);
  refused(() => stamp(q.dir, 'cast', { words: WORDS, date: DAY }), /intent@1, but intent is at version 2: a stale input/);
});

test('a stage that went stale, then was begun and awaited, gets the next version when its body changed', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.approve('context');
  begin(p.dir, 'intent', { date: DAY });
  p.write('intent', {}, text('intent').replace('Find what is free now.', 'Find what is free tonight.'));
  awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY });
  assert.deepEqual(stamp(p.dir, 'intent', { words: WORDS, date: DAY }), { version: 2 });
});

// ---- reopen

test('reopen(context) after frame, context and intent are approved: context at version 2 in work; intent stale', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'the angles were thin', date: DAY }), { version: 2, stale: ['intent'], recalled: [] });
  const { stages, reasons, staleBecause } = p.state();
  assert.deepEqual(stages.context, { status: 'in-work', version: 2, approved: null, words: null, hash: null, builtFrom: null, files: null, since: null });
  assert.equal(stages.intent.status, 'stale');
  assert.deepEqual([staleBecause.intent, reasons.intent], ['context went to version 2 on 2026-11-13', undefined]);
  assert.equal(stages.frame.status, 'approved');
  assert.match(reasons.context, /reopened on 2026-11-13: the angles were thin/);
  assert.deepEqual(p.read('context').data, { stage: 'context', version: 2, status: 'draft', approved: '', words: '', 'built-from': ['frame@1'] });
  assert.equal(next(p.dir), 'context');
});

test('reopen marks stale every later stage stamped as built from it, or from one it marks stale', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast');
  begin(p.dir, 'structure', { date: DAY });
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: DAY }).stale, ['intent', 'cast']);
  assert.equal(p.state().stages.structure.status, 'in-work', 'never stamped: nothing on record');
  assert.deepEqual(reopen(p.dir, 'intent', { reason: 'r', date: DAY }), { version: 2, stale: ['cast'], recalled: [] });
});

test('reopen leaves a later stage that was not stamped as built from it', () => {
  const p = pkg();
  p.approve('frame', 'context');
  setRoute(p.dir, 'intent', 'skipped', { reason: 'the job is known', date: DAY });
  p.approve('cast');
  setRoute(p.dir, 'intent', 'full', { reason: 'the job is not known after all', date: DAY });
  assert.deepEqual([p.state().stages.cast.status, p.state().staleBecause.cast], ['stale', 'intent was added to the route before it']);
  p.approve('intent');
  assert.deepEqual(p.state().stages.cast.builtFrom, ['context@1']);
  assert.deepEqual(reopen(p.dir, 'intent', { reason: 'r', date: DAY }).stale, []);
  assert.equal(p.state().staleBecause.cast, 'intent was added to the route before it', 'not on record as built from intent');
});

test('a stamp that raises a version marks stale what was built on the old one, directly or through other stages', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  p.write('frame', {}, text('frame').replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 2 });
  const { stages, staleBecause } = p.state();
  assert.deepEqual([stages.context.status, stages.intent.status], ['stale', 'stale']);
  assert.deepEqual([staleBecause.context, staleBecause.intent], ['frame went to version 2 on 2026-11-13', 'frame went to version 2 on 2026-11-13']);
  assert.equal(next(p.dir), 'context');
});

test("a stamp that raises a version closes the open question of a stage its cascade marks stale", () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  setRoute(p.dir, 'intent', 'short', { reason: 'a shorter intent', date: DAY });
  awaitFounder(p.dir, 'intent', { question: 'Is this still the one job?', date: DAY });
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  assert.equal(p.state().questionStage, 'intent');
  p.write('frame', {}, text('frame').replace('Find what is free now.', 'Find what is free tonight.'));
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  const state = p.state();
  assert.deepEqual([state.stages.intent.status, state.question, state.questionStage], ['stale', null, null]);
});

test('a stale stage re-stamped unchanged keeps its version, and what was built on it stays approved', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 1 });
  assert.deepEqual([p.state().stages.context.status, p.state().stages.intent.status], ['approved', 'approved']);
  assert.equal(next(p.dir), 'cast');
});

test('after a resize, a redone stage marks stale what was built on its old version', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail');
  resize(p.dir, 'adjustment');
  assert.deepEqual([p.state().stages.detail.status, p.state().staleBecause.detail], ['stale', 'cast was added to the route before it']);
  p.write('frame', {}, text('frame').replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 2 });
  assert.deepEqual([p.state().stages.detail.status, p.state().staleBecause.detail], ['stale', 'frame went to version 2 on 2026-11-13']);
});

test('reopen does not mark a stage that is skipped or not started, whatever it was stamped as built from', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  setRoute(p.dir, 'intent', 'skipped', { reason: 'r', date: DAY });
  p.approve('context');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.equal(p.state().stages.intent.status, 'skipped');
  setRoute(p.dir, 'intent', 'full', { reason: 'r', date: DAY });
  p.approve('context');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.equal(p.state().stages.intent.status, 'not-started');
});

test("a hand edit to an approved stage's built-from is reported, and reopen still marks the stage stale", () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast', 'structure');
  p.setHeader('intent', { 'built-from': [] });
  assert.deepEqual(p.codes(), ['intent:changed-since-approval']);
  unlinkSync(p.file('cast'));
  writeFileSync(p.file('structure'), '---\nstage: structure\n');
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: DAY }).stale, ['intent', 'cast', 'structure']);
});

test('reopen refuses a blank reason, an unknown stage, a stage not approved or stale, and a missing or unreadable output', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame', 'context');
  refused(() => reopen(p.dir, 'frame', { reason: ' ', date: DAY }), /reason/);
  refused(() => reopen(p.dir, 'intent', { reason: 'r', date: DAY }), /intent is not-started: only an approved or stale stage/);
  refused(() => reopen(p.dir, 'structure', { reason: 'r', date: DAY }), /structure is skipped: only an approved or stale stage/);
  refused(() => reopen(p.dir, 'nowhere', { reason: 'r', date: DAY }), /unknown stage "nowhere"/);
  unlinkSync(p.file('context'));
  refused(() => reopen(p.dir, 'context', { reason: 'r', date: DAY }), /01-context\.md does not exist/);
  writeFileSync(p.file('frame'), '---\nstage: frame\n');
  refused(() => reopen(p.dir, 'frame', { reason: 'r', date: DAY }), /never closed/);
  assert.deepEqual([p.state().stages.frame.status, p.state().stages.context.status], ['approved', 'approved']);
});

// ---- route (§ 4.0)

test('route skips a stage not started, in work or stale; the reason is kept and shown; its question goes', () => {
  const p = pkg();
  setRoute(p.dir, 'cast', 'skipped', { reason: 'one judge, no cast', date: DAY });
  const state = p.state();
  assert.deepEqual([state.route.cast, state.stages.cast.status, state.reasons.cast],
    ['skipped', 'skipped', 'one judge, no cast (set skipped on 2026-11-13)']);
  assert.match(p.page(), /^\| cast \| skipped \| skipped \| — \| — \| — \| `03-cast\.md` \| one judge, no cast \(set skipped on 2026-11-13\) \|$/m);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
  p.setState(s => { delete s.reasons.cast; });
  assert.deepEqual(p.codes(), ['cast:skip-without-reason']);

  const q = pkg();
  q.approve('frame');
  q.write('context');
  awaitFounder(q.dir, 'context', { question: 'Which angle?', date: DAY });
  begin(q.dir, 'context', { date: DAY });
  setRoute(q.dir, 'context', 'skipped', { reason: 'r', date: DAY });
  assert.deepEqual([q.state().stages.context.status, q.state().question, q.state().questionStage], ['skipped', null, null]);

  const r = pkg();
  r.approve('frame', 'context', 'intent');
  reopen(r.dir, 'context', { reason: 'r', date: DAY });
  setRoute(r.dir, 'intent', 'skipped', { reason: 'r', date: DAY });
  assert.equal(r.state().stages.intent.status, 'skipped');
});

test('route: a skipped stage routed short or full is not started, and becomes the stage before the next', () => {
  const p = pkg({ size: 'adjustment' });
  setRoute(p.dir, 'structure', 'short', { reason: 'the structure changes', date: DAY });
  const state = p.state();
  assert.deepEqual([state.route.structure, state.stages.structure.status], ['short', 'not-started']);
  assert.equal(state.stages.detail.status, 'not-started', 'a stage after it that was not approved is left as it is');
  assert.equal(state.reasons.structure, 'the structure changes (set short on 2026-11-13)');
  p.approve('frame', 'context', 'intent', 'cast');
  p.write('detail', { 'built-from': ['cast@1'] });
  refused(() => stamp(p.dir, 'detail', { words: WORDS, date: DAY }), /must be built from structure/);
});

test('route adding a stage marks the next stage on the route stale; next returns the added stage, then that one', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame', 'context', 'intent', 'cast', 'detail');
  setRoute(p.dir, 'structure', 'short', { reason: 'the structure changes', date: DAY });
  const { stages, staleBecause } = p.state();
  assert.deepEqual([stages.structure.status, stages.detail.status], ['not-started', 'stale']);
  assert.equal(staleBecause.detail, 'structure was added to the route before it');
  assert.equal(next(p.dir), 'structure');
  p.approve('structure');
  assert.equal(next(p.dir), 'detail');
  setRoute(p.dir, 'acceptance', 'skipped', { reason: 'nothing to accept', date: DAY });
  setRoute(p.dir, 'acceptance', 'short', { reason: 'something to accept', date: DAY });
  assert.equal(p.state().stages.acceptance.status, 'not-started', 'the last stage has nothing after it');
});

test('route skipped clears the approval but keeps its hash and what it was built from, not the file; routed again, the stage is not started', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  const written = readFileSync(p.file('intent'), 'utf8');
  const { hash } = p.state().stages.intent;
  setRoute(p.dir, 'intent', 'short', { reason: 'a shorter intent', date: DAY });
  setRoute(p.dir, 'intent', 'skipped', { reason: 'no intent this time', date: DAY });
  const blank = { version: 1, approved: null, words: null, hash, builtFrom: ['context@1'], files: null, since: null };
  assert.deepEqual(p.state().stages.intent, { status: 'skipped', ...blank });
  assert.equal(readFileSync(p.file('intent'), 'utf8'), written);
  setRoute(p.dir, 'intent', 'full', { reason: 'an intent after all', date: DAY });
  assert.deepEqual(p.state().stages.intent, { status: 'not-started', ...blank });
  assert.match(p.page(), /^\| intent \| full \| not-started \| — \| — \| — \|/m);
});

test('route skipped keeps the version a stage is at', () => {
  const p = pkg();
  p.approve('frame', 'context');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  setRoute(p.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  assert.deepEqual([p.state().stages.context.status, p.state().stages.context.version], ['skipped', 2]);
  setRoute(p.dir, 'context', 'full', { reason: 'a context after all', date: DAY });
  assert.deepEqual([p.state().stages.context.status, p.state().stages.context.version], ['not-started', 2]);
});

// Surface; all nine approved, cast built from intent@1 and context@1; context made stale, skipped and put back.
function skippedAndPutBack() {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  p.write('cast', { 'built-from': ['intent@1', 'context@1'] });
  stamp(p.dir, 'cast', { words: WORDS, date: DAY });
  p.approve('structure', 'detail', 'look', 'handoff', 'acceptance');
  setRoute(p.dir, 'context', 'short', { reason: 'a narrower context', date: DAY });
  setRoute(p.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  setRoute(p.dir, 'context', 'full', { reason: 'a context after all', date: DAY });
  const { stages } = p.state();
  assert.deepEqual(STAGES.slice(2).map(s => stages[s].status), ['stale', ...STAGES.slice(3).map(() => 'approved')], 'only intent is stale');
  return p;
}

test('a stage skipped and put back, stamped with a new body, gets the next version and marks what was built on it', () => {
  const p = skippedAndPutBack();
  p.write('context', {}, text('context').replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(stamp(p.dir, 'context', { words: WORDS, date: DAY }), { version: 2 });
  const { stages, staleBecause } = p.state();
  for (const stage of STAGES.slice(2)) {
    assert.deepEqual([stages[stage].status, staleBecause[stage]], ['stale', 'context went to version 2 on 2026-11-13'], stage);
  }
  assert.equal(next(p.dir), 'intent');
});

test('a stage skipped and put back, stamped with the same body, keeps its version and marks nothing beyond intent', () => {
  const p = skippedAndPutBack();
  p.write('context');
  assert.deepEqual(stamp(p.dir, 'context', { words: WORDS, date: DAY }), { version: 1 });
  const { stages } = p.state();
  assert.deepEqual(STAGES.slice(2).map(s => stages[s].status), ['stale', ...STAGES.slice(3).map(() => 'approved')]);
});

test('a stage skipped by hand and put back by a resize, stamped with a new body, gets the next version', () => {
  const p = pkg({ size: 'correction' });
  setRoute(p.dir, 'context', 'short', { reason: 'a short context', date: DAY });
  p.approve('frame', 'context', 'detail', 'handoff');
  assert.deepEqual(p.state().stages.detail.builtFrom, ['context@1']);
  setRoute(p.dir, 'context', 'full', { reason: 'a full context', date: DAY });
  setRoute(p.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  resize(p.dir, 'adjustment');
  assert.equal(p.state().stages.context.status, 'not-started');
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  p.write('context', {}, text('context').replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(stamp(p.dir, 'context', { words: WORDS, date: DAY }), { version: 2 });
  const { stages, staleBecause } = p.state();
  assert.deepEqual([stages.detail.status, staleBecause.detail], ['stale', 'context went to version 2 on 2026-11-13']);
  assert.deepEqual([stages.handoff.status, staleBecause.handoff], ['stale', 'context went to version 2 on 2026-11-13']);
});

test('route: an approved stage moved between short and full turns stale; other stages keep their status', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame', 'context');
  begin(p.dir, 'intent', { date: DAY });
  setRoute(p.dir, 'intent', 'full', { reason: 'r', date: DAY });
  setRoute(p.dir, 'cast', 'full', { reason: 'r', date: DAY });
  assert.deepEqual([p.state().stages.intent.status, p.state().stages.cast.status], ['in-work', 'not-started']);
  setRoute(p.dir, 'context', 'full', { reason: 'the context is wider', date: DAY });
  assert.deepEqual([p.state().route.context, p.state().stages.context.status, p.state().stages.intent.status], ['full', 'stale', 'in-work']);
  setRoute(p.dir, 'frame', 'full', { reason: 'still full', date: DAY });
  assert.equal(p.state().stages.frame.status, 'approved', 'the same mode is no change');
  // No verb leaves a question on an approved stage, so the state is written by hand here.
  p.setState(state => Object.assign(state, { question: 'Still the job?', questionStage: 'frame' }));
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  assert.deepEqual([p.state().stages.frame.status, p.state().question], ['stale', null]);
});

test('route refuses an unknown mode, a blank reason, an unknown stage, and skipping a stage approved or awaiting', () => {
  const p = pkg();
  refused(() => setRoute(p.dir, 'frame', 'long', { reason: 'r', date: DAY }), /unknown route "long"/);
  refused(() => setRoute(p.dir, 'frame', 'short', { reason: ' ', date: DAY }), /routing frame short needs a reason/);
  refused(() => setRoute(p.dir, 'review', 'short', { reason: 'r', date: DAY }), /unknown stage "review"/);
  refused(() => setRoute(p.dir, 'frame', 'skipped', { reason: 'r', date: DAY }), /frame cannot be skipped: it is the stage that decides the route/);
  p.approve('frame', 'context');
  refused(() => setRoute(p.dir, 'context', 'skipped', { reason: 'r', date: DAY }), /context is approved: reopen it before skipping it/);
  p.write('intent');
  awaitFounder(p.dir, 'intent', { question: 'Which job?', date: DAY });
  refused(() => setRoute(p.dir, 'intent', 'skipped', { reason: 'r', date: DAY }), /intent is awaiting the founder/);
  const state = p.state();
  assert.deepEqual([state.route.frame, state.stages.context.status, state.stages.intent.status, state.route.intent],
    ['full', 'approved', 'awaiting', 'full']);
});

// ---- resize (§ 5)

test('resize: the size only moves up; adjustment to flow un-skips structure and leaves a stage whose mode holds', () => {
  refused(() => resize(pkg().dir, 'adjustment'), /only moves up/);
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  resize(p.dir, 'flow');
  const state = p.state();
  assert.equal(state.size, 'flow');
  assert.deepEqual(state.route, routeFor('flow'));
  assert.equal(state.stages.structure.status, 'not-started');
  assert.equal(state.reasons.structure, undefined);
  assert.equal(state.stages.frame.status, 'approved', 'full before and after');
  assert.equal(next(p.dir), 'context');
});

test('resize: an approved stage whose mode changes turns stale; a stage that stays skipped gets the new reason', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail', 'handoff', 'acceptance');
  resize(p.dir, 'adjustment');
  const state = p.state();
  assert.deepEqual(state.route, routeFor('adjustment'));
  assert.deepEqual([state.stages.frame.status, state.reasons.frame], ['stale', 'resized from correction to adjustment']);
  assert.deepEqual([state.stages.context.status, state.reasons.context], ['not-started', undefined]);
  assert.deepEqual([state.stages.structure.status, state.reasons.structure], ['skipped', 'the adjustment route skips it']);
  assert.equal(state.stages.acceptance.status, 'approved', 'short before and after, and built from the stage still before it');
});

test('resize adding stages marks the next stage on the route after each stale', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail', 'handoff');
  resize(p.dir, 'adjustment');
  const { stages, staleBecause } = p.state();
  assert.deepEqual([stages.detail.status, staleBecause.detail], ['stale', 'cast was added to the route before it']);
  assert.deepEqual([stages.handoff.status, staleBecause.handoff], ['stale', 'look was added to the route before it']);
  assert.equal(next(p.dir), 'frame');
});

test('resize: a stage whose mode changes is noted as resized, replacing a note given by hand', () => {
  const p = pkg({ size: 'correction' });
  setRoute(p.dir, 'context', 'short', { reason: 'a short context', date: DAY });
  resize(p.dir, 'surface');
  const { route, stages, reasons } = p.state();
  assert.deepEqual([route.context, stages.context.status, reasons.context], ['full', 'not-started', 'resized from correction to surface']);
});

test('resize: a stage that stays skipped keeps a reason given by hand; only the old size\'s own note is rewritten', () => {
  const p = pkg({ size: 'correction' });
  setRoute(p.dir, 'structure', 'skipped', { reason: 'no structure work', date: DAY });
  resize(p.dir, 'adjustment');
  const { route, reasons } = p.state();
  assert.deepEqual([route.structure, reasons.structure], ['skipped', 'no structure work (set skipped on 2026-11-13)']);
});

test('a resize never lowers a mode set by hand, and keeps its note', () => {
  const p = pkg({ size: 'correction' });
  setRoute(p.dir, 'handoff', 'full', { reason: 'a full handoff', date: DAY });
  resize(p.dir, 'adjustment');
  assert.deepEqual([p.state().route.handoff, p.state().reasons.handoff], ['full', 'a full handoff (set full on 2026-11-13)']);
});

test('resize: a stage in work or awaiting keeps its status when its mode changes; its question stays', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail');
  p.write('handoff');
  awaitFounder(p.dir, 'handoff', { question: 'May it be built?', date: DAY });
  resize(p.dir, 'surface');
  const { stages, question, reasons } = p.state();
  assert.deepEqual([stages.frame.status, stages.detail.status, stages.handoff.status], ['stale', 'stale', 'awaiting']);
  assert.equal(reasons.handoff, 'resized from correction to surface');
  assert.equal(question, 'May it be built?');

  const q = pkg({ size: 'correction' });
  q.approve('frame', 'detail');
  begin(q.dir, 'handoff', { date: DAY });
  resize(q.dir, 'surface');
  assert.deepEqual([q.state().stages.handoff.status, q.state().reasons.handoff], ['in-work', 'resized from correction to surface']);
});

test('resize closes the open question of a stage it marks stale', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame');
  // No verb leaves a question on an approved stage, so the state is written by hand here.
  p.setState(state => Object.assign(state, { question: 'Still the job?', questionStage: 'frame' }));
  resize(p.dir, 'adjustment');
  assert.deepEqual([p.state().question, p.state().questionStage], [null, null]);
});

test('resize to the same size changes nothing, and a resize never skips a stage the route runs', () => {
  const p = pkg({ size: 'correction' });
  setRoute(p.dir, 'frame', 'full', { reason: 'a full frame', date: DAY });
  setRoute(p.dir, 'structure', 'full', { reason: 'the structure changes', date: DAY });
  setRoute(p.dir, 'detail', 'skipped', { reason: 'no detail work', date: DAY });
  resize(p.dir, 'correction');
  assert.deepEqual([p.state().route.frame, p.state().route.detail, p.state().stages.detail.status], ['full', 'skipped', 'skipped'],
    'a mode set above or below the size by hand stays');
  resize(p.dir, 'adjustment');
  assert.deepEqual([p.state().route.structure, p.state().stages.structure.status], ['full', 'not-started']);
});

// ---- validate

test('validate on a clean package: ok, no problems', () => {
  assert.deepEqual(validate(pkg().dir), { ok: true, problems: [] });
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('validate: a carry entry naming context@1#no-such-heading is carry-unresolved', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', {}, text('intent', ['- context@1#the-one-job']));
  stamp(p.dir, 'intent', { words: WORDS, date: DAY });
  p.edit('intent', s => s.replace('#the-one-job', '#no-such-heading'));
  assert.ok(p.codes().includes('intent:carry-unresolved'), p.codes().join(' '));
});

test("validate: an approved artefact's body changed on disk is changed-since-approval", () => {
  const p = pkg();
  p.approve('frame');
  p.edit('frame', s => s.replace('Find what is free now.', 'Find what is booked.'));
  assert.deepEqual(p.codes(), ['frame:changed-since-approval']);
});

test('validate: a header whose words, approval date, version or built-from differ from what was stamped is changed-since-approval', () => {
  const edits = [
    ['words', { words: 'no' }],
    ['approved', { approved: '2026-11-14' }],
    ['version', { version: 7 }],
    ['built-from', { 'built-from': ['frame@1', 'context@1'] }],
  ];
  for (const [field, header] of edits) {
    const p = pkg();
    p.approve('frame', 'context', 'intent');
    p.setHeader('intent', header);
    const changed = p.problems().filter(q => q.code === 'changed-since-approval');
    assert.deepEqual(changed.map(q => q.stage), ['intent'], field);
    assert.match(changed[0].message, new RegExp(`the header's ${field} changed after intent was stamped`), field);
  }
});

test('validate: artefacts and state written with CRLF give the same result as with LF', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', { 'built-from': ['frame@1', 'context@1'] }, text('intent', ['- context@1#the-one-job', '- frame@1#reviewed-by-the-founder']));
  stamp(p.dir, 'intent', { words: WORDS, date: DAY });
  const lf = validate(p.dir);
  assert.deepEqual(lf, { ok: true, problems: [] });
  for (const file of files(p.dir)) writeFileSync(file, readFileSync(file, 'utf8').replace(/\n/g, '\r\n'));
  assert.deepEqual(validate(p.dir), lf);
});

test('validate: a carry entry naming an earlier output that cannot be read is carry-unresolved', () => {
  const p = pkg();
  p.approve('frame');
  p.write('context', {}, text('context', ['- frame@1#the-one-job']));
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  unlinkSync(p.file('frame'));
  assert.deepEqual(p.codes(), ['frame:missing-artefact', 'context:carry-unresolved']);
  writeFileSync(p.file('frame'), '---\nstage: frame\n');
  assert.deepEqual(p.codes(), ['frame:bad-header', 'context:carry-unresolved']);
});

test('a source: carry entry is looked for from the project\'s root, the folder the command is run in: one that is not there is refused at the stamp, and reported by validate', () => {
  // A project of its own, apart from the kit: a file, a folder, and a name with a space.
  const project = fresh();
  mkdirSync(join(project, 'docs', 'the facts'), { recursive: true });
  writeFileSync(join(project, 'docs', 'product-facts.md'), 'facts');
  const there = ['- source:docs/product-facts.md', '- source: docs/the facts', `- source:${join(project, 'docs')}`];
  const p = pkg();
  p.write('frame', {}, text('frame', [...there, '- source:docs/not-written-yet.md']));
  const missing = `"- source:docs/not-written-yet.md": docs/not-written-yet.md is not there, looked for from ${project}: a source is named by its path from the project's root, where the command is run`;
  refusedOnce(() => stamp(p.dir, 'frame', { words: WORDS, date: DAY, root: project }), /^frame cannot be stamped:\n- "- source:docs\/not-written-yet\.md": docs\/not-written-yet\.md is not there, looked for from /);
  assert.equal(p.state().stages.frame.status, 'not-started');
  // From the kit's root, where this file runs, none of the project's three is there either.
  assert.throws(() => stamp(p.dir, 'frame', { words: WORDS, date: DAY }), e => refusal(e, /product-facts\.md is not there, looked for from /) && e.message.split('\n').length === 4);
  // Written, it is stamped; taken away again, validate says so of the approved stage, by the same words.
  writeFileSync(join(project, 'docs', 'not-written-yet.md'), 'now it is');
  stamp(p.dir, 'frame', { words: WORDS, date: DAY, root: project });
  assert.deepEqual(validate(p.dir, { root: project }), { ok: true, problems: [] });
  unlinkSync(join(project, 'docs', 'not-written-yet.md'));
  assert.deepEqual(validate(p.dir, { root: project }).problems, [{ stage: 'frame', code: 'carry-unresolved', message: missing }]);
  // The command line looks from the folder it is run in.
  const run = (cwd, ...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd });
  assert.deepEqual([run(project, 'validate', p.dir).status, run(project, 'validate', p.dir).stdout], [1, `frame: carry-unresolved: ${missing}\n`]);
  writeFileSync(join(project, 'docs', 'not-written-yet.md'), 'again');
  assert.deepEqual([run(project, 'validate', p.dir).status, run(project, 'validate', p.dir).stdout], [0, 'ok\n']);
  assert.equal(run(KIT, 'validate', p.dir).status, 1, 'from another folder the project\'s sources are not there');
});

test('validate: a stage awaiting, approved or stale without its output is missing-artefact; a stage in work is not', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  // The reopening comes first: a later stage awaiting when an earlier one is reopened goes back in work.
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.write('cast');
  p.force('cast', 'awaiting');
  const { stages } = p.state();
  assert.deepEqual(['frame', 'context', 'intent', 'cast'].map(s => stages[s].status), ['approved', 'in-work', 'stale', 'awaiting']);
  for (const stage of ['frame', 'context', 'intent', 'cast']) unlinkSync(p.file(stage));
  assert.deepEqual(p.codes(), ['frame:missing-artefact', 'intent:missing-artefact', 'cast:missing-artefact']);
});

test('validate: a header that does not match its stage and state is bad-header, reported once', () => {
  const approvedOnly = [
    ['a draft header on an approved stage', { status: 'draft' }],
    ['no approval date', { approved: '' }],
  ];
  for (const [name, header] of [...badHeaders.map(([n, h]) => [n, h]), ...approvedOnly]) {
    const p = pkg();
    p.approve('frame', 'context');
    p.setHeader('context', header);
    assert.deepEqual(p.codes().filter(code => code === 'context:bad-header'), ['context:bad-header'], `${name}: ${p.codes().join(' ')}`);
  }
  const p = pkg();
  p.approve('frame', 'context');
  writeFileSync(p.file('frame'), '---\nstage: frame\n');
  assert.ok(p.codes().includes('frame:bad-header'));
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.setHeader('context', { status: 'approved' });
  const problem = p.problems().find(q => q.stage === 'context');
  assert.deepEqual([problem.code, problem.message], ['bad-header', 'the header says approved while the state says in-work']);
});

// F62 of the dry run: a header rewritten whole after `await` said draft, and validate said ok.
test('validate: a header whose status disagrees with the state is bad-header, whichever status the state has', () => {
  const awaiting = () => {
    const p = pkg();
    p.approve('frame');
    p.write('context');
    awaitFounder(p.dir, 'context', { question: 'Is this the context?', date: DAY });
    return p;
  };
  let p = awaiting();
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] }, 'awaiting, as await wrote it');
  p.setHeader('context', { status: 'draft' });
  assert.deepEqual(p.problems(), [{ stage: 'context', code: 'bad-header', message: 'the header says draft while the state says awaiting' }]);
  p = awaiting();
  p.setHeader('context', { status: 'approved' });
  assert.deepEqual(p.problems().filter(q => q.code === 'bad-header').map(q => q.message), ['the header says approved while the state says awaiting']);
  p = awaiting();
  begin(p.dir, 'context', { date: DAY });
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] }, 'in work, with the draft header begin wrote');
  p.setHeader('context', { status: 'awaiting' });
  assert.deepEqual(p.problems(), [{ stage: 'context', code: 'bad-header', message: 'the header says awaiting while the state says in-work' }]);
  // A status the header cannot have is reported once, as that, and not as a disagreement too.
  p.setHeader('context', { status: 'done' });
  assert.deepEqual(p.problems().map(q => q.message), ['the header status must be one of draft, awaiting, approved']);
  p = pkg();
  p.approve('frame', 'context');
  p.setHeader('context', { status: 'awaiting' });
  assert.deepEqual(p.problems().filter(q => q.code === 'bad-header').map(q => q.message), ['the header says awaiting while the state says approved']);
});

test('validate: a stage in work whose built-from names itself is bad-header and nothing else', () => {
  const p = pkg();
  p.approve('frame', 'context');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.setHeader('context', { 'built-from': ['frame@1', 'context@2'] });
  assert.deepEqual(p.codes(), ['context:bad-header']);
});

test('validate: a stage not started whose header says approved is bad-header', () => {
  const p = pkg();
  p.write('frame', { status: 'approved' });
  assert.deepEqual(p.problems(), [{ stage: 'frame', code: 'bad-header', message: 'the header says approved while the state says not-started' }]);
  p.write('frame');
  writeFileSync(p.file('context'), '---\nstage: context\n');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] }, 'a stage not started is otherwise not looked at');
});

test('validate: a stale stage, and an input at another version, are stale-input', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.deepEqual(p.codes(), ['intent:stale-input']);
  const q = pkg();
  q.approve('frame', 'context');
  q.setHeader('context', { 'built-from': ['frame@2'] });
  assert.deepEqual(q.codes(), ['context:stale-input', 'context:changed-since-approval']);
});

test('validate gives the recorded reason a stage is stale', () => {
  const p = pkg();
  p.approve('frame', 'context');
  setRoute(p.dir, 'context', 'short', { reason: 'a narrower context', date: DAY });
  assert.deepEqual(p.problems(), [{ stage: 'context', code: 'stale-input',
    message: 'context is stale: a narrower context (set short on 2026-11-13); redo it or re-confirm it, then stamp it' }]);
  p.setState(state => { delete state.reasons.context; });
  assert.match(p.problems()[0].message, /^context is stale: no reason recorded;/);
});

test('validate: an approved stage stamped without the stage now before it on the route is stale-input', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame', 'context', 'intent', 'cast', 'detail');
  // structure put on the route by hand, without what route does when it adds a stage
  p.setState(state => { state.route.structure = 'short'; state.stages.structure.status = 'not-started'; });
  assert.deepEqual(p.problems(), [{ stage: 'detail', code: 'stale-input',
    message: 'detail was stamped without structure, the stage before it on the route; redo it on structure' }]);
});

test('validate: a skipped stage with no reason is skip-without-reason', () => {
  const p = pkg({ size: 'adjustment' });
  p.setState(state => { delete state.reasons.structure; });
  assert.deepEqual(p.codes(), ['structure:skip-without-reason']);
});

test('validate: an approved stage whose header or state has no words is approved-without-words', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.setHeader('frame', { words: '' });
  p.setState(state => { state.stages.context.words = ''; });
  assert.deepEqual(p.codes(), [
    'frame:approved-without-words', 'frame:changed-since-approval', 'context:approved-without-words', 'context:changed-since-approval',
  ]);
});

// ---- next, the state file, STATE.md

test('next: intent once frame and context are approved; null once every routed stage is approved', () => {
  const p = pkg();
  p.approve('frame', 'context');
  assert.equal(next(p.dir), 'intent');
  p.approve(...STAGES.slice(2));
  assert.equal(next(p.dir), null);
  const q = pkg({ size: 'correction' });
  q.approve('frame', 'detail', 'handoff', 'acceptance');
  assert.equal(next(q.dir), null);
});

test('every verb refuses a folder that is not a package, and a state.json that is not valid JSON', () => {
  const dir = fresh();
  mkdirSync(dir);
  const verbs = [
    () => validate(dir), () => next(dir), () => status(dir), () => resize(dir, 'flow'),
    () => begin(dir, 'frame', { date: DAY }), () => setRoute(dir, 'frame', 'short', { reason: 'r', date: DAY }),
  ];
  for (const fn of verbs) refused(fn, /no state\.json; run init/);
  const p = pkg();
  writeFileSync(join(p.dir, 'state.json'), '{ "size": ');
  refused(() => validate(p.dir), /not valid JSON/);
});

test('a damaged state.json is refused, saying what is damaged', () => {
  const damages = [
    [() => null, /it is not an object/],
    [state => { state.size = 'huge'; }, /unknown size "huge"/],
    [state => { state.route = 'full'; }, /route is not an object/],
    [state => { state.reasons = []; }, /reasons is not an object/],
    [state => { state.stages = null; }, /stages is not an object/],
    [state => { state.route.cast = 'long'; }, /the route of cast is "long"/],
    [state => { delete state.stages.look; }, /stage look is missing/],
    [state => { state.stages.cast.status = 'done'; }, /stage cast has status "done"/],
    [state => { state.stages.cast.version = 1.5; }, /stage cast has version 1\.5/],
    [state => { state.stages.cast.version = 0; }, /stage cast has version 0/],
  ];
  for (const [damage, pattern] of damages) {
    const p = pkg();
    const state = p.state();
    const replaced = damage(state);
    writeFileSync(join(p.dir, 'state.json'), JSON.stringify(replaced === undefined ? state : replaced));
    refused(() => next(p.dir), new RegExp(`damaged \\(${pattern.source}\\)`));
  }
});

test('a file-system failure on the package is a StateError naming the path, and leaves no temporary file', () => {
  const p = pkg();
  rmSync(join(p.dir, 'state.json'));
  mkdirSync(join(p.dir, 'state.json'));
  refused(() => next(p.dir), /cannot read .*state\.json: EISDIR/);
  const q = pkg();
  mkdirSync(q.file('frame'));
  refused(() => stamp(q.dir, 'frame', { words: WORDS, date: DAY }), /cannot read .*00-frame\.md: EISDIR/);
  const r = pkg();
  rmSync(join(r.dir, 'STATE.md'));
  mkdirSync(join(r.dir, 'STATE.md'));
  refused(() => begin(r.dir, 'frame', { date: DAY }), /cannot write .*STATE\.md: E[A-Z]+/);
  assert.deepEqual(readdirSync(r.dir).filter(f => f.endsWith('.tmp')), []);
});

test('state.json with a byte-order mark is read', () => {
  const p = pkg();
  writeFileSync(join(p.dir, 'state.json'), `\uFEFF${readFileSync(join(p.dir, 'state.json'), 'utf8')}`);
  assert.equal(next(p.dir), 'frame');
});

test('STATE.md shows the design, kind, foundation, size, a row per stage and the open question, from state.json', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  for (const word of ['front desk', 'working-surface', 'new-surface', 'adjustment']) assert.ok(p.page().includes(word), word);
  for (const stage of STAGES) assert.ok(p.page().includes(`| \`${ARTEFACT[stage]}\` |`), stage);
  assert.match(p.page(), /^\| frame \| full \| approved \| 1 \| — \| 2026-11-13 \| `00-frame\.md` \| — \|$/m);
  assert.match(p.page(), /^\| context \| short \| not-started \| — \| — \| — \| `01-context\.md` \| — \|$/m);
  assert.match(p.page(), /^\| structure \| skipped \| skipped \| — \| — \| — \| `04-structure\/CHOSEN\.md` \| the adjustment route skips it \|$/m);
  assert.match(p.page(), /## Open question\n\nNone\./);
  reopen(p.dir, 'frame', { reason: 'thin | wrong', date: DAY });
  assert.match(p.page(), /^\| frame \| full \| in-work \| 2 \| — \| — \| `00-frame\.md` \| reopened on 2026-11-13: thin \\\| wrong \|$/m);
  assert.equal(status(p.dir), p.page());
  assert.ok(!p.page().includes('\r'));
  assert.deepEqual(files(p.dir).filter(f => f.endsWith('.tmp')), []);
});

test('STATE.md points at the cast: its status and version, or why the route skips it', () => {
  const p = pkg();
  assert.match(p.page(), /^- Cast: not chosen yet$/m);
  p.approve('frame', 'context', 'intent');
  begin(p.dir, 'cast', { date: DAY });
  assert.match(p.page(), /^- Cast: `03-cast\.md` — in-work, version 1$/m);
  p.approve('cast');
  assert.match(p.page(), /^- Cast: `03-cast\.md` — approved, version 1$/m);
  const q = pkg({ size: 'correction' });
  assert.match(q.page(), /^- Cast: skipped by the route — the correction route skips it$/m);
  q.setState(state => { delete state.reasons.cast; });
  begin(q.dir, 'frame', { date: DAY });
  assert.match(q.page(), /^- Cast: skipped by the route — no reason given$/m);
});

test('STATE.md shows since only while a stage is in work or awaiting; stamp and reopen clear it', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.approve('context');
  begin(p.dir, 'intent', { date: '2026-11-14' });
  assert.match(p.page(), /^\| intent \| full \| in-work \| 1 \| 2026-11-14 \|/m);
  awaitFounder(p.dir, 'intent', { question: 'Still the one job?', date: '2026-11-15' });
  assert.match(p.page(), /^\| intent \| full \| awaiting \| 1 \| 2026-11-15 \|/m);
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.equal(p.state().stages.intent.since, '2026-11-15');
  assert.match(p.page(), /^\| intent \| full \| stale \| 1 \| — \|/m);
  reopen(p.dir, 'intent', { reason: 'r', date: DAY });
  assert.equal(p.state().stages.intent.since, null);
  const q = pkg();
  begin(q.dir, 'frame', { date: DAY });
  q.approve('frame');
  assert.equal(q.state().stages.frame.since, null);
});

test('slug: lower-cased, every run of characters that are not letters or digits made one -, trimmed of -', () => {
  assert.equal(slug("The founder's own words"), 'the-founder-s-own-words');
  assert.equal(slug('  ¿Qué puede mostrar, hoy?  '), 'qué-puede-mostrar-hoy');
  assert.equal(slug('Qué'.normalize('NFD')), 'qué');
  assert.equal(slug('Step 2 — the Look'), 'step-2-the-look');
});

// ---- the command line

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

test('the CLI runs a package: init, stamp, next, status, validate, reopen, resize, each exiting 0', () => {
  const dir = fresh();
  let r = run('init', dir, '--design', 'front desk', '--kind', 'working-surface', '--foundation', 'new-surface', '--size', 'adjustment', '--date', DAY);
  assert.deepEqual([r.status, r.stdout], [0, `initialised ${dir}: working-surface, new-surface, adjustment; next: frame\n`]);
  writeFileSync(join(dir, ARTEFACT.frame), serialize({ stage: 'frame', version: 1, status: 'draft', 'built-from': [] }, text('frame')));
  r = run('stamp', dir, 'frame', '--words', 'sí,\ncontinúa');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /frame/);
  const { data } = parse(readFileSync(join(dir, ARTEFACT.frame), 'utf8'));
  assert.equal(data.approved, today());
  assert.equal(data.words, 'sí, continúa');
  r = run('next', dir);
  assert.deepEqual([r.status, r.stdout], [0, 'context\n']);
  r = run('status', dir);
  assert.deepEqual([r.status, r.stdout], [0, readFileSync(join(dir, 'STATE.md'), 'utf8')]);
  r = run('validate', dir);
  assert.deepEqual([r.status, r.stdout], [0, 'ok\n']);
  r = run('reopen', dir, 'frame', '--reason=the job changed', '--date', DAY);
  assert.deepEqual([r.status, r.stdout], [0, 'reopened frame at version 2; stale: none; back in work: none\n']);
  r = run('resize', dir, '--size', 'flow');
  assert.deepEqual([r.status, r.stdout], [0, `resized ${dir} to flow\n`]);
  assert.equal(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')).size, 'flow');
});

test('the CLI begin and await: 0 on success, 1 on a refusal, 2 on missing arguments', () => {
  const p = pkg({ size: 'adjustment' });
  let r = run('begin', p.dir, 'frame');
  assert.deepEqual([r.status, r.stdout], [0, 'frame is in work\n']);
  assert.deepEqual([p.state().stages.frame.status, p.state().stages.frame.since], ['in-work', today()]);
  p.write('frame');
  r = run('await', p.dir, 'frame', '--question', 'Is the job\nright?', '--date', DAY);
  assert.deepEqual([r.status, r.stdout], [0, 'frame awaits the founder\n']);
  assert.deepEqual([p.state().stages.frame.status, p.state().question], ['awaiting', 'Is the job right?']);
  r = run('begin', p.dir, 'frame');
  assert.deepEqual([r.status, r.stdout], [0, 'frame is in work\n']);
  assert.deepEqual([p.state().stages.frame.status, p.state().question], ['in-work', null]);
  r = run('begin', p.dir, 'structure');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /skipped/);
  r = run('await', p.dir, 'frame', '--question', '');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /without the one question/);
  for (const [args, pattern] of [[['begin', p.dir], /begin takes <package> <stage>, got 1/], [['await', p.dir, 'frame'], /await needs --question/]]) {
    r = run(...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, pattern);
  }
});

test('the CLI route: 0 on success, 1 on a refusal, 2 on missing arguments', () => {
  const p = pkg({ size: 'adjustment' });
  let r = run('route', p.dir, 'structure', 'short', '--reason', 'the structure changes', '--date', DAY);
  assert.deepEqual([r.status, r.stdout], [0, 'structure is routed short\n']);
  assert.equal(p.state().route.structure, 'short');
  r = run('route', p.dir, 'structure', 'long', '--reason', 'r');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown route "long"/);
  for (const [args, pattern] of [
    [['route', p.dir, 'structure', '--reason', 'r'], /route takes <package> <stage> <mode>, got 2/],
    [['route', p.dir, 'structure', 'short'], /route needs --reason/],
  ]) {
    r = run(...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, pattern);
  }
});

test('the CLI slug prints the slug of a heading', () => {
  let r = run('slug', "The founder's own words");
  assert.deepEqual([r.status, r.stdout], [0, 'the-founder-s-own-words\n']);
  r = run('slug');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /slug takes <heading text>, got 0/);
});

test('the CLI prints none when every routed stage is approved', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail', 'handoff', 'acceptance');
  assert.deepEqual([run('next', p.dir).status, run('next', p.dir).stdout], [0, 'none\n']);
});

test('the CLI exits 1 on a refusal and on a problem found, printing the message without a stack', () => {
  const p = pkg();
  p.approve('frame');
  let r = run('stamp', p.dir, 'frame', '--words', 'again');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already approved/);
  p.edit('frame', s => s.replace('Find what is free now.', 'Find what is booked.'));
  r = run('validate', p.dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^frame: changed-since-approval: [^\n]+\n$/);
  r = run('init', fresh(), '--design', 'd', '--kind', 'Radiology Shell', '--foundation', 'new-surface', '--size', 'surface');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /kebab/);
  const file = join(root, 'cli-file');
  writeFileSync(file, 'not a folder');
  r = run('init', file, '--design', 'd', '--kind', 'form', '--foundation', 'new-surface', '--size', 'surface');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^cannot create the folder .*cli-file: E[A-Z]+\n$/);
});

test('the CLI prints an unexpected error with its stack and exits 1', () => {
  const p = pkg();
  const preload = join(root, 'explode.mjs');
  writeFileSync(preload, [
    "import fs from 'node:fs';",
    "import { syncBuiltinESMExports } from 'node:module';",
    'const read = fs.readFileSync;',
    "fs.readFileSync = (file, ...rest) => { if (String(file).endsWith('state.json')) throw new Error('an unexpected failure'); return read(file, ...rest); };",
    'syncBuiltinESMExports();',
  ].join('\n'));
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, cli, 'next', p.dir], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Error: an unexpected failure\n\s+at /);
});

test('the CLI exits 2 on bad usage', () => {
  const dir = pkg().dir;
  const usages = [
    [[], /no verb given/],
    [['bogus', dir], /unknown verb "bogus"/],
    [['validate'], /validate takes <package>, got 0/],
    [['validate', dir, 'extra'], /validate takes <package>, got 2/],
    [['validate', dir, '--words', 'x'], /--words does not apply to validate/],
    [['init', dir, '--colour', 'red'], /unknown flag --colour/],
    [['init', fresh(), '--design', 'd', '--kind', 'form', '--foundation', 'new-surface'], /init needs --size/],
    [['stamp', dir, '--words', 'yes'], /stamp takes <package> <stage>, got 1/],
    [['stamp', dir, 'frame', '--words'], /--words needs a value/],
    [['stamp', dir, 'frame', '--words', 'yes', '--words', 'no'], /--words is given twice/],
    [['reopen', dir, 'frame'], /reopen needs --reason/],
    [['resize', dir], /resize needs --size/],
  ];
  for (const [args, pattern] of usages) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.match(r.stderr, pattern, args.join(' '));
    assert.match(r.stderr, /Usage:/, args.join(' '));
  }
});

test('the CLI --help names every verb and flag, says line breaks in --words become one space, and exits 0', () => {
  for (const args of [['--help'], ['stamp', '--help'], ['-h']]) {
    const r = run(...args);
    assert.equal(r.status, 0);
    for (const word of ['init', 'begin', 'await', 'stamp', 'reopen', 'route', 'resize', 'validate', 'next', 'status', 'slug',
      '<full|short|skipped>', '--design', '--kind', '--foundation', '--size', '--words', '--question', '--reason', '--date']) {
      assert.ok(r.stdout.includes(word), word);
    }
    assert.match(r.stdout, /--words, --question.*: each line break in them becomes a single space/);
    // What the verbs hold a stage to, as the library does.
    const said = r.stdout.replace(/\s+/g, ' ');
    for (const sentence of [
      'begin <package> <stage> [--date <day>] mark the stage in work since the day; its output need not exist yet; closes its open question. Refused while a stage the route runs before it is not approved.',
      'with the one open question. Refused while a stage the route runs before it is not approved.',
      'It must hold what he said under "## Reviewed by the founder", and nothing left of its template: not the opening comment, and no instruction in braces on lines of its own.',
      'and sources that are there: a file or a folder, by its path from the folder this command is run in, which is the project\'s root.',
      'Every file of the stage\'s folder (04-structure/ to 08-acceptance/) is recorded with the stamp, what a mount or a file browser leaves behind passed over.',
      'Prints both lists: "stale:", then "back in work:".',
      'a file of the stage\'s folder that changed, was removed or was added since (a text file\'s line endings aside). A stage stamped before folders were recorded is held to its output alone.',
    ]) assert.ok(said.includes(sentence), sentence);
  }
});

// ---- the stale chain through a skipped stage (R39), and a stage's two notes

const TONIGHT = stage => text(stage).replace('Find what is free now.', 'Find what is free tonight.');
const FRAME_2 = 'frame went to version 2 on 2026-11-13';

test('a skip keeps what the stage was stamped as built from: a change above it reaches through it, skipped or put back, to what was built on it', () => {
  // All nine approved; the context made stale and skipped; then the frame redone with another body.
  const p = pkg();
  p.approve(...STAGES);
  setRoute(p.dir, 'context', 'short', { reason: 'a narrower context', date: DAY });
  setRoute(p.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  assert.deepEqual(p.state().stages.context.builtFrom, ['frame@1']);
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  p.write('frame', {}, TONIGHT('frame'));
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 2 });
  let { stages, staleBecause } = p.state();
  assert.deepEqual([stages.context.status, staleBecause.context], ['skipped', undefined], 'a skipped stage holds no approval to lose');
  for (const stage of STAGES.slice(2)) assert.deepEqual([stages[stage].status, staleBecause[stage]], ['stale', FRAME_2], stage);
  assert.equal(next(p.dir), 'intent');
  assert.deepEqual(p.codes(), STAGES.slice(2).map(stage => `${stage}:stale-input`));
  // Put back, the context is to be made again, and nothing built on it passes for approved meanwhile.
  setRoute(p.dir, 'context', 'full', { reason: 'a context after all', date: DAY });
  assert.deepEqual([p.state().stages.context.status, next(p.dir)], ['not-started', 'context']);

  // Skipped and put back before the frame moves: not started, with what it was built from still on record.
  const q = skippedAndPutBack();
  assert.deepEqual([q.state().stages.context.status, q.state().stages.context.builtFrom], ['not-started', ['frame@1']]);
  setRoute(q.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  q.write('frame', {}, TONIGHT('frame'));
  assert.deepEqual(stamp(q.dir, 'frame', { words: WORDS, date: DAY }), { version: 2 });
  ({ stages, staleBecause } = q.state());
  assert.deepEqual([stages.context.status, staleBecause.context], ['not-started', undefined]);
  for (const stage of STAGES.slice(2)) assert.deepEqual([stages[stage].status, staleBecause[stage]], ['stale', FRAME_2], stage);

  // A reopening reaches through a skipped stage the same way.
  const r = pkg();
  r.approve(...STAGES);
  setRoute(r.dir, 'context', 'short', { reason: 'a narrower context', date: DAY });
  setRoute(r.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  assert.deepEqual(reopen(r.dir, 'frame', { reason: 'the request changed', date: DAY }), { version: 2, stale: STAGES.slice(2), recalled: [] });
  assert.equal(r.state().stages.context.status, 'skipped');
});

test('a stage has two notes: a route reason given by hand stays when a change above, or a stage added before it, marks it stale; the stale note goes when it is approved again', () => {
  const ROUTE = 'only the label changes (set short on 2026-11-13)';
  const MOVED = 'context went to version 2 on 2026-11-13';
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  setRoute(p.dir, 'intent', 'short', { reason: 'only the label changes', date: DAY });
  assert.equal(p.problems()[0].message, `intent is stale: ${ROUTE}; redo it or re-confirm it, then stamp it`, 'the route\'s note says why, where nothing else moved');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.deepEqual([p.state().reasons.intent, p.state().staleBecause.intent], [ROUTE, MOVED]);
  assert.match(p.page(), /^\| intent \| short \| stale \| 1 \| — \| 2026-11-13 \| `02-intent\.md` \| only the label changes \(set short on 2026-11-13\); context went to version 2 on 2026-11-13 \|$/m);
  assert.deepEqual(p.problems().filter(q => q.stage === 'intent'), [{ stage: 'intent', code: 'stale-input', message: `intent is stale: ${MOVED}; redo it or re-confirm it, then stamp it` }]);
  // Begun and put to him again, it still says what moved; approved again, it no longer does.
  p.approve('context');
  begin(p.dir, 'intent', { date: DAY });
  p.write('intent');
  assert.equal(p.state().staleBecause.intent, MOVED);
  stamp(p.dir, 'intent', { words: WORDS, date: DAY });
  assert.deepEqual([p.state().reasons.intent, p.state().staleBecause.intent], [ROUTE, undefined]);
  assert.match(p.page(), /^\| intent \| short \| approved \| 1 \| — \| 2026-11-13 \| `02-intent\.md` \| only the label changes \(set short on 2026-11-13\) \|$/m);

  // A stage added before it: the same note, and the same end.
  const q = pkg({ size: 'adjustment' });
  q.approve('frame', 'context', 'intent', 'cast');
  setRoute(q.dir, 'detail', 'full', { reason: 'every state is redrawn', date: DAY });
  q.approve('detail');
  setRoute(q.dir, 'structure', 'short', { reason: 'the structure changes', date: DAY });
  assert.deepEqual([q.state().reasons.detail, q.state().staleBecause.detail], ['every state is redrawn (set full on 2026-11-13)', 'structure was added to the route before it']);
  q.approve('structure', 'detail');
  assert.deepEqual([q.state().reasons.detail, q.state().staleBecause.detail, q.state().stages.detail.status], ['every state is redrawn (set full on 2026-11-13)', undefined, 'approved']);

  // Reopened or skipped, a stage is no longer stale: its stale note goes with that.
  const r = pkg();
  r.approve('frame', 'context', 'intent', 'cast');
  reopen(r.dir, 'frame', { reason: 'r', date: DAY });
  assert.deepEqual(Object.keys(r.state().staleBecause), ['context', 'intent', 'cast']);
  setRoute(r.dir, 'context', 'skipped', { reason: 'no context this time', date: DAY });
  r.approve('frame');
  reopen(r.dir, 'intent', { reason: 'r', date: DAY });
  assert.deepEqual(Object.keys(r.state().staleBecause), ['cast']);
  assert.match(r.state().reasons.intent, /^reopened on 2026-11-13: r$/);

  // A state written before a stage had two notes holds what moved under it in the one it had: it is read.
  const old = pkg();
  old.approve('frame', 'context');
  reopen(old.dir, 'frame', { reason: 'r', date: DAY });
  old.setState(state => {
    state.reasons.context = state.staleBecause.context;
    delete state.staleBecause;
  });
  assert.deepEqual(old.problems().map(q => q.message), ['context is stale: frame went to version 2 on 2026-11-13; redo it or re-confirm it, then stamp it']);
  old.approve('frame');
  assert.deepEqual(old.state().staleBecause, {});
});

test('route leaves the open question where it is when only a mode changes: the stage is still in front of him', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY });
  const asked = () => [p.state().stages.context.status, p.state().question, p.state().questionStage, p.read('context').data.status];
  // Its own mode, short to full.
  setRoute(p.dir, 'context', 'full', { reason: 'the context is wider', date: DAY });
  assert.deepEqual([p.state().route.context, ...asked()], ['full', 'awaiting', 'Which angle?', 'context', 'awaiting']);
  // Another stage's: routed otherwise, skipped, and put on the route.
  setRoute(p.dir, 'intent', 'full', { reason: 'r', date: DAY });
  setRoute(p.dir, 'look', 'skipped', { reason: 'r', date: DAY });
  setRoute(p.dir, 'structure', 'short', { reason: 'r', date: DAY });
  assert.deepEqual(asked(), ['awaiting', 'Which angle?', 'context', 'awaiting']);
  assert.match(p.page(), /## Open question\n\ncontext: Which angle\?\n/);
});

// ---- nothing before the gate that precedes it (G16)

test('begin and await refuse a stage while a stage the route runs before it is not approved; a skipped stage is passed over, and nothing is written', () => {
  const p = pkg();
  p.approve('frame');
  p.write('detail', { 'built-from': ['frame@1'] });
  const before = [readFileSync(join(p.dir, 'state.json'), 'utf8'), readFileSync(p.file('detail'), 'utf8')];
  const held = (stage, by, status) => new RegExp(`^${stage} cannot (?:be begun|await the founder): ${by}, before it on the route, is ${status}, not approved; \`next\` names the stage to run$`);
  refused(() => begin(p.dir, 'detail', { date: DAY }), /^detail cannot be begun: context, before it on the route, is not-started, not approved; `next` names the stage to run$/);
  refused(() => awaitFounder(p.dir, 'detail', { question: 'Do you approve this prototype for Look?', date: DAY }), /^detail cannot await the founder: context, before it on the route, is not-started, not approved; `next` names the stage to run$/);
  assert.deepEqual([readFileSync(join(p.dir, 'state.json'), 'utf8'), readFileSync(p.file('detail'), 'utf8')], before, 'nothing is written');
  assert.equal(next(p.dir), 'context');
  // Whatever keeps the stage before it from being approved holds it back: in work, awaiting, stale.
  begin(p.dir, 'context', { date: DAY });
  refused(() => begin(p.dir, 'intent', { date: DAY }), held('intent', 'context', 'in-work'));
  p.write('context');
  awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY });
  refused(() => begin(p.dir, 'intent', { date: DAY }), held('intent', 'context', 'awaiting'));
  p.write('intent');
  refused(() => awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY }), held('intent', 'context', 'awaiting'));
  assert.equal(p.state().questionStage, 'context', 'the question in front of him is still the one asked');
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  begin(p.dir, 'intent', { date: DAY });
  awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY });
  // Not only the stage just before it: the first one on the route that is not approved is named.
  setRoute(p.dir, 'frame', 'short', { reason: 'a smaller frame', date: DAY });
  refused(() => begin(p.dir, 'intent', { date: DAY }), held('intent', 'frame', 'stale'));
  refused(() => awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY }), held('intent', 'frame', 'stale'));
  refused(() => begin(p.dir, 'acceptance', { date: DAY }), held('acceptance', 'frame', 'stale'));
  // The first stage has none before it, whatever comes after.
  begin(p.dir, 'frame', { date: DAY });
  assert.equal(p.state().stages.frame.status, 'in-work');

  // A correction: the stages its route skips are passed over, and the order of the four still holds.
  const c = pkg({ size: 'correction' });
  refused(() => begin(c.dir, 'detail', { date: DAY }), held('detail', 'frame', 'not-started'));
  c.approve('frame');
  begin(c.dir, 'detail', { date: DAY });
  refused(() => begin(c.dir, 'handoff', { date: DAY }), held('handoff', 'detail', 'in-work'));
  c.approve('detail', 'handoff');
  c.write('acceptance');
  awaitFounder(c.dir, 'acceptance', { question: 'Is the build what you nodded at?', date: DAY });
  assert.equal(c.state().stages.acceptance.status, 'awaiting');

  // The command line: exit 1, the one line, no stack.
  const d = pkg();
  for (const args of [['begin', d.dir, 'detail'], ['await', d.dir, 'detail', '--question', 'Do you approve?']]) {
    const r = run(...args);
    assert.deepEqual([r.status, r.stdout], [1, ''], args.join(' '));
    assert.match(r.stderr, /^detail cannot (be begun|await the founder): frame, before it on the route, is not-started, not approved; `next` names the stage to run\n$/);
  }
});

// ---- his words in the output, and nothing of the template (G7)

// A body with the section given where "Reviewed by the founder" goes, between a filled heading and the carry list.
const reviewed = section => `# Frame\n\n## The one job\n\nFind what is free now.\n${section}\n## Carry\n\n- source:README.md\n`;
const SAY = 'what he said is written there, in his words, before the stamp';
const stamped = (p, stage = 'frame') => stamp(p.dir, stage, { words: WORDS, date: DAY });

test('stamp refuses an output that holds none of his words: no "Reviewed by the founder" section, or one that holds nothing but an instruction in braces', () => {
  const p = pkg();
  const none = [`00-frame.md has no "## Reviewed by the founder" section: ${SAY}`];
  const empty = [`00-frame.md holds nothing under "## Reviewed by the founder": ${SAY}`];
  const instructed = [
    '00-frame.md still holds an instruction in braces of its template, under "Reviewed by the founder": replace each with what it asks for',
    `00-frame.md holds nothing under "## Reviewed by the founder" but an instruction in braces: ${SAY}`,
  ];
  const cases = [
    ['', none],
    // A heading of another level, or of other words, is not the section.
    ['\n### Reviewed by the founder\n\nYes.\n', none],
    ['\n## Reviewed\n\nYes.\n', none],
    ['\n## Reviewed by the founder\n', empty],
    ['\n## Reviewed by the founder\n\n   \n', empty],
    // The comment every template keeps above the carry list is not his words.
    ['\n## Reviewed by the founder\n\n<!-- The carry list is the last section: what the next stage may open\n     besides this output. -->\n', empty],
    // The section as each template has it: one instruction, on one line or on two.
    ['\n## Reviewed by the founder\n\n{What he corrected, and the words he confirmed it with, as he said them.}\n', instructed],
    ['\n## Reviewed by the founder\n\n{What he corrected, and the words he approved the prototype with, as he said them. Where the words are\nthe product, his answer on the words is written apart.}\n\n<!-- The carry list is the last section. -->\n', instructed],
  ];
  for (const [section, problems] of cases) {
    p.write('frame', {}, reviewed(section));
    assert.throws(() => stamped(p), e => e instanceof StateError && e.message === `frame cannot be stamped:\n${problems.map(q => `- ${q}`).join('\n')}`, JSON.stringify(section));
    assert.equal(p.state().stages.frame.status, 'not-started');
    assert.equal(p.read('frame').data.status, 'draft');
  }
  // His words in any shape pass: a line, a list, a quote in a fence, a heading of its own under the section,
  // the short form of a correction. The frame is stale, and so stamped again, for each.
  const said = [
    '\n## Reviewed by the founder\n\nYes.\n',
    '\n## Reviewed by the founder\n\n- "sí, continúa"\n',
    '\n## Reviewed by the founder\n\n```\nsí, continúa\n```\n',
    '\n## Reviewed by the founder\n\n### On the words\n\n"Book room", not "Reserve".\n',
    '\n## Reviewed by the founder\n\nIt should read "Book room". The line waits for his nod at Detail.\n\n<!-- The carry list is the last section. -->\n',
  ];
  for (const section of said) {
    p.write('frame', {}, reviewed(section));
    stamped(p);
    assert.equal(p.state().stages.frame.status, 'approved', JSON.stringify(section));
    assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
    setRoute(p.dir, 'frame', p.state().route.frame === 'full' ? 'short' : 'full', { reason: 'r', date: DAY });
  }
});

test('stamp refuses what is left of the template: its opening comment, and an instruction in braces on lines of its own; braces in fenced code, in a JSON object and inside a line are let be', () => {
  const p = pkg();
  const YES = '\n## Reviewed by the founder\n\nYes.\n';
  const body = (before, under = '') => `${before}# Frame\n\n## The request\n\n${under}\n## The one job\n\nFind what is free now.\n${YES}\n## Carry\n\n- source:README.md\n`;
  const COMMENT = '<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this\n     comment. The header is the state script\'s. -->\n\n';
  const left = (n, where) => `00-frame.md still holds ${n === 1 ? 'an instruction in braces' : `${n} instructions in braces`} of its template, ${where}: replace each with what it asks for`;
  const cases = [
    [body(COMMENT, 'A booking action.\n'), ['00-frame.md still holds its template\'s opening comment: it is deleted once the template is filled in']],
    [body('', '{What he asked for, in his own words, as he wrote it. Never a summary.}\n'), [left(1, 'under "The request"')]],
    [body('', '{A correction needs only the request, the three values and its route in one line. At any other size,\ndelete this line.}\n'), [left(1, 'under "The request"')]],
    // An instruction that holds braces of its own is one still; up to three lines of indent are no code.
    [body('', '   {Each stage\'s mode, as the size sets it: {full · short · skipped}.}\n'), [left(1, 'under "The request"')]],
    [body('{The design\'s name.}\n\n', 'A booking action.\n'), [left(1, 'before its first heading')]],
    [body(COMMENT, '{What he asked for.}\n\n{And why.}\n\n### Who\n\n{One profile.}\n\n### Where\n\n{The screen.}\n\n### When\n\n{The day.}\n'), [
      '00-frame.md still holds its template\'s opening comment: it is deleted once the template is filled in',
      left(5, 'under "The request", under "Who", under "Where" and 1 more'),
    ]],
  ];
  for (const [text_, problems] of cases) {
    p.write('frame', {}, text_);
    assert.throws(() => stamped(p), e => e instanceof StateError && e.message === `frame cannot be stamped:\n${problems.map(q => `- ${q}`).join('\n')}`, text_);
    assert.equal(p.state().stages.frame.status, 'not-started');
  }
  // What is no instruction left over: all of it in one output, which is stamped.
  const let_be = [
    '```json\n{\n  "id": "book-action"\n}\n```\n',
    '~~~\n{What the fence holds is shown, not asked.}\n<!-- Template. A comment shown as code. -->\n~~~\n',
    '{ "id": "book-action", "type": "visible" }\n',
    '{\n  "id": "book-action"\n}\n',
    '| Kind | {working-surface · first-run} | {what the interface is for} |\n',
    'The greeting reads {name}, then the day.\n',
    '{name}, you have {count} rooms free: {rooms}\n',
    '{count} rooms free, as {rooms}\n\nThe braces above name two things on one line.\n',
    '{an aside left open before a blank line\n\nand a later line that happens to end in a brace: }\n',
    '{an aside that is never closed\n',
    '<!-- A note of the stage\'s own, with {braces} in it. -->\n',
  ].join('\n');
  p.write('frame', {}, body('', let_be).replace('# Frame', '# Frame · {the design\'s name}'));
  stamped(p);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('validate reports the same of an approved stage, as of one stamped before the stamp looked', () => {
  const p = pkg();
  p.approve('frame', 'context');
  // Stamped by an earlier script: the template as it came, its hash on record.
  const unfilled = '<!-- Template. Replace each {instruction in braces}, and delete this comment. -->\n\n# Context\n\n## Product facts\n\n{What the product can show, today.}\n\n## Reviewed by the founder\n\n{What he corrected, and the words he approved it with, as he said them.}\n\n## Carry\n\n- source:README.md\n';
  p.write('context', { status: 'approved', approved: DAY, words: WORDS }, unfilled);
  p.setState(state => (state.stages.context.hash = createHash('sha256').update(unfilled, 'utf8').digest('hex')));
  assert.deepEqual(p.problems(), [
    { stage: 'context', code: 'unfilled', message: '01-context.md still holds its template\'s opening comment: it is deleted once the template is filled in' },
    { stage: 'context', code: 'unfilled', message: '01-context.md still holds 2 instructions in braces of its template, under "Product facts", under "Reviewed by the founder": replace each with what it asks for' },
    { stage: 'context', code: 'approved-without-words', message: `01-context.md holds nothing under "## Reviewed by the founder" but an instruction in braces: ${SAY}` },
  ]);
  // A stage that is not approved yet is still being written: nothing is said of what it has not filled in.
  p.write('intent', {}, unfilled);
  assert.deepEqual(p.codes().filter(code => code.startsWith('intent')), []);
});

// ---- every file of a stamped stage's folder (R184)

const sha = content => createHash('sha256').update(content).digest('hex');
// The first bytes of a PNG, which hold a CR LF pair, and are no text.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02]);
// A surface approved up to Look, and a handoff folder as Handoff fills it, with what a mount and a file
// browser leave in a folder; `stamp` approves it.
function handedOff() {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast', 'structure', 'detail', 'look');
  const folder = join(p.dir, '07-handoff');
  const at = (...parts) => join(folder, ...parts);
  mkdirSync(at('prototype', 'shots'), { recursive: true });
  writeFileSync(at('SPEC.md'), '# Spec\r\n\r\nThe list of free rooms.\r\n');
  writeFileSync(at('strings.json'), '{\n  "book": { "en": "Book room" }\n}\n');
  writeFileSync(at('prototype', 'today-default-en.html'), '<p data-ux="free-count">2 rooms free</p>\n');
  writeFileSync(at('prototype', 'shots', 'today-default-en-390-light.png'), PNG);
  for (const name of ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.fuse_hidden0001']) writeFileSync(at(name), 'nobody wrote this');
  writeFileSync(at('prototype', 'shots', '.fuse_hidden0002a'), PNG);
  p.write('handoff', {}, text('handoff', null));
  return Object.assign(p, { at, approve_: () => stamp(p.dir, 'handoff', { words: WORDS, date: DAY }) });
}
const CHANGED = name => ({ stage: 'handoff', code: 'changed-since-approval', message: `07-handoff/${name} changed after handoff was approved on 2026-11-13; reopen handoff, or put back what was approved` });
const REMOVED = name => ({ stage: 'handoff', code: 'changed-since-approval', message: `07-handoff/${name} was removed after handoff was approved on 2026-11-13; reopen handoff, or put it back` });
const ADDED = name => ({ stage: 'handoff', code: 'changed-since-approval', message: `07-handoff/${name} was added after handoff was approved on 2026-11-13; reopen handoff, or take it out` });

test('a stamp records every file of the stage\'s folder by its path from it: a text file with its line endings made one, any other by its bytes; not the output, not what a mount leaves behind', () => {
  const p = handedOff();
  p.approve_();
  const { files } = p.state().stages.handoff;
  assert.deepEqual(files, {
    'SPEC.md': sha('# Spec\n\nThe list of free rooms.\n'),
    'prototype/shots/today-default-en-390-light.png': sha(PNG),
    'prototype/today-default-en.html': sha('<p data-ux="free-count">2 rooms free</p>\n'),
    'strings.json': sha('{\n  "book": { "en": "Book room" }\n}\n'),
  });
  assert.deepEqual(Object.keys(files), ['SPEC.md', 'prototype/shots/today-default-en-390-light.png', 'prototype/today-default-en.html', 'strings.json'], 'in the order of the paths');
  // A stage whose output lies in the package's own folder owns that file alone; one with a folder that
  // holds its output and nothing else has an empty list, which is a list.
  const { stages } = p.state();
  assert.deepEqual(['frame', 'context', 'intent', 'cast'].map(stage => stages[stage].files), [null, null, null, null]);
  assert.deepEqual(['structure', 'detail', 'look'].map(stage => stages[stage].files), [{}, {}, {}]);
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('validate reports a file of an approved stage\'s folder that changed, was removed or was added after its stamp; line endings alone change no text file, and do change any other', () => {
  const p = handedOff();
  p.approve_();
  const ok = what => assert.deepEqual(validate(p.dir), { ok: true, problems: [] }, what);
  const spec = readFileSync(p.at('SPEC.md'));
  // Checked out with other line endings, or looked at in a file browser: nothing of his changed.
  writeFileSync(p.at('SPEC.md'), '# Spec\n\nThe list of free rooms.\n');
  writeFileSync(p.at('strings.json'), '{\r\n  "book": { "en": "Book room" }\r\n}\r\n');
  writeFileSync(p.at('prototype', '.DS_Store'), 'nobody wrote this');
  unlinkSync(p.at('.fuse_hidden0001'));
  ok('line endings and leftovers');
  // A word of a text file.
  writeFileSync(p.at('SPEC.md'), '# Spec\n\nThe list of all rooms.\n');
  assert.deepEqual(p.problems(), [CHANGED('SPEC.md')]);
  writeFileSync(p.at('SPEC.md'), spec);
  ok('put back');
  // A picture is held to its bytes: its CR LF made LF is another picture.
  writeFileSync(p.at('prototype', 'shots', 'today-default-en-390-light.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02]));
  assert.deepEqual(p.problems(), [CHANGED('prototype/shots/today-default-en-390-light.png')]);
  writeFileSync(p.at('prototype', 'shots', 'today-default-en-390-light.png'), PNG);
  // Removed, added, and all three at once: changed first, then removed, then added.
  unlinkSync(p.at('prototype', 'today-default-en.html'));
  assert.deepEqual(p.problems(), [REMOVED('prototype/today-default-en.html')]);
  writeFileSync(p.at('prototype', 'today-empty-en.html'), '<p>No rooms.</p>\n');
  writeFileSync(p.at('strings.json'), '{}\n');
  assert.deepEqual(p.problems(), [CHANGED('strings.json'), REMOVED('prototype/today-default-en.html'), ADDED('prototype/today-empty-en.html')]);
  // The output is no file of the list: it is reported as it always was, once.
  p.edit('handoff', whole => whole.replace('Find what is free now.', 'Find what is free tonight.'));
  assert.deepEqual(p.problems().slice(-4, -3), [{ stage: 'handoff', code: 'changed-since-approval', message: '07-handoff/HANDOFF.md changed after it was approved on 2026-11-13; reopen it, or put back what was approved' }]);
  assert.equal(p.problems().length, 4);
  // Reopened, changed and stamped again, the folder as it is now is what is guarded.
  assert.deepEqual(reopen(p.dir, 'handoff', { reason: 'an accepted deviation', date: DAY }), { version: 2, stale: [], recalled: [] });
  assert.equal(p.state().stages.handoff.files, null);
  assert.deepEqual(p.codes(), []);
  assert.deepEqual(stamp(p.dir, 'handoff', { words: WORDS, date: DAY }), { version: 2 });
  assert.deepEqual(Object.keys(p.state().stages.handoff.files), ['SPEC.md', 'prototype/shots/today-default-en-390-light.png', 'prototype/today-empty-en.html', 'strings.json']);
  ok('stamped again');
});

test('validate names ten changed files of a folder and counts the rest; the command line prints each and exits 1', () => {
  const p = handedOff();
  for (let n = 1; n <= 12; n++) writeFileSync(p.at('prototype', `page-${String(n).padStart(2, '0')}.html`), `<p>${n}</p>\n`);
  p.approve_();
  for (let n = 1; n <= 12; n++) writeFileSync(p.at('prototype', `page-${String(n).padStart(2, '0')}.html`), `<p>${n + 1}</p>\n`);
  const problems = p.problems();
  assert.deepEqual(problems.slice(0, 10), Array.from({ length: 10 }, (_, i) => CHANGED(`prototype/page-${String(i + 1).padStart(2, '0')}.html`)));
  assert.deepEqual(problems.slice(10), [{ stage: 'handoff', code: 'changed-since-approval', message: '2 more files of 07-handoff/ changed, were removed or were added after handoff was approved on 2026-11-13; reopen handoff, or put back what was approved' }]);
  writeFileSync(p.at('prototype', 'page-12.html'), '<p>12</p>\n');
  assert.match(p.problems().at(-1).message, /^1 more file of 07-handoff\/ changed, were removed or were added after/);
  const r = run('validate', p.dir);
  assert.equal(r.status, 1);
  assert.equal(r.stdout.split('\n').filter(Boolean).length, 11);
  assert.ok(r.stdout.startsWith('handoff: changed-since-approval: 07-handoff/prototype/page-01.html changed after handoff was approved on 2026-11-13; reopen handoff, or put back what was approved\n'), r.stdout);
});

test('a stage stamped before folders were guarded has no list of files on record, and is held to its output alone; stamped again, it has one', () => {
  for (const legacy of [state => delete state.stages.handoff.files, state => (state.stages.handoff.files = null)]) {
    const p = handedOff();
    p.approve_();
    p.setState(legacy);
    writeFileSync(p.at('SPEC.md'), '# Spec\n\nThe list of all rooms.\n');
    unlinkSync(p.at('strings.json'));
    writeFileSync(p.at('notes.md'), 'a note');
    assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
    p.edit('handoff', whole => whole.replace('Find what is free now.', 'Find what is free tonight.'));
    assert.deepEqual(p.codes(), ['handoff:changed-since-approval']);
    // Made stale and re-confirmed, it is stamped by this script, and its folder is on record from then on.
    setRoute(p.dir, 'handoff', 'short', { reason: 'r', date: DAY });
    assert.deepEqual(stamp(p.dir, 'handoff', { words: WORDS, date: DAY }), { version: 2 });
    assert.deepEqual(Object.keys(p.state().stages.handoff.files), ['SPEC.md', 'notes.md', 'prototype/shots/today-default-en-390-light.png', 'prototype/today-default-en.html']);
    writeFileSync(p.at('notes.md'), 'another note');
    assert.deepEqual(p.problems(), [CHANGED('notes.md')]);
  }
});

test('a link in the folder is never followed: it is held to where it points, and a folder it points to is not walked', t => {
  const p = handedOff();
  const outside = join(p.dir, 'work');
  mkdirSync(outside);
  writeFileSync(join(outside, 'brief.md'), 'a brief');
  try {
    symlinkSync(join('..', 'work', 'brief.md'), p.at('brief.md'));
    // A link back to the folder above: followed, it would never end.
    symlinkSync('..', p.at('prototype', 'above'), 'dir');
  } catch (e) {
    t.skip(`this file system makes no link here (${e.code})`);
    return;
  }
  p.approve_();
  const { files } = p.state().stages.handoff;
  assert.deepEqual(Object.keys(files), ['SPEC.md', 'brief.md', 'prototype/above', 'prototype/shots/today-default-en-390-light.png', 'prototype/today-default-en.html', 'strings.json']);
  assert.equal(files['brief.md'], sha(`link: ${join('..', 'work', 'brief.md')}`));
  // What it points to is another stage's, or nobody's: a change there is not a change here.
  writeFileSync(join(outside, 'brief.md'), 'another brief');
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
  // Pointed elsewhere, it has changed.
  unlinkSync(p.at('brief.md'));
  symlinkSync(join('..', 'work', 'other.md'), p.at('brief.md'));
  assert.deepEqual(p.problems(), [CHANGED('brief.md')]);
});

test('the CLI reopen names the stages it marked stale and those it took out of awaiting', () => {
  // A correction at its last stage: the report awaits him on handoff@1 when the handoff is reopened.
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail', 'handoff');
  p.write('acceptance');
  awaitFounder(p.dir, 'acceptance', { question: 'Is the build what you nodded at?', date: DAY });
  let r = run('reopen', p.dir, 'handoff', '--reason', 'an accepted deviation', '--date', DAY);
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, 'reopened handoff at version 2; stale: none; back in work: acceptance\n', '']);
  assert.deepEqual([p.state().stages.acceptance.status, p.state().question], ['in-work', null]);
  // The report was built from the version reopened, and says so until its built-from is written again.
  assert.deepEqual(p.problems(), [{ stage: 'acceptance', code: 'stale-input', message: 'built from handoff@1, but handoff is at version 2: a stale input; rebuild on handoff@2 or re-confirm it' }]);
  r = run('reopen', p.dir, 'frame', '--reason', 'the request changed', '--date', DAY);
  assert.deepEqual([r.status, r.stdout], [0, 'reopened frame at version 2; stale: detail; back in work: none\n']);
});
