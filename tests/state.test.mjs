import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serialize } from '../scripts/lib/frontmatter.mjs';
import {
  STAGES, ARTEFACT, SIZES, FOUNDATIONS, KINDS, StateError,
  routeFor, init, begin, awaitFounder, stamp, reopen, resize, validate, next, status,
} from '../scripts/lib/state.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'state.mjs');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'state-'));
after(() => rmSync(root, { recursive: true, force: true }));

const DAY = '2026-11-13';
const WORDS = 'sí, continúa';
const META = { design: 'front desk', kind: 'working-surface', foundation: 'new-surface', size: 'surface', date: DAY };
let made = 0;
const fresh = () => join(root, `p${++made}`);
const refused = (fn, pattern) => assert.throws(fn, e => e instanceof StateError && pattern.test(e.message));
// A refused stamp lists one problem per line, after its first line.
const refusedOnce = (fn, pattern) =>
  assert.throws(fn, e => e instanceof StateError && pattern.test(e.message) && e.message.split('\n').length === 2);

// A stage output's body: one section to carry and, unless `carry` is null, a carry list as its last section.
const text = (title, carry = ['- source:README.md']) =>
  `# ${title}\n\n## The one job\n\nFind what is free now.\n\n## Reviewed by the founder\n\nYes.\n` +
  (carry ? `\n## Carry\n\n${carry.join('\n')}\n` : '');

const defined = data => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

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
    read: stage => parse(readFileSync(file(stage), 'utf8')),
    // A draft header at the stage's current version, merged with `header`; an undefined value drops the key.
    write(stage, header = {}, body = text(stage)) {
      mkdirSync(dirname(file(stage)), { recursive: true });
      writeFileSync(file(stage), serialize(defined({ stage, version: p.state().stages[stage].version, status: 'draft', 'built-from': [], ...header }), body));
    },
    // Rewrites an artefact's header fields, leaving its body as it is.
    setHeader(stage, header) {
      const { data, body } = p.read(stage);
      writeFileSync(file(stage), serialize(defined({ ...data, ...header }), body));
    },
    edit(stage, change) {
      writeFileSync(file(stage), change(readFileSync(file(stage), 'utf8')));
    },
    // Writes and stamps each stage, each built from the stage before it when that one is approved.
    approve(...stages) {
      for (const stage of stages) {
        const before = p.state().stages[STAGES[STAGES.indexOf(stage) - 1]];
        const inputs = before?.status === 'approved' ? [`${STAGES[STAGES.indexOf(stage) - 1]}@${before.version}`] : [];
        p.write(stage, { 'built-from': inputs });
        stamp(dir, stage, { words: WORDS, date: DAY });
      }
    },
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

test('the constants name the stages, their outputs, the sizes, the foundations and the kit kinds', () => {
  assert.deepEqual(STAGES, ['frame', 'context', 'intent', 'cast', 'structure', 'detail', 'look', 'handoff', 'acceptance']);
  assert.deepEqual(ARTEFACT, {
    frame: '00-frame.md', context: '01-context.md', intent: '02-intent.md', cast: '03-cast.md',
    structure: '04-structure/CHOSEN.md', detail: '05-detail/DETAIL.md', look: '06-look/LOOK.md',
    handoff: '07-handoff/HANDOFF.md', acceptance: '08-acceptance/REPORT.md',
  });
  assert.deepEqual(SIZES, ['correction', 'adjustment', 'surface', 'flow', 'system']);
  assert.deepEqual(FOUNDATIONS, ['no-system', 'new-surface', 'redesign', 'small-change']);
  assert.deepEqual(KINDS, ['working-surface', 'first-run', 'form', 'message', 'public-page']);
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
    { design: state.design, kind: state.kind, foundation: state.foundation, size: state.size, question: state.question },
    { design: 'front desk', kind: 'working-surface', foundation: 'new-surface', size: 'correction', question: null },
  );
  assert.deepEqual(state.route, routeFor('correction'));
  for (const stage of STAGES) {
    const skipped = routeFor('correction')[stage] === 'skipped';
    assert.deepEqual(state.stages[stage], { status: skipped ? 'skipped' : 'not-started', version: 1, approved: null, words: null, hash: null });
    assert.equal(Boolean(state.reasons[stage]), skipped, stage);
  }
  refused(() => init(p.dir, META), /already/);
});

test('init accepts any kebab-case kind and refuses one that is not', () => {
  assert.equal(pkg({ kind: 'radiology-shell' }).state().kind, 'radiology-shell');
  refused(() => init(fresh(), { ...META, kind: 'Radiology Shell' }), /kebab/);
});

test('init refuses an unknown foundation and a blank design', () => {
  refused(() => init(fresh(), { ...META, foundation: 'greenfield' }), /unknown foundation "greenfield"/);
  refused(() => init(fresh(), { ...META, design: ' \n ' }), /design/);
});

test('init, begin, await, stamp and reopen refuse a date that is not a real day written YYYY-MM-DD', () => {
  refused(() => init(fresh(), { ...META, date: '13/11/2026' }), /YYYY-MM-DD/);
  const p = pkg();
  p.write('frame');
  refused(() => begin(p.dir, 'frame', { date: '2026-11-31' }), /YYYY-MM-DD/);
  refused(() => awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: 'today' }), /YYYY-MM-DD/);
  refused(() => stamp(p.dir, 'frame', { words: WORDS, date: '2026-02-30' }), /YYYY-MM-DD/);
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  refused(() => reopen(p.dir, 'frame', { reason: 'the job changed', date: undefined }), /YYYY-MM-DD/);
});

// ---- stamp

test('stamp approves a draft: the header records the date and the words; the state gets a 64-character hash', () => {
  const p = pkg();
  p.write('frame');
  assert.deepEqual(stamp(p.dir, 'frame', { words: WORDS, date: DAY }), { version: 1 });
  const { data, body } = p.read('frame');
  assert.deepEqual(data, { stage: 'frame', version: 1, status: 'approved', approved: DAY, words: WORDS, 'built-from': [] });
  assert.equal(body, text('frame'));
  const entry = p.state().stages.frame;
  assert.equal(entry.status, 'approved');
  assert.equal(entry.approved, DAY);
  assert.equal(entry.words, WORDS);
  assert.match(entry.hash, /^[0-9a-f]{64}$/);
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
    if (stage === 'handoff' || stage === 'acceptance') stamp(p.dir, stage, { words: WORDS, date: DAY });
    else refusedOnce(() => stamp(p.dir, stage, { words: WORDS, date: DAY }), /has no "## Carry" section/);
  }
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
  p.write('context', { 'built-from': ['frame@1'] });
  refused(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), /frame is not-started, not approved/);
});

test('stamp refuses an unknown stage, a stage the route skips, an approved stage and a missing output', () => {
  const p = pkg({ size: 'correction' });
  refused(() => stamp(p.dir, 'review', { words: WORDS, date: DAY }), /unknown stage "review"/);
  p.write('context');
  refused(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), /skipped/);
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

test('stamp accepts carry entries that resolve: an earlier section, its own section, punctuation, accents in either normal form', () => {
  const p = pkg();
  p.write('frame', {}, `# Frame\n\n## The founder's own words\n\nx\n\n## Qué puede mostrar, hoy\n\ny\n\n## Carry\n\n- frame@1#the-founder-s-own-words\n`);
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  p.write('context', { 'built-from': ['frame@1'] }, text('context', [
    '- frame@1#the-founder-s-own-words', '- frame@1#qué-puede-mostrar-hoy', `- frame@1#${'qué-puede-mostrar-hoy'.normalize('NFD')}`,
    '- context@1#the-one-job', '- source: docs/brief.md',
  ]));
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('stamp refuses a carry list that is not the last section, a line that is not an entry, and an entry that does not resolve', () => {
  const cases = [
    [['- frame@1#the-one-job', '', '## Notes'], /must be the last section, but "## Notes" follows it/],
    [['the frame, all of it'], /"the frame, all of it" is not a carry entry/],
    [['- source:'], /"- source:" is not a carry entry/],
    [['- frame@1#no-such-heading'], /00-frame\.md has no heading whose slug is "no-such-heading"/],
    [['- intent@1#the-one-job'], /names intent, which is not this stage or an earlier one/],
    [['- review@1#the-one-job'], /names review, which is not this stage or an earlier one/],
    [['- context@2#no-such-heading'], /this is version 1/],
    [['- context@1#no-such-heading'], /01-context\.md has no heading whose slug is "no-such-heading"/],
    [['- frame@2#no-such-heading'], /stale/],
  ];
  for (const [carry, pattern] of cases) {
    const p = pkg();
    p.approve('frame');
    p.write('context', { 'built-from': ['frame@1'] }, text('context', carry));
    refusedOnce(() => stamp(p.dir, 'context', { words: WORDS, date: DAY }), pattern);
  }
});

// ---- reopen

test('reopen(context) after frame, context and intent are approved: context at version 2 in work; intent stale', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'the angles were thin', date: DAY }), { version: 2, stale: ['intent'] });
  const { stages, reasons } = p.state();
  assert.deepEqual(stages.context, { status: 'in-work', version: 2, approved: null, words: null, hash: null });
  assert.equal(stages.intent.status, 'stale');
  assert.equal(stages.frame.status, 'approved');
  assert.match(reasons.context, /reopened on 2026-11-13: the angles were thin/);
  assert.deepEqual(p.read('context').data, { stage: 'context', version: 2, status: 'draft', approved: '', words: '', 'built-from': ['frame@1'] });
  assert.equal(next(p.dir), 'context');
});

test('reopen marks stale every later output built from one it marks stale, and leaves the rest', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent', 'cast');
  p.write('structure', { 'built-from': ['frame@1'] });
  stamp(p.dir, 'structure', { words: WORDS, date: DAY });
  p.write('detail', { 'built-from': ['context@1'] });
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: DAY }).stale, ['intent', 'cast']);
  assert.equal(p.state().stages.structure.status, 'approved', 'built from frame only');
  assert.equal(p.state().stages.detail.status, 'not-started', 'a draft of a stage not started is not marked');
  assert.deepEqual(reopen(p.dir, 'intent', { reason: 'r', date: DAY }), { version: 2, stale: ['cast'] });
});

test('reopen refuses a blank reason and a stage that is not approved or stale', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  refused(() => reopen(p.dir, 'frame', { reason: ' ', date: DAY }), /reason/);
  refused(() => reopen(p.dir, 'context', { reason: 'r', date: DAY }), /context is not-started: only an approved or stale stage/);
  refused(() => reopen(p.dir, 'structure', { reason: 'r', date: DAY }), /structure is skipped: only an approved or stale stage/);
  refused(() => reopen(p.dir, 'nowhere', { reason: 'r', date: DAY }), /unknown stage "nowhere"/);
});

// ---- resize

test('resize: the size only moves up; adjustment to flow un-skips structure', () => {
  refused(() => resize(pkg().dir, 'adjustment'), /only moves up/);
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  resize(p.dir, 'flow');
  const state = p.state();
  assert.equal(state.size, 'flow');
  assert.deepEqual(state.route, routeFor('flow'));
  assert.equal(state.stages.structure.status, 'not-started');
  assert.equal(state.reasons.structure, undefined);
  assert.equal(state.stages.frame.status, 'approved', 'a stage already run is left as it is');
  assert.equal(next(p.dir), 'context');
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
  p.write('intent', { 'built-from': ['context@1'] }, text('intent', ['- context@1#the-one-job']));
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

test('validate: artefacts and state written with CRLF give the same result as with LF', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', { 'built-from': ['context@1'] }, text('intent', ['- context@1#the-one-job', '- intent@1#reviewed-by-the-founder']));
  stamp(p.dir, 'intent', { words: WORDS, date: DAY });
  const lf = validate(p.dir);
  assert.deepEqual(lf, { ok: true, problems: [] });
  const files = dir => readdirSync(dir).flatMap(f => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
  for (const file of files(p.dir)) writeFileSync(file, readFileSync(file, 'utf8').replace(/\n/g, '\r\n'));
  assert.deepEqual(validate(p.dir), lf);
});

test('validate: a carry entry naming an earlier output that cannot be read is carry-unresolved', () => {
  const p = pkg();
  p.approve('frame');
  p.write('context', { 'built-from': ['frame@1'] }, text('context', ['- frame@1#the-one-job']));
  stamp(p.dir, 'context', { words: WORDS, date: DAY });
  unlinkSync(p.file('frame'));
  assert.deepEqual(p.codes(), ['frame:missing-artefact', 'context:carry-unresolved']);
});

test('validate accepts a source: carry entry without resolving it', () => {
  const p = pkg();
  p.write('frame', {}, text('frame', ['- source:docs/not-written-yet.md']));
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  assert.deepEqual(validate(p.dir), { ok: true, problems: [] });
});

test('validate: a stage in work, awaiting, approved or stale without its output is missing-artefact', () => {
  const p = pkg();
  p.approve('frame');
  unlinkSync(p.file('frame'));
  assert.deepEqual(p.codes(), ['frame:missing-artefact']);
});

test('validate: a header that does not match its stage and state is bad-header', () => {
  const approvedOnly = [
    ['a draft header on an approved stage', { status: 'draft' }],
    ['no approval date', { approved: '' }],
  ];
  for (const [name, header] of [...badHeaders.map(([n, h]) => [n, h]), ...approvedOnly]) {
    const p = pkg();
    p.approve('frame', 'context');
    p.setHeader('context', header);
    assert.ok(p.codes().includes('context:bad-header'), `${name}: ${p.codes().join(' ')}`);
  }
  const p = pkg();
  p.approve('frame', 'context');
  writeFileSync(p.file('frame'), '---\nstage: frame\n');
  assert.ok(p.codes().includes('frame:bad-header'));
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  p.setHeader('context', { status: 'approved' });
  assert.ok(p.codes().includes('context:bad-header'), 'approved by hand without a stamp');
});

test('validate: a stale stage, and an input at another version, are stale-input', () => {
  const p = pkg();
  p.approve('frame', 'context', 'intent');
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.deepEqual(p.codes(), ['intent:stale-input']);
  const q = pkg();
  q.approve('frame', 'context');
  q.setHeader('context', { 'built-from': ['frame@2'] });
  assert.deepEqual(q.codes(), ['context:stale-input']);
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
  assert.deepEqual(p.codes(), ['frame:approved-without-words', 'context:approved-without-words']);
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

test('every function refuses a folder that is not a package, and a state.json that is damaged', () => {
  const dir = fresh();
  mkdirSync(dir);
  for (const fn of [() => validate(dir), () => next(dir), () => status(dir), () => resize(dir, 'flow')]) refused(fn, /no state\.json; run init/);
  const p = pkg();
  writeFileSync(join(p.dir, 'state.json'), '{ "size": ');
  refused(() => validate(p.dir), /not valid JSON/);
  const q = pkg();
  q.setState(state => { delete state.stages.look; });
  refused(() => next(q.dir), /damaged/);
});

test('state.json with a byte-order mark is read', () => {
  const p = pkg();
  writeFileSync(join(p.dir, 'state.json'), `\uFEFF${readFileSync(join(p.dir, 'state.json'), 'utf8')}`);
  assert.equal(next(p.dir), 'frame');
});

test('STATE.md shows the design, kind, foundation, size, a row per stage and the open question, from state.json', () => {
  const p = pkg({ size: 'adjustment' });
  p.approve('frame');
  const page = () => readFileSync(join(p.dir, 'STATE.md'), 'utf8');
  for (const word of ['front desk', 'working-surface', 'new-surface', 'adjustment']) assert.ok(page().includes(word), word);
  for (const stage of STAGES) assert.ok(page().includes(`| \`${ARTEFACT[stage]}\` |`), stage);
  assert.match(page(), /^\| frame \| full \| approved \| 1 \| 2026-11-13 \| `00-frame\.md` \|/m);
  assert.match(page(), /^\| structure \| skipped \| skipped \|/m);
  assert.match(page(), /## Open question\n\nNone\./);
  reopen(p.dir, 'frame', { reason: 'thin | wrong', date: DAY });
  assert.match(page(), /^\| frame \| full \| in-work \| 2 \| — \|.*reopened on 2026-11-13: thin \\\| wrong \|$/m);
  assert.equal(status(p.dir), page());
  assert.ok(!page().includes('\r'));
});

// ---- begin and await: a stage in work, a stage awaiting the founder, the one open question

test('begin sets a stage in work and STATE.md shows it; its output need not exist yet', () => {
  const p = pkg();
  begin(p.dir, 'frame', { date: DAY });
  assert.equal(p.state().stages.frame.status, 'in-work');
  assert.ok(!existsSync(p.file('frame')));
  assert.match(readFileSync(join(p.dir, 'STATE.md'), 'utf8'), /^\| frame \| full \| in-work \| 1 \| — \| `00-frame\.md` \|/m);
  assert.equal(next(p.dir), 'frame');
});

test('begin takes a stage that is awaiting, in work or stale, and leaves its output alone', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', { 'built-from': ['context@1'] });
  awaitFounder(p.dir, 'intent', { question: 'Is this the one job?', date: DAY });
  const written = readFileSync(p.file('intent'), 'utf8');
  begin(p.dir, 'intent', { date: DAY });
  assert.equal(p.state().stages.intent.status, 'in-work');
  assert.equal(readFileSync(p.file('intent'), 'utf8'), written);
  begin(p.dir, 'intent', { date: DAY });
  reopen(p.dir, 'context', { reason: 'r', date: DAY });
  assert.equal(p.state().stages.intent.status, 'stale');
  begin(p.dir, 'intent', { date: DAY });
  assert.equal(p.state().stages.intent.status, 'in-work');
});

test('begin refuses a stage the route skips and a stage already approved', () => {
  const p = pkg({ size: 'adjustment' });
  refused(() => begin(p.dir, 'structure', { date: DAY }), /structure is skipped by the adjustment route; resize/);
  p.approve('frame');
  refused(() => begin(p.dir, 'frame', { date: DAY }), /frame is already approved at version 1; reopen/);
  refused(() => begin(p.dir, 'review', { date: DAY }), /unknown stage "review"/);
  assert.equal(p.state().stages.structure.status, 'skipped');
});

test('await sets the header and state.json to awaiting and stores the question with its stage', () => {
  const p = pkg();
  p.write('frame');
  awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: DAY });
  const { data, body } = p.read('frame');
  assert.equal(data.status, 'awaiting');
  assert.equal(body, text('frame'));
  const state = p.state();
  assert.equal(state.stages.frame.status, 'awaiting');
  assert.deepEqual([state.question, state.questionStage], ['Is the job right?', 'frame']);
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
  refused(() => awaitFounder(p.dir, 'structure', { question: 'Which layout?', date: DAY }), /skipped by the adjustment route/);
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

test('STATE.md shows the open question and the stage it belongs to', () => {
  const p = pkg();
  p.approve('frame');
  p.write('context', { 'built-from': ['frame@1'] });
  awaitFounder(p.dir, 'context', { question: 'Which angle | which day?', date: DAY });
  const page = readFileSync(join(p.dir, 'STATE.md'), 'utf8');
  assert.match(page, /## Open question\n\ncontext: Which angle \| which day\?\n/);
  assert.match(page, /^\| context \| full \| awaiting \| 1 \| — \| `01-context\.md` \|/m);
  assert.equal(status(p.dir), page);
});

test("stamp clears the open question of its own stage and leaves another stage's", () => {
  const p = pkg();
  p.write('frame');
  awaitFounder(p.dir, 'frame', { question: 'Is the job right?', date: DAY });
  stamp(p.dir, 'frame', { words: WORDS, date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], [null, null]);
  assert.match(readFileSync(join(p.dir, 'STATE.md'), 'utf8'), /## Open question\n\nNone\./);
  p.write('context', { 'built-from': ['frame@1'] });
  awaitFounder(p.dir, 'context', { question: 'Which angle?', date: DAY });
  p.write('structure', { 'built-from': ['frame@1'] });
  stamp(p.dir, 'structure', { words: WORDS, date: DAY });
  assert.deepEqual([p.state().question, p.state().questionStage], ['Which angle?', 'context']);
});

test('reopen clears the open question only when it belongs to the reopened stage or one it marks stale', () => {
  const p = pkg();
  p.approve('frame', 'context');
  p.write('intent', { 'built-from': ['frame@1'] });
  awaitFounder(p.dir, 'intent', { question: 'Which job?', date: DAY });
  assert.deepEqual(reopen(p.dir, 'context', { reason: 'r', date: DAY }).stale, []);
  assert.deepEqual([p.state().question, p.state().questionStage], ['Which job?', 'intent'], 'intent is not built from context');

  const q = pkg();
  q.approve('frame', 'context');
  q.write('intent', { 'built-from': ['context@1'] });
  awaitFounder(q.dir, 'intent', { question: 'Which job?', date: DAY });
  assert.deepEqual(reopen(q.dir, 'context', { reason: 'r', date: DAY }).stale, ['intent']);
  assert.deepEqual([q.state().question, q.state().questionStage], [null, null]);

  // No verb leaves a question on an approved stage, so the state is written by hand here.
  const r = pkg();
  r.approve('frame');
  r.setState(state => Object.assign(state, { question: 'Still the right job?', questionStage: 'frame' }));
  reopen(r.dir, 'frame', { reason: 'r', date: DAY });
  assert.deepEqual([r.state().question, r.state().questionStage], [null, null]);
});

// ---- the command line

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

test('the CLI runs a package: init, stamp, next, status, validate, reopen, resize, each exiting 0', () => {
  const dir = fresh();
  let r = run('init', dir, '--design', 'front desk', '--kind', 'working-surface', '--foundation', 'new-surface', '--size', 'adjustment', '--date', DAY);
  assert.equal(r.status, 0, r.stderr);
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
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /version 2/);
  r = run('resize', dir, '--size', 'flow');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')).size, 'flow');
});

test('the CLI begin and await: 0 on success, 1 on a refusal, 2 on missing arguments', () => {
  const p = pkg({ size: 'adjustment' });
  let r = run('begin', p.dir, 'frame');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(p.state().stages.frame.status, 'in-work');
  p.write('frame');
  r = run('await', p.dir, 'frame', '--question', 'Is the job\nright?', '--date', DAY);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([p.state().stages.frame.status, p.state().question], ['awaiting', 'Is the job right?']);
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

test('the CLI prints none when every routed stage is approved', () => {
  const p = pkg({ size: 'correction' });
  p.approve('frame', 'detail', 'handoff', 'acceptance');
  assert.deepEqual([run('next', p.dir).status, run('next', p.dir).stdout], [0, 'none\n']);
});

test('the CLI exits 1 on a refusal and on a problem found', () => {
  const p = pkg();
  p.approve('frame');
  let r = run('stamp', p.dir, 'frame', '--words', 'again');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already approved/);
  p.edit('frame', s => s.replace('Find what is free now.', 'Find what is booked.'));
  r = run('validate', p.dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^frame: changed-since-approval: /m);
  r = run('init', fresh(), '--design', 'd', '--kind', 'Radiology Shell', '--foundation', 'new-surface', '--size', 'surface');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /kebab/);
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
    for (const word of ['init', 'begin', 'await', 'stamp', 'reopen', 'resize', 'validate', 'next', 'status',
      '--design', '--kind', '--foundation', '--size', '--words', '--question', '--reason', '--date']) assert.ok(r.stdout.includes(word), word);
    assert.match(r.stdout, /--words, --question.*: each line break in them becomes a single space/);
  }
});
