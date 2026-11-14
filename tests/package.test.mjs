// The package walk: templates/package copied whole into a fresh folder and taken through its stages with
// the real command line of scripts/state.mjs, as a stage skill will do it.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { ARTEFACT, STAGES } from '../scripts/lib/state.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'state.mjs');
const TEMPLATES = join(here, '..', 'templates', 'package');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'package-'));
after(() => rmSync(root, { recursive: true, force: true }));

const DAY = '2026-11-14';
const WORDS = 'sí, adelante';
const ENTRY = '- source:README.md';

function copy(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) copy(join(from, entry.name), join(to, entry.name));
    else copyFileSync(join(from, entry.name), join(to, entry.name));
  }
}

const state = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
// A verb that succeeds: exit 0 and nothing on standard error. What it printed, trimmed.
function ok(...args) {
  const run = state(...args);
  assert.deepEqual([run.status, run.stderr], [0, ''], `state ${args.join(' ')}\n${run.stdout}`);
  return run.stdout.trim();
}

let made = 0;
// A package: the templates copied whole into a fresh folder, then initialised at a size.
function pkg(size) {
  const dir = join(root, `p${++made}`);
  copy(TEMPLATES, dir);
  ok('init', dir, '--design', 'today', '--kind', 'working-surface', '--foundation', 'new-surface', '--size', size, '--date', DAY);
  const file = stage => join(dir, ARTEFACT[stage]);
  return {
    dir,
    read: stage => readFileSync(file(stage), 'utf8'),
    write: (stage, text) => writeFileSync(file(stage), text),
    header: stage => parse(readFileSync(file(stage), 'utf8')).data,
    // What a stage does to its template before the gate, and no more: it names what the output is built
    // from, and adds entries to the carry list where the output has one.
    fill(stage, inputs, entries = [ENTRY]) {
      const text = readFileSync(file(stage), 'utf8');
      assert.equal(text.split('built-from: []').length, 2, `${ARTEFACT[stage]} has the header the template gave it`);
      const carried = /^## Carry$/m.test(text);
      writeFileSync(file(stage), text.replace('built-from: []', `built-from: [${inputs.join(', ')}]`) + (carried ? `\n${entries.join('\n')}\n` : ''));
      return carried;
    },
    stamp: stage => state('stamp', dir, stage, '--words', WORDS, '--date', DAY),
  };
}

test('a surface is stamped from frame to handoff on the templates as they are, with one carry entry each', () => {
  const p = pkg('surface');
  const stages = STAGES.slice(0, STAGES.indexOf('handoff') + 1);
  const carried = [];
  stages.forEach((stage, i) => {
    if (p.fill(stage, i === 0 ? [] : [`${stages[i - 1]}@1`])) carried.push(stage);
    const run = p.stamp(stage);
    assert.deepEqual([run.status, run.stderr], [0, ''], `stamp ${stage}`);
    assert.equal(run.stdout.trim(), `stamped ${stage} approved at version 1 on ${DAY}`);
  });
  // Every output from frame to look has a carry list; the handoff, which stands alone, has none.
  assert.deepEqual(carried, stages.slice(0, -1));
  assert.equal(ok('validate', p.dir), 'ok');
  assert.equal(ok('next', p.dir), 'acceptance');
  for (const stage of stages) {
    assert.deepEqual(p.header(stage), { stage, version: 1, status: 'approved', approved: DAY, words: WORDS, 'built-from': stage === 'frame' ? [] : [`${stages[stages.indexOf(stage) - 1]}@1`] });
  }
});

test('the whole loop runs on the templates: begin, await and stamp for every stage, the acceptance report last', () => {
  const p = pkg('surface');
  STAGES.forEach((stage, i) => {
    assert.equal(ok('begin', p.dir, stage, '--date', DAY), `${stage} is in work`);
    p.fill(stage, i === 0 ? [] : [`${STAGES[i - 1]}@1`]);
    assert.equal(ok('await', p.dir, stage, '--question', `Is ${stage} right?`, '--date', DAY), `${stage} awaits the founder`);
    assert.equal(p.header(stage).status, 'awaiting');
    assert.equal(ok('stamp', p.dir, stage, '--words', WORDS, '--date', DAY), `stamped ${stage} approved at version 1 on ${DAY}`);
  });
  assert.equal(ok('validate', p.dir), 'ok');
  assert.equal(ok('next', p.dir), 'none');
  const page = ok('status', p.dir);
  for (const stage of STAGES) assert.match(page, new RegExp(`^\\| ${stage} \\| full \\| approved \\| 1 \\|.*\`${ARTEFACT[stage].replace(/[.]/g, '\\.')}\``, 'm'));
  assert.match(page, /## Open question\n\nNone\./);
});

test('a correction skips to detail, handoff and acceptance, each built from the stage before it on its route', () => {
  const p = pkg('correction');
  const route = ['frame', 'detail', 'handoff', 'acceptance'];
  route.forEach((stage, i) => {
    p.fill(stage, i === 0 ? [] : [`${route[i - 1]}@1`]);
    assert.equal(ok('stamp', p.dir, stage, '--words', WORDS, '--date', DAY), `stamped ${stage} approved at version 1 on ${DAY}`);
  });
  assert.equal(ok('validate', p.dir), 'ok');
  assert.equal(ok('next', p.dir), 'none');
  // A stage the route skips is not worked on, though its template was copied with the rest.
  const run = p.stamp('structure');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /structure is skipped on this route/);
  assert.ok(existsSync(join(p.dir, ARTEFACT.structure)));
});

test('the frame template is stamped untouched, and an instruction moved under "## Carry" is refused', () => {
  const p = pkg('surface');
  // Frame is built from nothing, and a carry list may be empty.
  assert.equal(ok('stamp', p.dir, 'frame', '--words', WORDS, '--date', DAY), `stamped frame approved at version 1 on ${DAY}`);
  // The reader passes over nothing below the heading: the template keeps its instruction above it.
  const text = p.read('context');
  const from = text.lastIndexOf('<!--');
  const to = text.indexOf('-->', from) + 3;
  assert.ok(from !== -1 && to < text.lastIndexOf('\n## Carry\n'), 'the instruction is a comment above the heading');
  const comment = text.slice(from, to);
  p.write('context', `${text.slice(0, from)}${text.slice(to)}\n${comment}\n`.replace('built-from: []', 'built-from: [frame@1]'));
  const refused = p.stamp('context');
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /is not a carry entry/);
  // Put back above the heading, the same file is stamped.
  p.write('context', text.replace('built-from: []', 'built-from: [frame@1]'));
  assert.equal(ok('stamp', p.dir, 'context', '--words', WORDS, '--date', DAY), `stamped context approved at version 1 on ${DAY}`);
  assert.equal(ok('validate', p.dir), 'ok');
});

// The headings of a template that a later stage carries, each as `state slug` names it.
const slugOf = heading => ok('slug', heading);

test('a section of one template can be carried by the next, under the slug of its heading', () => {
  const p = pkg('surface');
  p.fill('frame', []);
  assert.equal(p.stamp('frame').status, 0);
  p.fill('context', ['frame@1'], ['- source:design/PROFILE.md', `- frame@1#${slugOf('The request')}`]);
  assert.equal(p.stamp('context').status, 0, 'context carries the request');
  // Intent carries the inventory and the founder's words from the context, and may still name the frame.
  const carried = ['What the product can show and do', 'The founder\'s own words', 'Project sources'];
  p.fill('intent', ['context@1', 'frame@1'], [...carried.map(heading => `- context@1#${slugOf(heading)}`), `- frame@1#${slugOf('Kind, foundation, size')}`]);
  const run = p.stamp('intent');
  assert.deepEqual([run.status, run.stderr], [0, '']);
  // A heading the template does not have is refused, so the slugs above were read against the files.
  p.fill('cast', ['intent@1'], [`- intent@1#${slugOf('The states')}`]);
  const refused = p.stamp('cast');
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /has no heading whose slug is "the-states"/);
  assert.equal(ok('validate', p.dir), 'ok');
});
