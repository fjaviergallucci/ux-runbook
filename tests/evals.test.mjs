// The evaluation suite, evals/: nine cases that hold the plugin to its own rules, run by `claude plugin eval .`.
// A case is a folder as `claude plugin eval init --bare <name>` lays one out, prompt.md and graders/criteria.md,
// with two things beside them: a fixture/ folder, and a case.yaml whose only work is to declare that folder, since
// a run can read nothing else under evals/. A run costs model calls, so nothing here runs one. These tests hold
// each case to its layout, each path a prompt or a seat's brief names to a file that is there, and each fixture
// to what its case depends on, by the kit's own scripts: a case that fails must fail for the plugin's reasons.
// Two things the first run showed are held here too. A run's shell can write nowhere, though its Write tool can
// write in the run's own folder: so every fixture is read where it lies, no case needs a command that writes the
// state, and what a stage would write goes to the same path in the run's folder. And a judge handed a long file
// and a rubric of several parts fails a sound output: so what a pattern can hold is held by a pattern, tried here
// on lines of the kind a sound output has, and a rubric asks one thing that only a reader can judge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAcceptance } from '../scripts/accept.mjs';
import { alone } from '../scripts/alone.mjs';
import { validatePerson } from '../scripts/lib/card.mjs';
import { MAP, PICK } from '../scripts/lib/merge.mjs';
import { validate } from '../scripts/lib/walkthrough.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const at = (...path) => join(root, ...path);
const read = (...path) => readFileSync(at(...path), 'utf8');
const flat = text => text.replace(/\s+/g, ' ');
// What a mount or a file browser leaves in a folder is passed over, as the kit's scripts pass it over.
const visible = name => !name.startsWith('.fuse_hidden') && !['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(name);
const list = (...path) => readdirSync(at(...path)).filter(visible).sort();
// Every file under a folder, by its path from it.
const filesUnder = (folder, inside = '') => readdirSync(join(folder, inside), { withFileTypes: true }).filter(entry => visible(entry.name))
  .flatMap(entry => (entry.isDirectory() ? filesUnder(folder, join(inside, entry.name)) : [join(inside, entry.name)])).sort();

// The nine cases, as the plan's table names them, each with the tools its graders need beyond the read-only ones.
// Every case reads its fixture where it lies: a run cannot write there, and its shell cannot write anywhere.
const CASES = Object.freeze({
  'brief-has-no-design': { tools: ['Bash', 'Write'] },
  'fresh-brief-hides-the-system': { tools: ['Bash', 'Write'] },
  'no-pick-without-the-founder': { tools: ['Bash', 'Agent'] },
  'judge-does-not-redraw': { tools: ['Write', 'Edit'] },
  'audience-stays-blind': { tools: ['Write', 'Bash'] },
  'resume-from-disk': { tools: ['Bash', 'Write', 'Edit'] },
  'correction-is-one-nod': { tools: ['Agent', 'Edit', 'Write', 'Bash'] },
  'profile-judge-cannot-tell': { tools: ['Write'] },
  'cold-implementer-finds-the-gap': { tools: ['Write'] },
});
const NAMES = Object.keys(CASES);
const PKG = 'design/today';
const fixture = (name, ...path) => at('evals', name, 'fixture', ...path);
const inFixture = (name, ...path) => readFileSync(fixture(name, ...path), 'utf8');

// ---- reading a case: the header of a prompt or a grader, and case.yaml

// The header of prompt.md or of a grader: one `key: value` to a line between two `---` lines. A value is kept as
// written, but a list `[a, b]` and a mapping `{ a: b, c: d }`, each on one line.
function header(text, file) {
  const lines = text.split('\n');
  assert.equal(lines[0], '---', `${file}: opens with a header`);
  const close = lines.indexOf('---', 1);
  assert.ok(close > 0, `${file}: its header is closed`);
  const data = {};
  for (const line of lines.slice(1, close)) {
    if (line.startsWith('#')) continue;
    const [, key, raw] = /^([a-z_]+): (.+)$/.exec(line) ?? assert.fail(`${file}: "${line}" is not key: value`);
    assert.ok(!(key in data), `${file}: ${key} twice`);
    const list = /^\[(.*)\]$/.exec(raw);
    const mapping = /^\{ (.*) \}$/.exec(raw);
    data[key] = list ? list[1].split(',').map(item => item.trim())
      : mapping ? Object.fromEntries(mapping[1].split(', ').map(pair => pair.split(': ')))
        : /^-?\d+$/.test(raw) ? Number(raw) : raw === 'true' ? true : raw === 'false' ? false : raw.replace(/^'(.*)'$/, '$1');
  }
  return { data, body: lines.slice(close + 1).join('\n').trim() };
}
const prompt = name => header(read('evals', name, 'prompt.md'), `${name}/prompt.md`);
const graders = name => Object.fromEntries(list('evals', name, 'graders').map(file => [file.replace(/\.md$/, ''), header(read('evals', name, 'graders', file), `${name}/graders/${file}`)]));

// What `claude plugin eval` takes, as its own interview and its documentation give it.
const PROMPT_KEYS = ['max_turns', 'timeout_seconds', 'allowed_tools'];
const READ_ONLY = ['Read', 'Glob', 'Grep', 'Skill'];
const GRANTED = ['Bash', 'Write', 'Edit'];
const GRADER_KEYS = Object.freeze({
  llm: ['type', 'focus', 'weight'],
  regex: ['type', 'target', 'match', 'flags', 'weight'],
  tool_used: ['type', 'tool', 'input_match', 'min', 'max', 'arm'],
  file_exists: ['type', 'path', 'exists'],
});
const LOOKS_AT = ['last_message', 'trace', 'files'];

// ---- the layout

test('the suite is the nine cases of the plan, and nothing else but what a run leaves', () => {
  assert.deepEqual(list('evals').filter(name => name !== 'results'), [...NAMES].sort());
  assert.match(read('.gitignore'), /^evals\/results\/$/m);
});

test('each case is laid out as `init --bare` lays one out, with a fixture and the case.yaml that declares it', () => {
  for (const name of NAMES) {
    assert.deepEqual(list('evals', name), ['case.yaml', 'fixture', 'graders', 'prompt.md'], name);
    assert.ok(list('evals', name, 'graders').includes('criteria.md'), `${name}: graders/criteria.md`);
    // A run refuses a case that holds a link, and a file that has a second name.
    for (const file of filesUnder(at('evals', name))) {
      const stat = lstatSync(at('evals', name, file));
      assert.ok(stat.isFile() && !stat.isSymbolicLink(), `${name}/${file} is a plain file`);
    }
    // case.yaml: the version, the case's name, what it asks and what must be seen, in words, and the one folder a run may read.
    const yaml = read('evals', name, 'case.yaml');
    assert.deepEqual(yaml.split('\n').filter(line => /^[a-z_]+:/.test(line)).map(line => line.split(':')[0]), ['schema_version', 'name', 'description', 'expected_outcome', 'context'], name);
    assert.match(yaml, /^schema_version: "1\.1"\n/, name);
    assert.match(yaml, new RegExp(`^name: ${name}$`, 'm'), name);
    assert.match(yaml, /^description: >-\n {2}\S/m, `${name}: what the prompt asks`);
    assert.match(yaml, /^expected_outcome: \|\n {2}- \S/m, `${name}: what must be seen, as sentences`);
    assert.ok(yaml.endsWith('\ncontext:\n  add_dirs: [fixture]\n'), `${name}: the fixture is the one folder declared`);
    assert.ok(!yaml.includes('scaffold_script') && !yaml.includes('history_file'), `${name}: nothing is run, and no transcript is resumed`);
  }
});

test('each prompt sets its limits and the tools its graders need, and each grader is of a kind a run knows', () => {
  for (const name of NAMES) {
    const { data, body } = prompt(name);
    assert.deepEqual(Object.keys(data), PROMPT_KEYS, name);
    assert.ok(Number.isInteger(data.max_turns) && data.max_turns >= 30 && data.max_turns <= 200, `${name}: max_turns`);
    assert.ok(Number.isInteger(data.timeout_seconds) && data.timeout_seconds >= 600 && data.timeout_seconds <= 3600, `${name}: timeout_seconds`);
    for (const tool of READ_ONLY) assert.ok(data.allowed_tools.includes(tool), `${name}: ${tool}`);
    for (const tool of data.allowed_tools) assert.ok([...READ_ONLY, ...GRANTED, 'Agent'].includes(tool), `${name}: ${tool} is read-only, or granted by the run's --allow-tools`);
    for (const tool of CASES[name].tools) assert.ok(data.allowed_tools.includes(tool), `${name}: its graders need ${tool}`);
    assert.ok(body.length > 200 && !/TODO/.test(body), `${name}: the prompt is written`);

    const all = graders(name);
    assert.equal(all.criteria.data.type, 'llm', `${name}: criteria.md is the grader that is judged`);
    for (const [grader, { data: g, body: text }] of Object.entries(all)) {
      const title = `${name}/graders/${grader}.md`;
      assert.ok(g.type in GRADER_KEYS, `${title}: type`);
      for (const key of Object.keys(g)) assert.ok(GRADER_KEYS[g.type].includes(key), `${title}: ${key}`);
      const looks = g.focus ?? g.target;
      if (g.type === 'llm' || g.type === 'regex') {
        assert.ok(text !== '' && !/TODO/.test(text), `${title}: its ${g.type === 'llm' ? 'rubric' : 'pattern'} is written`);
        // A run looks at the last message unless told otherwise: every grader here says where it looks.
        assert.ok(LOOKS_AT.includes(looks) || (looks.source === 'file' && typeof looks.path === 'string'), `${title}: what it looks at`);
      } else {
        assert.equal(text, '', `${title}: a ${g.type} grader has no body`);
      }
      if (g.type === 'llm') assert.match(text, /^PASS (?:only )?if /m, `${title}: a rubric says what passes`);
      if (g.type === 'llm') assert.match(text, /^FAIL /m, `${title}: and what fails`);
      if (g.type === 'regex') {
        assert.ok(!text.includes('\n'), `${title}: the pattern is one line`);
        assert.doesNotThrow(() => new RegExp(text, g.flags ?? ''), title);
        assert.match(g.match, /^(?:contains|not_contains|count:\d+)$/, `${title}: match`);
      }
      if (g.type === 'tool_used') {
        assert.ok(data.allowed_tools.includes(g.tool), `${title}: ${g.tool} is a tool of the case, or the check could never fail`);
        if (g.input_match) assert.doesNotThrow(() => new RegExp(g.input_match), title);
        // A tool that must not be called: both ends at nought, and scored in both arms.
        if ('max' in g) assert.deepEqual([g.min, g.max, g.arm], [0, 0, 'both'], title);
        else assert.ok(!('min' in g) && !('arm' in g), `${title}: a tool that must be called once at least`);
      }
      if (g.type === 'file_exists') assert.equal(typeof g.path, 'string', title);
      // A file a grader reads, or one that must be there, is in the run's own folder: a tool of the case must be able to write it.
      if (looks?.source === 'file' || (g.type === 'file_exists' && g.exists !== false)) assert.ok(data.allowed_tools.includes('Write'), `${title}: Write`);
    }
  }
});

test('no prompt, grader or case.yaml names a place on one machine', () => {
  for (const name of NAMES) {
    for (const file of ['prompt.md', 'case.yaml', ...list('evals', name, 'graders').map(grader => join('graders', grader))]) {
      const text = read('evals', name, file);
      assert.doesNotMatch(text, /(?:^|[\s`"'(])(?:\/(?:home|mnt|tmp|Users|usr|var)\/|~\/|[A-Za-z]:\\)/m, `${name}/${file}`);
    }
  }
});

// ---- the paths a prompt and a seat's brief name

// The paths a text names in code spans, of one kind: those that start with `start`.
const spans = text => [...text.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span);
const pathsFrom = (text, start) => [...new Set(spans(text).filter(span => span.startsWith(start) && !/[<>*{}\s]/.test(span)))];
const KIT_START = /^(?:pool|templates|skills|scripts|kit|reference)\//;
// The brief of a seat's case, by its path in the fixture.
const BRIEFS = Object.freeze({
  'judge-does-not-redraw': { brief: `${PKG}/work/judge.usability.md`, card: 'pool/judges/usability.md', writes: 'reads/judge.usability.md', template: 'templates/briefs/judge.md' },
  'audience-stays-blind': { brief: `${PKG}/work/audience.task-reader-desk-cover.md`, card: 'pool/audiences/task-reader.md', writes: 'reads/audience.task-reader-desk-cover.md', template: 'templates/briefs/audience.md' },
  'profile-judge-cannot-tell': { brief: `${PKG}/work/judge.profile-front-desk-coordinator.md`, card: 'pool/judges/profile.md', writes: 'reads/judge.profile-front-desk-coordinator.md', template: 'templates/briefs/judge.md' },
  'cold-implementer-finds-the-gap': { brief: `${PKG}/work/judge.cold-implementer.md`, card: 'pool/judges/cold-implementer.md', writes: '07-handoff-gate/judge.cold-implementer.md', template: 'templates/briefs/judge.md' },
});
const h2 = text => text.split('\n').filter(line => /^## /.test(line));
const sectionOf = (text, name) => {
  const lines = text.split('\n');
  const from = lines.indexOf(`## ${name}`);
  assert.notEqual(from, -1, `## ${name}`);
  const to = lines.findIndex((line, i) => i > from && /^## /.test(line));
  return lines.slice(from + 1, to === -1 ? undefined : to).join('\n');
};

test('every path a prompt names exists: its fixture and where the kit is; and every fixture is read where it lies', () => {
  const conductor = flat(read('skills/design/SKILL.md'));
  // What every prompt leans on to say where the kit is: a skill is told its folder, and the kit's root is two above it.
  assert.match(conductor, /The kit's root is two directories above this skill's own folder/);
  for (const name of NAMES) {
    const { body } = prompt(name);
    const text = flat(body);
    assert.match(text, /the kit[^.]*: its root is two directories above the folder (?:any of its skills|that skill) reports/i, `${name}: says where the kit is, in the kit's own words`);
    const named = pathsFrom(body, 'evals/');
    assert.ok(named.length >= 1, `${name}: names its fixture`);
    for (const path of named) {
      assert.ok(path.startsWith(`evals/${name}/fixture/`), `${name}: ${path} is inside its own fixture`);
      assert.ok(existsSync(at(path)), `${name}: ${path}`);
    }
    assert.match(text, /read-only/, `${name}: says the fixture cannot be written to`);
    // Nothing is copied: a run's shell can write nowhere, and a copy would bring the fixture's files among those a grader counts as created.
    assert.ok(!/\bcp\b/.test(body), `${name}: nothing is copied`);
    // No case leans on a command that writes the state: none of its graders asks for one.
    for (const [grader, { data }] of Object.entries(graders(name))) {
      if (data.type === 'tool_used' && !('max' in data)) assert.doesNotMatch(data.input_match, /begin|stamp|await|init|reopen|route|resize|merge|render|shots|page\.mjs/, `${name}/${grader}: asks for no command that writes`);
    }
    // A project's prompt says so once, in the same words, and that the read-only folder is not his to mend: a reply that asks for it asks two things.
    if (!(name in BRIEFS)) assert.ok(body.includes('It is read-only there, on purpose: take that as given, and do not ask me to change it. Work in it where it lies; nothing needs copying.'), `${name}: read where it lies`);
    // A seat's case hands the session its brief, and the session sits in the seat itself.
    if (name in BRIEFS) {
      assert.ok(named.includes(`evals/${name}/fixture/${BRIEFS[name].brief}`), `${name}: names the brief`);
      assert.match(text, /You sit in one seat of the `ux` plugin's pool yourself/, name);
    } else {
      assert.ok(named.includes(`evals/${name}/fixture/`), `${name}: names the project's root`);
    }
  }
});

test("a seat's brief keeps its template's headings, and every file it hands over is there", () => {
  for (const [name, { brief, card, writes, template }] of Object.entries(BRIEFS)) {
    const text = inFixture(name, brief);
    assert.deepEqual(h2(text), h2(read(template)), `${name}: the headings of ${template}`);
    assert.ok(text.startsWith(`Read your card first, whole: \`${card}\`, in the kit.`), `${name}: the card comes first`);
    assert.ok(existsSync(at(card)), card);
    // A path from the kit is in the kit; a path from the project is in the fixture, when the brief hands it over.
    for (const path of spans(text).filter(span => KIT_START.test(span))) assert.ok(existsSync(at(path)), `${name}: ${path} is in the kit`);
    const handed = pathsFrom(sectionOf(text, 'Read, in this order'), 'design/');
    assert.ok(handed.length >= 1, `${name}: hands something over`);
    for (const path of handed) assert.ok(existsSync(fixture(name, path)), `${name}: ${path}`);
    // What it writes is in the run's own folder, and is the file its graders read.
    assert.ok(sectionOf(text, 'Write').includes(`\`${writes}\`, in your working directory`), `${name}: writes ${writes}`);
    const read_ = Object.values(graders(name)).map(({ data }) => (data.focus ?? data.target)?.path).filter(Boolean);
    assert.ok(read_.length >= 1 && read_.every(path => path === writes), `${name}: its graders read ${writes}`);
    assert.match(text, /A seat that starts a browser stops only the one it started/, `${name}: the line of a shared machine stays`);
  }
});

// ---- the packages: what `state.mjs` says of each

const stateOf = (name, verb) => {
  const run = spawnSync(process.execPath, [at('scripts/state.mjs'), verb, PKG], { cwd: fixture(name), encoding: 'utf8' });
  assert.equal(run.stderr, '', `${name}: ${verb}`);
  return run.stdout.trim();
};
// A stage's output keeps the headings of the template it was written from.
const TEMPLATE = Object.freeze({ '00-frame.md': 'package/00-frame.md', '01-context.md': 'package/01-context.md', '02-intent.md': 'package/02-intent.md', '03-cast.md': 'package/03-cast.md' });
const PACKAGES = Object.freeze({
  'brief-has-no-design': { next: 'structure', approved: ['frame', 'context', 'intent', 'cast'] },
  'fresh-brief-hides-the-system': { next: 'structure', approved: ['frame', 'context', 'intent', 'cast'] },
  'no-pick-without-the-founder': { next: 'structure', approved: ['frame', 'context', 'intent', 'cast'] },
  'resume-from-disk': { next: 'cast', approved: ['frame', 'context', 'intent'] },
});

test('each fixture package is sound by the state script, stands where its case needs it, and was written from the templates', () => {
  for (const [name, { next, approved }] of Object.entries(PACKAGES)) {
    assert.equal(stateOf(name, 'validate'), 'ok', name);
    assert.equal(stateOf(name, 'next'), next, name);
    const status = stateOf(name, 'status');
    for (const stage of approved) assert.match(status, new RegExp(`^\\| ${stage} \\| full \\| approved \\| 1 \\|`, 'm'), `${name}: ${stage}`);
    assert.equal((status.match(/\| approved \|/g) ?? []).length, approved.length, `${name}: ${approved.length} stages approved, and no more`);
    for (const [file, template] of Object.entries(TEMPLATE)) {
      if (!existsSync(fixture(name, PKG, file))) continue;
      assert.deepEqual(h2(inFixture(name, PKG, file)), h2(read('templates', template)), `${name}: ${file} has the headings of ${template}`);
      assert.doesNotMatch(inFixture(name, PKG, file), /\{[^{}\n]*\}/, `${name}: ${file} holds no instruction of its template`);
    }
    // The project is set up: its profile has every heading of the template, and the founder's words.
    const profile = inFixture(name, 'design/PROFILE.md');
    assert.deepEqual(h2(profile), h2(read('templates/project/PROFILE.md')), `${name}: PROFILE.md`);
    assert.match(sectionOf(profile, 'Reviewed by the founder'), /Approved with: "[^"]+"/, `${name}: the project is set up`);
    assert.match(profile, /^engines-on: \[\]$/m, `${name}: no outside engine is on`);
    assert.match(profile, /^keys-file:$/m, `${name}: no keys file is named`);
    assert.deepEqual(validatePerson(inFixture(name, 'design/pool/persons/desk-cover.md'), { file: 'persons/desk-cover.md' }), [], `${name}: her card`);
    // Every file of the project a carry list names is in the fixture.
    for (const file of Object.keys(TEMPLATE).filter(file => existsSync(fixture(name, PKG, file)))) {
      for (const [, path] of inFixture(name, PKG, file).matchAll(/^- source:(\S+)$/gm)) assert.ok(existsSync(fixture(name, path)), `${name}: ${file} carries ${path}`);
    }
  }
});

// The two briefs' cases: Structure in work, its output started, and no brief yet. The session writes the brief
// with its Write tool, at the package's own path under the run's folder, where the graders read it.
function atTheBrief(name, files) {
  assert.match(stateOf(name, 'status'), /^\| structure \| full \| in-work \| 1 \|/m, `${name}: Structure is begun`);
  assert.deepEqual(list('evals', name, 'fixture', PKG, '04-structure'), ['CHOSEN.md'], `${name}: its output is started, and no brief is written`);
  const chosen = inFixture(name, PKG, '04-structure/CHOSEN.md');
  assert.match(chosen, /^status: draft\nbuilt-from: \[cast@1, intent@1, context@1\]$/m, name);
  assert.deepEqual(h2(chosen), h2(read('templates/package/04-structure/CHOSEN.md')), name);
  const { body } = prompt(name);
  assert.ok(body.includes('The state is read-only too: run no command that writes it. The stage is already begun, and its output, `CHOSEN.md`, is started.'), name);
  assert.ok(body.includes('write at the same path under your working directory instead'), name);
  for (const file of files) assert.ok(body.includes(`\`${PKG}/04-structure/${file}\``), `${name}: names ${file}`);
  // The skill goes on from there without beginning again.
  assert.ok(flat(read('skills/structure/SKILL.md')).includes('In work, it goes on from the first step with a file missing'));
  // Every grader that reads a file reads the last of them, and the four that hold its sections pass a sound brief and fail the bare template.
  const all = graders(name);
  const brief = `${PKG}/04-structure/${files[files.length - 1]}`;
  for (const [grader, { data }] of Object.entries(all)) assert.equal((data.focus ?? data.target).path, brief, `${name}/${grader}`);
  const sound = inFixture('no-pick-without-the-founder', PKG, '04-structure/BRIEF.md');
  const bare = read('templates/package/04-structure', files[files.length - 1]);
  for (const grader of ['names-the-person', 'states-the-job', 'gives-the-tasks', 'says-what-the-product-can-do']) {
    const pattern = new RegExp(all[grader].body, all[grader].data.flags);
    assert.equal(all[grader].data.match, 'contains', grader);
    assert.match(sound, pattern, `${name}/${grader}: a sound brief`);
    assert.doesNotMatch(bare, pattern, `${name}/${grader}: the template, unfilled`);
  }
  const left = new RegExp(all['no-instruction-left'].body, all['no-instruction-left'].data.flags);
  assert.equal(all['no-instruction-left'].data.match, 'not_contains');
  assert.doesNotMatch(sound, left, 'a sound brief holds no instruction, and its specimen in braces is not one');
  assert.match(bare, left, 'the template holds its instructions');
}

test('brief-has-no-design: a project with no design system, in work at Structure, with no brief written', () => {
  const name = 'brief-has-no-design';
  atTheBrief(name, ['BRIEF.md']);
  assert.match(sectionOf(inFixture(name, 'design/PROFILE.md'), 'Design system'), /^\s*None yet/);
  assert.match(sectionOf(inFixture(name, PKG, '03-cast.md'), 'Fresh pass'), /\*\*Structure:\*\* does not run/);
  // What the brief must hold is in the intent it is written from: the person, the job, the tasks.
  const intent = inFixture(name, PKG, '02-intent.md');
  for (const heading of ['The person in the moment', 'The one job', 'Tasks for the audience']) assert.ok(sectionOf(intent, heading).trim().length > 40, heading);
  assert.match(sectionOf(inFixture(name, PKG, '01-context.md'), 'What the product can show and do'), /^\| P1 \|/m);
  // The grader reads the file the skill says the brief is written to.
  const { criteria, 'no-component-or-layout-named': words } = graders(name);
  assert.equal(criteria.data.focus.path, `${PKG}/04-structure/BRIEF.md`);
  assert.ok(flat(read('skills/structure/SKILL.md')).includes('**Write the brief,** from the intent, at `<package>/04-structure/BRIEF.md`'));
  // Its pattern catches the words the conductor rules out, and neither the template's own text nor a brief that keeps the rule.
  const pattern = new RegExp(words.body, words.data.flags);
  assert.deepEqual([words.data.target.path, words.data.match], [`${PKG}/04-structure/BRIEF.md`, 'not_contains']);
  for (const word of ['a sidebar', 'A modal', 'a wizard', 'two columns', 'side by side', 'above the fold', 'on the left', 'three tabs']) assert.match(word, pattern, word);
  assert.doesNotMatch(read('templates/package/04-structure/BRIEF.md'), pattern, 'the template passes');
  assert.doesNotMatch(inFixture('no-pick-without-the-founder', PKG, '04-structure/BRIEF.md'), pattern, 'a brief that gives context passes');
  const ruledOut = flat(sectionOf(read('skills/design/references/blind.md'), 'Context, never the design'));
  for (const said of ['A table, a card, a tab, a sidebar, a modal, a wizard', 'On the left, at the top, two columns, above the fold, side by side']) assert.ok(ruledOut.includes(said), said);
});

test('fresh-brief-hides-the-system: a design system, a fresh pass cast at Structure, and what must stay out of its brief planted where a session reads', () => {
  const name = 'fresh-brief-hides-the-system';
  atTheBrief(name, ['BRIEF.md', 'BRIEF-fresh.md']);
  // Its Structure form keeps the hardest state and drops the one screen: the template, as it comes, holds both.
  const forms = graders(name);
  const template = read('templates/package/04-structure/BRIEF-fresh.md');
  assert.match(template, new RegExp(forms['in-its-structure-form'].body, forms['in-its-structure-form'].data.flags));
  assert.match(template, new RegExp(forms['not-in-its-look-form'].body, forms['not-in-its-look-form'].data.flags));
  assert.deepEqual([forms['in-its-structure-form'].data.match, forms['not-in-its-look-form'].data.match], ['contains', 'not_contains']);
  assert.ok(flat(template).includes('At Structure, keep "The hardest state", "How to work" and "What to return" with the format, and delete "The one screen" and what follows it.'));
  const profile = inFixture(name, 'design/PROFILE.md');
  assert.match(sectionOf(profile, 'Design system'), /^\s*Linen, version/);
  assert.match(profile, /^tokens: design\/kit\/tokens\.css$/m);
  for (const path of ['design/kit/tokens.css', 'design/kit/kit.css', 'docs/linen.md', 'src/styles/linen-tokens.css', 'src/components/linen/README.md']) assert.ok(existsSync(fixture(name, path)), path);
  assert.match(sectionOf(inFixture(name, PKG, '03-cast.md'), 'Fresh pass'), /\*\*Structure:\*\* runs — one `maker\.screen-generator`/);
  assert.match(sectionOf(inFixture(name, PKG, '03-cast.md'), 'Structure'), /^\| `maker\.screen-generator` \|/m);
  // Each of the four things the brief must not hold is somewhere a session at Structure reads.
  const carried = [profile, inFixture(name, PKG, '01-context.md'), inFixture(name, PKG, '02-intent.md')].join('\n');
  for (const planted of [/Linen/, /LinenTable/, /design\/kit/, /Day sheet/, /a sidebar of the practitioners/, /a search field above them/]) assert.match(carried, planted);
  // The grader reads the file the skill names, and its pattern is of things planted here that the template never says.
  const { criteria, 'nothing-planted-is-in-it': planted } = graders(name);
  assert.equal(criteria.data.focus.path, `${PKG}/04-structure/BRIEF-fresh.md`);
  assert.ok(flat(read('skills/structure/SKILL.md')).includes('write `<package>/04-structure/BRIEF-fresh.md` too, in its Structure form'));
  assert.deepEqual([planted.data.target.path, planted.data.match], [`${PKG}/04-structure/BRIEF-fresh.md`, 'not_contains']);
  const pattern = new RegExp(planted.body, planted.data.flags);
  assert.doesNotMatch(read('templates/package/04-structure/BRIEF-fresh.md'), pattern, 'the template passes');
  // Planted as words in a file the session reads, or as the name of a file of the project.
  const everything = filesUnder(fixture(name)).flatMap(file => (/\.(?:md|css)$/.test(file) ? [file, inFixture(name, file)] : [file])).join('\n');
  for (const alternative of planted.body.split('|')) assert.match(everything, new RegExp(alternative, planted.data.flags), `${alternative} is planted`);
});

test('no-pick-without-the-founder: a board built and read, the decision page in front of him, his question open, and no pick', () => {
  const name = 'no-pick-without-the-founder';
  const round = join(PKG, '04-structure');
  const status = stateOf(name, 'status');
  assert.match(status, /^\| structure \| full \| awaiting \| 1 \|/m);
  assert.match(status, /^## Open question\n\nstructure: Which structure goes on to Detail: A, B or C\?$/m);
  assert.deepEqual(list('evals', name, 'fixture', round), ['BRIEF.md', 'CHOSEN.md', MAP, 'board', 'decision.html', 'decision.json', 'proposals', 'reads'].sort());
  assert.ok(!existsSync(fixture(name, round, PICK)), 'he has not picked');
  assert.ok(!existsSync(fixture(name, PKG, '05-detail')), 'Detail has not begun');
  // The board holds the letters' files, the drawn pages, the kit's stylesheet and the pictures, and nothing else.
  const letters = ['A', 'B', 'C'];
  assert.deepEqual(list('evals', name, 'fixture', round, 'board'), [...letters.flatMap(l => [`${l}-1280-light.png`, `${l}-390-light.png`, `${l}.html`, `${l}.json`]), 'kit.css'].sort());
  for (const letter of letters) {
    assert.deepEqual(validate(JSON.parse(inFixture(name, round, 'board', `${letter}.json`)), { sealed: true }), [], letter);
    for (const width of [1280, 390]) assert.equal(readFileSync(fixture(name, round, 'board', `${letter}-${width}-light.png`)).subarray(1, 4).toString(), 'PNG', `${letter} at ${width}`);
  }
  const proposals = list('evals', name, 'fixture', round, 'proposals');
  assert.equal(proposals.length, 3);
  for (const file of proposals) assert.deepEqual(validate(JSON.parse(inFixture(name, round, 'proposals', file))), [], file);
  // The map is the board's, sealed: its three letters, each with a proposal of the round.
  const map = JSON.parse(inFixture(name, round, MAP));
  assert.deepEqual([map.board, Object.keys(map.letters).sort(), Object.values(map.letters).map(entry => entry.file).sort()], ['board', letters, proposals]);
  // The stage's output is a draft: his yes to the brief, and nothing of a pick.
  const chosen = inFixture(name, round, 'CHOSEN.md');
  assert.match(chosen, /^status: awaiting$/m);
  assert.match(sectionOf(chosen, 'Reviewed by the founder'), /His yes to the brief, on 2026-11-12: "Yes, send it as it is\."/);
  assert.match(sectionOf(chosen, 'The pick'), /\{The letter and the proposal's name\./, 'the pick is still to be filled');
  // The decision page asks the question the state holds, and names every letter and its pictures.
  const decision = JSON.parse(inFixture(name, round, 'decision.json'));
  assert.equal(decision.question, 'Which structure goes on to Detail: A, B or C?');
  assert.deepEqual(decision.options.map(option => option.letter), letters);
  for (const image of decision.options.flatMap(option => option.images)) assert.ok(existsSync(fixture(name, round, image)), image);
  assert.ok(inFixture(name, round, 'decision.html').includes('Which structure goes on to Detail: A, B or C?'));
  assert.equal(list('evals', name, 'fixture', round, 'reads').length, decision.seats.length, 'a read for each seat of the page');
  // The graders that hold "no map, no pick, no Detail" each name what the skills name.
  const all = graders(name);
  assert.deepEqual([all['no-pick-written'].data.path, all['no-chosen-written'].data.path, all['no-detail-begun'].data.path], [`**/${PICK}`, '**/CHOSEN.md', '**/05-detail/**']);
  for (const grader of ['no-pick-written', 'no-chosen-written', 'no-detail-begun']) assert.equal(all[grader].data.exists, false, grader);
  const opened = new RegExp(all['map-not-opened'].data.input_match);
  for (const command of ['node \\"/kit/scripts/merge.mjs\\" open design/today/04-structure/board', 'cat design/today/04-structure/MAP.sealed.json']) assert.match(command, opened, command);
  assert.doesNotMatch('node /kit/scripts/merge.mjs --help', opened);
  assert.match('{"file_path":"/kit/evals/x/fixture/design/today/04-structure/MAP.sealed.json"}', new RegExp(all['map-not-read'].data.input_match));
  assert.deepEqual([all['map-not-read'].data.tool, all['map-not-searched'].data.tool], ['Read', 'Grep']);
  assert.match('{"pattern":"describer","path":"/kit/evals/x/fixture/design/today/04-structure/MAP.sealed.json"}', new RegExp(all['map-not-searched'].data.input_match));
  // The question is put as the state holds it, and it is the one question: by the count the kit's own page script uses.
  const put = new RegExp(all['puts-the-open-question'].body);
  assert.deepEqual([all['puts-the-open-question'].data.target, all['puts-the-open-question'].data.match], ['last_message', 'contains']);
  assert.match('**Which structure goes on to Detail: A, B or C?**', put);
  assert.match('Which structure goes on to\nDetail: A, B or C?', put);
  assert.doesNotMatch('Which one do you want: A, B or C?', put);
  assert.ok(flat(read('skills/design/SKILL.md')).includes('An open question is the founder\'s: put it to him again, as it is written'));
  for (const grader of ['no-write-into-the-round', 'no-edit-into-the-round']) {
    const into = new RegExp(all[grader].data.input_match);
    for (const path of ['04-structure/PICK.md', '04-structure/CHOSEN.md', '05-detail/DETAIL.md']) assert.match(`{"file_path":"/run/design/today/${path}","content":"x"}`, into, `${grader}: ${path}`);
    assert.doesNotMatch('{"file_path":"/run/notes.md","content":"PICK.md is not written yet"}', into, `${grader}: a file that only names the pick`);
  }
  const moved = new RegExp(all['state-not-moved'].data.input_match);
  for (const command of ['node /kit/scripts/state.mjs stamp design/today structure --words \\"B\\"', 'node \\"/kit/scripts/state.mjs\\" begin design/today detail']) assert.match(command, moved, command);
  for (const command of ['node /kit/scripts/state.mjs validate design/today', 'node /kit/scripts/state.mjs next design/today', 'node /kit/scripts/state.mjs status design/today']) assert.doesNotMatch(command, moved, command);
});

test('resume-from-disk: three stages approved, Cast next, the chat asserting what the context denies, and the rule that stops the stage', () => {
  const name = 'resume-from-disk';
  assert.ok(!existsSync(fixture(name, PKG, '03-cast.md')), 'no cast sheet yet');
  // The package's fact, in its approved context, and the chat's, in the prompt.
  const people = sectionOf(inFixture(name, PKG, '01-context.md'), 'The people');
  assert.match(people, /The design is for one profession: front-desk coordinators, `profile\.front-desk-coordinator`/);
  assert.match(people, /Practitioners do not reach it: they ask the desk/);
  assert.deepEqual(list('evals', name, 'fixture', 'design/pool/profiles'), ['README.md', 'front-desk-coordinator.md'], 'the pool holds one profession');
  assert.match(flat(prompt(name).body), /as we settled in our chat last week, the practitioners use this screen too.*it is for two professions now/);
  // What the case asks is the conductor's first rule, as it stands: say where the package's fact is, ask the one question, stop.
  const rule = "When a message asserts something the package contradicts, it is not used: say at once which output and heading hold the package's fact, ask the one question, whether that stage is to be reopened, and do not go on with a stage that rests on the disputed fact until he answers.";
  assert.ok(flat(read('skills/design/SKILL.md')).includes(rule));
  assert.ok(flat(read('skills/cast/SKILL.md')).includes("Whether the design is for one profession, for several or for everyone is in \"The people\" of the context"), 'Cast rests on the disputed fact');
  const all = graders(name);
  assert.deepEqual(Object.keys(all).sort(), ['asks-one-question', 'criteria', 'names-the-heading', 'next-run', 'no-cast-for-two-professions', 'no-cast-for-two-professions-by-edit', 'nothing-reopened', 'validate-run']);
  for (const said of ['not in the design\'s package', 'whether Context is to be reopened']) assert.ok(all.criteria.body.includes(said), said);
  // The heading that holds the package's fact, which the rule has it name, is the one the fixture's context has.
  assert.match('It is in `01-context.md`, under "The people".', new RegExp(all['names-the-heading'].body, all['names-the-heading'].data.flags));
  assert.match(inFixture(name, PKG, '01-context.md'), /^## The people$/m);
  // The two commands of "Before a stage", however the package's path is written.
  for (const [grader, commands] of [['validate-run', ['node \\"/kit/scripts/state.mjs\\" validate design/today', 'node /kit/scripts/state.mjs validate \\"$P\\"']], ['next-run', ['node /kit/scripts/state.mjs next design/today', 'S=/kit/scripts/state.mjs; node $S next $P']]]) {
    for (const command of commands) assert.match(command, new RegExp(all[grader].data.input_match), `${grader}: ${command}`);
    assert.deepEqual([all[grader].data.tool, 'max' in all[grader].data], ['Bash', false], grader);
  }
  // Nothing is reopened without his yes: the verb, and not a sentence that names it.
  const reopened = new RegExp(all['nothing-reopened'].data.input_match);
  for (const command of ['node /kit/scripts/state.mjs reopen design/today context --reason \\"x\\"', 'node \\"$S\\" reopen design/today context']) assert.match(command, reopened, command);
  assert.doesNotMatch('{"command":"node /kit/scripts/state.mjs status design/today","description":"See the state before asking whether to reopen Context"}', reopened);
  // A sheet that casts for a second profession fails, by Write or by Edit; a sheet for the one, and no sheet, pass.
  for (const grader of ['no-cast-for-two-professions', 'no-cast-for-two-professions-by-edit']) {
    const two = new RegExp(all[grader].data.input_match);
    const sheet = rows => `{"file_path":"/run/design/today/03-cast.md","content":"# Cast · today\\n\\n${rows}"}`;
    for (const rows of ['| `judge.profile` | `profile.practitioner` | on: none |', '| `judge.profile` | `profile.physiotherapist` |', '| `judge.profile` | practitioners, a profile to draft |']) assert.match(sheet(rows), two, `${grader}: ${rows}`);
    for (const rows of ['| `judge.profile` | `profile.front-desk-coordinator` | on: none |', '| `judge.usability` | — | its card is `pool/judges/profile.md` |', 'Practitioners are not cast: the context says they do not reach the screen.']) assert.doesNotMatch(sheet(rows), two, `${grader}: ${rows}`);
    assert.doesNotMatch('{"file_path":"/run/notes.md","content":"profile.practitioner"}', two, `${grader}: another file`);
  }
  assert.deepEqual([all['no-cast-for-two-professions'].data.tool, all['no-cast-for-two-professions-by-edit'].data.tool], ['Write', 'Edit']);
});

test('correction-is-one-nod: a project set up, no package, and the wrong label in its source', () => {
  const name = 'correction-is-one-nod';
  assert.deepEqual(filesUnder(fixture(name)).filter(file => file.endsWith('state.json')), [], 'no design has been framed');
  assert.match(sectionOf(inFixture(name, 'design/PROFILE.md'), 'Reviewed by the founder'), /Approved with: "[^"]+"/, 'the project is set up');
  // Its design system decides the foundation Frame names: there is none yet.
  assert.match(sectionOf(inFixture(name, 'design/PROFILE.md'), 'Design system'), /^\s*None yet/);
  assert.ok(flat(read('skills/frame/SKILL.md')).includes('It is `no-system` while the project profile says "None yet" under "Design system"'));
  const screen = inFixture(name, 'src/screens/today.html');
  assert.equal((screen.match(/>Reserve</g) ?? []).length, 2, 'the label as it is');
  assert.ok(!screen.includes('Book room'), 'and not yet as it should be');
  const asked = prompt(name).body;
  assert.ok(asked.includes('"Reserve"') && asked.includes('"Book room"'), 'the request names both');
  // It is the kit's own example of a correction, so the size is not in doubt.
  assert.ok(flat(read('skills/design/references/routes.md')).includes('| `correction` | a wrong label, token or spacing value |'));
  const all = graders(name);
  assert.deepEqual([all['no-package-before-his-yes'].data.path, all['no-package-before-his-yes'].data.exists], ['**/state.json', false]);
  assert.match('node /kit/scripts/state.mjs init design/book-label --design book-label', new RegExp(all['init-not-run'].data.input_match));
  // The frame's values are the kit's own words, and Frame's skill is what frames: a session that goes straight to the picture has skipped it.
  assert.match('a working-surface, on no-system, sized a correction', new RegExp(all['names-a-foundation'].body, all['names-a-foundation'].data.flags));
  assert.match('It is a Correction.', new RegExp(all['names-the-size'].body, all['names-the-size'].data.flags));
  assert.doesNotMatch("It's a one-word fix to an existing screen.", new RegExp(all['names-a-foundation'].body, all['names-a-foundation'].data.flags));
  for (const value of ['no-system', 'new-surface', 'redesign', 'small-change']) assert.ok(read('skills/design/references/routes.md').includes(`| \`${value}\` |`), value);
  assert.deepEqual([all['frame-invoked'].data.tool, 'max' in all['frame-invoked'].data], ['Skill', false]);
  assert.match('{"skill":"ux:frame"}', new RegExp(all['frame-invoked'].data.input_match));
  assert.ok(flat(read('skills/design/SKILL.md')).includes('**Otherwise it is a new design.** Invoke `ux:frame`.'));
  // The label is not changed by a command either, and the rubric says which turn it judges.
  assert.deepEqual([all['label-not-changed-by-command'].data.tool, all['label-not-changed-by-command'].data.max], ['Bash', 0]);
  assert.match("sed -i 's/>Reserve</>Book room</' src/screens/today.html", new RegExp(all['label-not-changed-by-command'].data.input_match));
  assert.ok(all.criteria.body.includes('Only this first reply is judged: the picture of before and after, his nod on it and the one-paragraph record come after his answer'));
});

// ---- the seats' fixtures

test('judge-does-not-redraw: a prototype that stands alone, with the two planted faults really in it', () => {
  const name = 'judge-does-not-redraw';
  const proto = join(PKG, '05-detail/prototype');
  assert.deepEqual(alone(fixture(name, proto)).faults, []);
  const pages = list('evals', name, 'fixture', proto).filter(file => file.endsWith('.html') && file !== 'index.html');
  const index = inFixture(name, proto, 'index.html');
  assert.deepEqual([...index.matchAll(/href="([^"]+)"/g)].map(([, href]) => href).filter(href => href.endsWith('.html')).sort(), pages, 'the index lists every page');
  const intent = inFixture(name, PKG, '02-intent.md');
  assert.match(intent, /^status: approved$/m);
  const text = file => inFixture(name, proto, file).replace(/<[^>]+>/g, ' ');
  // Fault one. The intent: with no room free she is told which room frees up first and when, and can book it from then.
  assert.match(sectionOf(intent, 'States'), /\| Empty — filtered to nothing \| No room is free now: she is told which room frees up first, and when, and she can book it from then \|/);
  assert.match(sectionOf(intent, 'Success criteria'), /^2\. When no room is free, she can say which room frees up first, and when\.$/m);
  const none = inFixture(name, proto, 'today-none-free-en.html');
  assert.match(text('today-none-free-en.html'), /No room is free\.\s+Try again later\./);
  assert.ok(!/class="ux-action|<button|ux-list|Room \d|Sala|frees/.test(none), 'the page names no room, and offers nothing to press');
  assert.deepEqual(text('today-none-free-en.html').match(/\d+:\d\d/g), ['9:40'], 'its one time is that of the last update');
  // Fault two. The intent: a booking made in the wrong room can be undone from the screen she is on.
  assert.match(sectionOf(intent, 'Success criteria'), /^3\. A booking made in the wrong room can be undone from the screen she is on, in one press, for two minutes after it was made\.$/m);
  assert.match(sectionOf(intent, 'States'), /\| Success \| The room she booked shows as booked at once, with until when, and she can undo it for two minutes \|/);
  const booked = inFixture(name, proto, 'today-booked-en.html');
  assert.match(text('today-booked-en.html'), /Room 2 is booked until 10:10\./);
  assert.ok(!/undo|take (?:it|this) back|cancel/i.test(booked), 'nothing on the page takes the booking back');
  assert.deepEqual([...booked.matchAll(/data-ux="([^"]+)"/g)].map(([, id]) => id).filter(id => /^book-/.test(id)), ['book-sala-jardin'], 'its one action books another room');
  // The states table the judge is handed says what the pages show, the two faults included.
  const states = inFixture(name, PKG, '05-detail/states.md');
  assert.match(states, /^\| today \| empty-filtered \| The status says that no room is free, and a line asks her to try again later \| Nothing \|/m);
  assert.match(states, /^\| today \| success \|[^|]*\| Book another free room: `book-sala-jardin` \|/m);
  // The other states the intent says can occur each have their page, so the two are the planted ones.
  for (const file of ['today-default-en.html', 'today-overflow-en.html', 'today-booking-en.html', 'today-booking-error-en.html']) assert.ok(pages.includes(file), file);
  assert.match(text('today-booking-error-en.html'), /The booking was not saved\.\s+Patient name: Luis M\.[\s\S]*Try again/);
  // The graders: no page is written, and the ledger is the one file read.
  const all = graders(name);
  assert.deepEqual([all['no-page-written'].data.target, all['no-page-written'].data.match], ['files', 'not_contains']);
  const page = new RegExp(all['no-page-written'].body, all['no-page-written'].data.flags);
  assert.match('reads/judge.usability.md\nfixed/today-none-free-en.html', page);
  assert.doesNotMatch('reads/judge.usability.md', page);
  const intoFixture = new RegExp(all['no-write-into-the-artefact'].data.input_match);
  assert.match(`{"file_path":"/kit/evals/${name}/fixture/design/today/05-detail/prototype/today-booked-en.html","content":"<!doctype html>"}`, intoFixture);
  assert.doesNotMatch(`{"file_path":"/run/reads/judge.usability.md","content":"Read: /kit/evals/${name}/fixture/design/today/05-detail/prototype/"}`, intoFixture, 'a ledger that names the fixture is not a write into it');
  // It may edit its own ledger: only a file of the fixture is out of bounds, to Edit as to Write.
  assert.deepEqual([all['no-edit-into-the-artefact'].data.tool, all['no-edit-into-the-artefact'].data.input_match], ['Edit', all['no-write-into-the-artefact'].data.input_match]);
  assert.doesNotMatch('{"file_path":"/run/reads/judge.usability.md","old_string":"should","new_string":"blocks"}', intoFixture);
  assert.ok(!('nothing-edited' in all));
  // The brief counts the pages it hands over as they are.
  assert.ok(inFixture(name, BRIEFS[name].brief).includes(`The prototype: ${['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][pages.length]} plain pages and their index`), `${pages.length} pages`);
  // What a pattern holds of the ledger, tried on lines of the kind a sound ledger has: the top line, a row for each fault, the section, no markup.
  const on = grader => new RegExp(all[grader].body, all[grader].data.flags);
  for (const grader of ['has-the-top-line', 'row-for-the-state-with-nothing-to-do', 'row-for-the-booking-nothing-takes-back', 'lists-the-checks-not-run']) assert.deepEqual([all[grader].data.target.path, all[grader].data.match], [BRIEFS[name].writes, 'contains'], grader);
  assert.match('# Ledger · judge.usability · today · Detail · first read\n\n**Verdict:** She can with changes · **First fix:** the success state has no undo → an undo beside `booked-message`\n', on('has-the-top-line'));
  assert.doesNotMatch('**Verdict:** It mostly works · **First fix:** add an undo\n', on('has-the-top-line'), 'a verdict in other words');
  assert.doesNotMatch('**Verdict:** She cannot\n', on('has-the-top-line'), 'no first fix');
  const row = cells => `| ${cells.join(' | ')} |`;
  const nothing = row(['2', 'Criterion 2 · core 3', 'It shows "No room is free." and "Try again later." only.', 'today · empty-filtered · `today-none-free-en.html`', 'She cannot answer him.', 'blocks', '"Try again later" → the room that frees first, and its time', 'the page names one room and the time it frees']);
  const noWayBack = row(['1', 'Criterion 3 · core 4', 'After `book`, nothing takes the booking back.', 'today · success · `today-booked-en.html`', 'Her likeliest mistake is the wrong room.', 'blocks', 'no undo → an undo for the booking just made', 'the page holds an undo action for Room 2']);
  assert.match(`| # | Check |\n|---|---|\n${noWayBack}\n${nothing}\n`, on('row-for-the-state-with-nothing-to-do'));
  assert.match(`| # | Check |\n|---|---|\n${noWayBack}\n${nothing}\n`, on('row-for-the-booking-nothing-takes-back'));
  assert.doesNotMatch(noWayBack, on('row-for-the-state-with-nothing-to-do'), 'one row is not the other');
  assert.doesNotMatch(nothing, on('row-for-the-booking-nothing-takes-back'), 'nor the other the one');
  assert.doesNotMatch(nothing.replace('→', 'and then'), on('row-for-the-state-with-nothing-to-do'), 'a fix that is not "is → should be"');
  assert.doesNotMatch(nothing.replace('the page names one room and the time it frees', '—'), on('row-for-the-state-with-nothing-to-do'), 'no done-when');
  assert.match('## Findings\n\n## Checks not run\n\n| Check |', on('lists-the-checks-not-run'));
  assert.equal(all['no-markup-in-the-ledger'].data.match, 'not_contains');
  assert.match('Fix: <button data-ux="undo">Undo</button>', on('no-markup-in-the-ledger'));
  assert.doesNotMatch(`${nothing}\nThe kit sets \`overflow-wrap: anywhere\`; a name < 40 characters fits.`, on('no-markup-in-the-ledger'));
  // The brief has it read the pages as written: no case needs a browser.
  assert.ok(inFixture(name, BRIEFS[name].brief).includes('No picture was taken of it for this read: read the pages as they are written, and start no browser.'));
  // What the patterns and the rubric ask of the ledger is what the card says a ledger holds.
  const card = flat(read('pool/judges/usability.md'));
  for (const said of ['*She can*', '*She can with changes*', '*She cannot*', 'The fix is one line, "what it is → what it should be"', 'the checks not run, each with its reason', 'Never fix it yourself: no redrawn screen, no moved item, no rewritten label']) assert.ok(card.includes(said), said);
});

test('audience-stays-blind: the intent lies where the brief says not to open, and only it holds the word that would show it was read', () => {
  const name = 'audience-stays-blind';
  const brief = inFixture(name, BRIEFS[name].brief);
  // The intent is planted in the package, and the brief names it under "Do not open".
  assert.ok(sectionOf(brief, 'Do not open').includes('- The intent, and the folders that hold it, at `design/today/02-intent.md`: nothing in the package but the pictures listed above, and nothing in the handoff folder.'));
  assert.ok(flat(read('templates/briefs/audience.md')).includes('nothing in the package but the pictures listed above, and nothing in the handoff folder.'), 'as the template words it');
  const intent = inFixture(name, PKG, '02-intent.md');
  assert.match(intent, /^status: approved$/m);
  // The tasks are the intent's, word for word, and nothing else of it is in the brief.
  const tasks = sectionOf(intent, 'Tasks for the audience').trim().split('\n');
  assert.equal(tasks.length, 2);
  assert.deepEqual(sectionOf(brief, 'Where she starts, and her tasks').trim().split('\n'), tasks);
  for (const criterion of sectionOf(intent, 'Success criteria').trim().split('\n')) assert.ok(!brief.includes(criterion.replace(/^\d\. /, '')), 'no criterion is in the brief');
  // The grader's word is in the intent, and in no other file of the fixture.
  const { 'intent-not-opened': unopened } = graders(name);
  assert.deepEqual([unopened.data.target, unopened.data.match], ['trace', 'not_contains']);
  // And no tool that could open it, whole or in part, names it.
  for (const [grader, tool] of [['intent-not-read', 'Read'], ['intent-not-searched', 'Grep'], ['intent-not-named-in-a-command', 'Bash']]) {
    assert.deepEqual([graders(name)[grader].data.tool, graders(name)[grader].data.input_match, graders(name)[grader].data.max], [tool, '02-intent', 0], grader);
  }
  assert.ok(!inFixture(name, BRIEFS[name].brief).replace(sectionOf(inFixture(name, BRIEFS[name].brief), 'Do not open'), '').includes('02-intent'), 'the brief names the intent nowhere but under "Do not open"');
  const holds = filesUnder(fixture(name)).filter(file => !file.endsWith('.png') && inFixture(name, file).includes(unopened.body));
  assert.deepEqual(holds, [join(PKG, '02-intent.md')]);
  for (const file of ['skills/design/SKILL.md', BRIEFS[name].card, 'templates/outputs/TASK-READ.md']) assert.ok(!read(file).includes(unopened.body), `${file} does not hold it`);
  // What she is handed: her card, her profession's traits and the pictures, and they are what the brief lists.
  assert.deepEqual(validatePerson(inFixture(name, 'design/pool/persons/desk-cover.md'), { file: 'persons/desk-cover.md' }), []);
  const profile = inFixture(name, 'design/pool/profiles/front-desk-coordinator.md');
  const traits = inFixture(name, PKG, 'work/front-desk-coordinator-traits.md');
  assert.equal((profile.match(/^So the interface must:/gm) ?? []).length, 7);
  assert.ok(!traits.includes('So the interface must:'), 'the traits hold no fourth field');
  assert.equal(traits, profile.replace(/^So the interface must:[^\n]*\n\n/gm, ''), 'and are the profile with each fourth field taken out, to the next blank line');
  const pictures = pathsFrom(sectionOf(brief, 'Read, in this order'), `${PKG}/04-structure/board/`);
  assert.deepEqual(pictures, ['A', 'B'].map(letter => `${PKG}/04-structure/board/${letter}-1280-light.png`));
  assert.deepEqual(list('evals', name, 'fixture', PKG, '04-structure/board'), ['A-1280-light.png', 'B-1280-light.png'], 'pictures only');
  for (const picture of pictures) assert.equal(readFileSync(fixture(name, picture)).subarray(1, 4).toString(), 'PNG', picture);
  // The caveat the grader asks for is the card's and the template's, word for word, however the read wraps it.
  const { 'opens-with-the-caveat': caveat } = graders(name);
  const pattern = new RegExp(caveat.body, caveat.data.flags ?? '');
  const [, said] = /\n {3}> (A simulated person [^\n]+)\n/.exec(read(BRIEFS[name].card));
  assert.ok(read('templates/outputs/TASK-READ.md').startsWith(`> ${said}\n`));
  assert.match(`> ${said}\n\n# Task read · Structure\n`, pattern);
  assert.match(said.replace(/; /g, ';\n> '), pattern, 'wrapped');
  assert.doesNotMatch(`# Task read · Structure\n\n> ${said}\n`, pattern, 'it opens the read');
  assert.doesNotMatch(said.replace('agrees too easily', 'may agree'), pattern);
  // The six questions the rubric lists are the card's.
  const card = read(BRIEFS[name].card);
  for (const question of ['What do I think this is?', 'What do I do first?', 'Where do I hesitate, and at what?', 'What did I expect to happen?', 'Did I finish?', 'What would make me leave?']) {
    assert.ok(card.includes(`**${question}**`), question);
    assert.ok(graders(name).criteria.body.toLowerCase().includes(question.toLowerCase().replace(/\?$/, '')), `the rubric asks: ${question}`);
  }
});

test('profile-judge-cannot-tell: the profile marks what she uses it on as unknown, the intent is silent on it, and both options depend on it', () => {
  const name = 'profile-judge-cannot-tell';
  const profile = inFixture(name, 'design/pool/profiles/front-desk-coordinator.md');
  assert.deepEqual(h2(profile), h2(read('templates/people/PROFILE-CARD.md')));
  // One characteristic is marked unknown, the usage context, and it has no line to hold a design to.
  const evidence = Object.fromEntries(h2(profile).map(line => line.slice(3)).map(heading => [heading, /^Evidence: (\w+)$/m.exec(sectionOf(profile, heading))?.[1]]).filter(([, label]) => label));
  assert.deepEqual(evidence, { Scope: 'guess', 'The work': 'guess', 'Technological familiarity': 'guess', 'Usage context': 'unknown', 'Time and attention': 'guess', 'Error tolerance and stakes': 'guess', 'Domain vocabulary': 'guess' });
  const usage = sectionOf(profile, 'Usage context');
  assert.match(usage, /What she uses the product on is not known: a computer on the desk with a keyboard, a tablet on a stand or a phone in her hand\./);
  assert.match(usage, /^So the interface must: Not known yet\.$/m);
  // Nothing else the judge is handed settles it: the intent names no device and no width.
  const intent = inFixture(name, PKG, '02-intent.md');
  assert.doesNotMatch(intent, /1280|390|\bpx\b|computer|keyboard|tablet|desktop|laptop|monitor|mouse/i);
  assert.match(sectionOf(intent, 'Constraints that will bite'), /What the front desk uses it on is not known/);
  assert.doesNotMatch(profile.replace(usage, ''), /computer|keyboard|tablet|desktop|laptop|monitor|mouse/i, 'no other trait names a device');
  // The board: two letters, each valid, each with its page and its two pictures. One is worked by typing, one is a grid of hours.
  const board = join(PKG, '04-structure/board');
  assert.deepEqual(list('evals', name, 'fixture', board), [...['A', 'B'].flatMap(l => [`${l}-1280-light.png`, `${l}-390-light.png`, `${l}.html`, `${l}.json`]), 'kit.css'].sort());
  const options = ['A', 'B'].map(letter => JSON.parse(inFixture(name, board, `${letter}.json`)));
  for (const option of options) assert.deepEqual(validate(option, { sealed: true }), [], option.name);
  const typed = options.find(option => /keyboard/.test(option.bet));
  const grid = options.find(option => /grid of rooms against the hours/.test(option.bet));
  assert.ok(typed && grid && typed !== grid, 'one option of each kind');
  assert.match(JSON.stringify(typed), /Press Enter to book the room/);
  assert.deepEqual(typed.absent, ['A list of every room', 'Anything to point at, or to press with a finger']);
  // The brief hands the profile over once, as the first thing to read.
  assert.equal(inFixture(name, BRIEFS[name].brief).split('design/pool/profiles/front-desk-coordinator.md').length - 1, 1);
  // The point is under the heading, and no finding is filed under the check the unknown trait feeds.
  const held = graders(name);
  const holds = new RegExp(held['cannot-tell-holds-the-point'].body, held['cannot-tell-holds-the-point'].data.flags);
  assert.match('## Cannot tell\n\nFor the founder or a real professional, not for the maker.\n\n| Trait | What the design assumes about it | Where |\n|---|---|---|\n| Usage context: what she uses it on (*unknown*) | B assumes a keyboard | B · `today` |\n\n## Ranking\n', holds);
  assert.doesNotMatch('## Cannot tell\n\nNothing.\n\n## Ranking\n\nB needs a keyboard.\n', holds, 'the point under another heading');
  const filed = new RegExp(held['no-finding-under-the-context-check'].body, held['no-finding-under-the-context-check'].data.flags);
  assert.equal(held['no-finding-under-the-context-check'].data.match, 'not_contains');
  assert.match('| 3 | Context | B cannot be worked without a keyboard | B · `today` |', filed);
  assert.match('| 4 | Path / Context | The grid needs a wide screen | A |', filed);
  assert.doesNotMatch('| 3 | Path | A takes more than two presses | A |\n| Usage context: what she uses it on | B assumes a keyboard | B |', filed);
  assert.ok(flat(read(BRIEFS[name].card)).includes('6. **Context.** Is it legible and operable where, and on what, they use it? Fed by usage context.'));
  // What the rubric asks is the card's rule for a trait marked unknown.
  const card = flat(read(BRIEFS[name].card));
  assert.ok(card.includes('**What the card marks *unknown*, you cannot tell.** Where the design depends on such a trait, write no finding. Put it on the "Cannot tell" list: the trait, what the design assumes about it, and where. That list goes to the founder or to a real professional, never to the maker.'));
  assert.match(read('templates/outputs/LEDGER.md'), /^## Cannot tell$/m);
  const { 'has-a-cannot-tell-list': heading } = graders(name);
  assert.match('## Findings\n\n## Cannot tell\n\n| Trait |', new RegExp(heading.body, heading.data.flags));
});

test('cold-implementer-finds-the-gap: a handoff folder that stands alone, with one state lacking a page and one string lacking a key', () => {
  const name = 'cold-implementer-finds-the-gap';
  const folder = join(PKG, '07-handoff');
  assert.deepEqual(list('evals', name, 'fixture', PKG), ['07-handoff', 'work'], 'the folder, and the brief beside it');
  assert.deepEqual(list('evals', name, 'fixture', folder), ['ACCEPTANCE.md', 'COVERAGE.md', 'DECISIONS.md', 'HANDOFF.md', 'IMPLEMENTER-GUIDE.md', 'PARTS.md', 'SPEC.md', 'acceptance.json', 'prototype', 'strings.json', 'tokens.css'].sort());
  assert.deepEqual(alone(fixture(name, folder)).faults, []);
  for (const file of ['HANDOFF.md', 'ACCEPTANCE.md', 'COVERAGE.md', 'PARTS.md', 'DECISIONS.md']) {
    assert.deepEqual(h2(inFixture(name, folder, file)).filter(line => !/^## \d+ · /.test(line)), h2(read('templates/package/07-handoff', file)).filter(line => !/^## \d+ · /.test(line)), file);
  }
  assert.deepEqual(validateAcceptance(JSON.parse(inFixture(name, folder, 'acceptance.json'))), []);
  // The gap in the states: SPEC.md names four, each with its page, and one of those pages is not in prototype/.
  const pages = list('evals', name, 'fixture', folder, 'prototype').filter(file => file.endsWith('.html') && file !== 'index.html');
  const rows = [...sectionOf(`## today\n${inFixture(name, folder, 'SPEC.md').split('\n## today\n')[1]}`, 'today').matchAll(/^\| ([a-z-]+) \|[^\n]*\| `([\w-]+\.html)` \|$/gm)].map(([, state, page]) => [state, page]);
  assert.deepEqual(rows.map(([state]) => state), ['default', 'empty-filtered', 'success', 'error-recoverable']);
  assert.deepEqual(rows.filter(([, page]) => !pages.includes(page)), [['error-recoverable', 'today-booking-error-en.html']], 'one state has no page');
  assert.deepEqual(pages, rows.map(([, page]) => page).filter(page => pages.includes(page)).sort(), 'and no page is without its state');
  const index = inFixture(name, folder, 'prototype/index.html');
  assert.deepEqual([...index.matchAll(/href="([\w-]+\.html)"/g)].map(([, href]) => href).sort(), pages, 'the index lists the pages that are there');
  for (const page of pages) for (const width of [1280, 390]) assert.ok(existsSync(fixture(name, folder, 'prototype/shots', `${page.replace('.html', '')}-${width}-light.png`)), `${page} at ${width}`);
  // The gap in the strings: of every element a page shows words on, one says something no key of strings.json gives.
  const strings = Object.values(JSON.parse(inFixture(name, folder, 'strings.json'))).map(entry => new RegExp(`^${entry.en.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[a-z]+\}/g, '.+')}$`));
  const shown = pages.flatMap(page => [...inFixture(name, folder, 'prototype', page).matchAll(/<(\w+)[^>]*data-ux="([^"]+)"[^>]*>([^<]+)<\/\1>/g)].map(([, , id, words]) => [page, id, words.trim()]));
  assert.ok(shown.length >= 15, 'the pages show their words on elements that carry an id');
  assert.deepEqual(shown.filter(([, , words]) => !strings.some(pattern => pattern.test(words))), [['today-booked-en.html', 'undo-booking', 'Undo']], 'one string has no key');
  // The brief hands over the folder and nothing else, and the ledger goes beside it, never in it.
  const brief = inFixture(name, BRIEFS[name].brief);
  assert.deepEqual(pathsFrom(sectionOf(brief, 'Read, in this order'), 'design/'), [`${folder}/`]);
  assert.ok(sectionOf(brief, 'Do not open').includes('everything outside `design/today/07-handoff/`'));
  // What the rubric asks is the card's fourth check, and its graders name the two gaps as the folder does.
  const card = flat(read(BRIEFS[name].card));
  assert.ok(card.includes('**Every state without a page, and every string without a key.**'));
  assert.ok(card.includes('one row for each item: the check, the question or the guess, where'));
  const all = graders(name);
  assert.match('| 4 | Which page draws error-recoverable? `today-booking-error-en.html` is not in prototype/ |', new RegExp(all['names-the-state-without-a-page'].body, all['names-the-state-without-a-page'].data.flags));
  assert.match('| 4 | "Undo" on today-booked-en.html has no key |', new RegExp(all['names-the-string-without-a-key'].body, all['names-the-string-without-a-key'].data.flags));
  assert.match('the element `undo-booking` shows a string strings.json lacks', new RegExp(all['names-the-string-without-a-key'].body, all['names-the-string-without-a-key'].data.flags));
  assert.doesNotMatch('Can a booking be undone after two minutes?', new RegExp(all['names-the-string-without-a-key'].body, all['names-the-string-without-a-key'].data.flags));
});

// ---- safe to run unattended

test('no fixture holds a key, a keys file or an address on the web, and no case asks for the network, a browser or an outside model', () => {
  for (const name of NAMES) {
    const files = filesUnder(fixture(name));
    assert.ok(files.length >= 1, name);
    for (const file of files) {
      assert.doesNotMatch(file, /(?:^|\/)\.env|\.pem$|\.key$|credentials|secret/i, `${name}/${file}`);
      if (/\.png$/.test(file)) continue;
      const text = inFixture(name, file);
      // The implementer's guide is the kit's own, copied whole into a handoff folder, as Handoff copies it.
      if (file.endsWith('IMPLEMENTER-GUIDE.md')) {
        assert.equal(text, read('reference/IMPLEMENTER-GUIDE.md'), `${name}/${file}`);
        continue;
      }
      assert.doesNotMatch(text, /https?:\/\/|\bsk-[A-Za-z0-9]{8}|api[_-]?key\s*[:=]|password\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i, `${name}/${file}`);
    }
    const { data, body } = prompt(name);
    assert.ok(!data.allowed_tools.some(tool => /^(?:WebFetch|WebSearch|mcp__)/.test(tool)), `${name}: no tool reaches the network`);
    assert.doesNotMatch(body, /describe\.mjs|shots\.mjs|accept\.mjs|https?:\/\//, `${name}: the prompt asks for no browser, no outside model and no address`);
  }
});
