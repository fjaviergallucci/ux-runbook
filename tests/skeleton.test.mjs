import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('plugin manifest names the plugin ux', () => {
  const m = read('.claude-plugin/plugin.json');
  assert.equal(m.name, 'ux');
  assert.match(m.version, /^2\./);
  assert.ok(m.description.length > 20);
});

test('marketplace lists ux from the repository root', () => {
  const m = read('.claude-plugin/marketplace.json');
  assert.equal(m.name, 'ux-runbook');
  assert.deepEqual(m.plugins.map(p => [p.name, p.source]), [['ux', './']]);
});

test('package runs on node 20 with one dependency', () => {
  const p = read('package.json');
  assert.equal(p.type, 'module');
  assert.equal(p.engines.node, '>=20.10');
  assert.deepEqual(Object.keys(p.dependencies), ['playwright-core']);
  assert.ok(!('devDependencies' in p), 'package.json has no devDependencies');
  assert.equal(p.scripts.test, 'node --test --test-concurrency=1 tests/*.test.mjs');
});

test('marketplace entry carries the plugin manifest version and description', () => {
  const plugin = read('.claude-plugin/plugin.json');
  const [entry] = read('.claude-plugin/marketplace.json').plugins;
  assert.equal(entry.version, plugin.version);
  assert.equal(entry.description, plugin.description);
});

test('neither manifest carries an email', () => {
  for (const p of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
    const text = readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
    assert.ok(!text.includes('@'), `${p} contains an @`);
  }
});

// ---- the two pages someone reads before anything else: README.md and the kit's own LESSONS.md

const text = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const here = p => existsSync(new URL(`../${p}`, import.meta.url));
const names = p => readdirSync(new URL(`../${p}`, import.meta.url)).filter(name => !name.startsWith('.'));
const cells = line => line.split('|').slice(1, -1).map(cell => cell.trim());
const rowsOf = (page, heading) => {
  const lines = page.split('\n');
  const from = lines.indexOf(`## ${heading}`);
  assert.notEqual(from, -1, `## ${heading}`);
  const to = lines.findIndex((line, i) => i > from && /^## /.test(line));
  return lines.slice(from + 1, to === -1 ? undefined : to).filter(line => line.startsWith('|')).map(cells).slice(2);
};

test('README: the install and start lines name the plugin and its marketplace as the manifests do', () => {
  const readme = text('README.md');
  const plugin = read('.claude-plugin/plugin.json').name;
  const marketplace = read('.claude-plugin/marketplace.json').name;
  assert.ok(readme.includes('\n/plugin marketplace add <path or repo>\n'));
  assert.ok(readme.includes(`\n/plugin install ${plugin}@${marketplace}\n`));
  assert.ok(readme.includes('\nnpm install\n'));
  assert.ok(readme.includes(`\n/${plugin}:design\n`));
  assert.ok(here('skills/design/SKILL.md'), 'the skill it starts with');
  assert.ok(readme.includes(`Node ${read('package.json').engines.node.replace('>=', '')} or later`));
});

test("README: its nine stages are the conductor's, each with its question and what it leaves", () => {
  const conductor = rowsOf(text('skills/design/SKILL.md'), 'The order').filter(row => /^\d$/.test(row[0]));
  const stages = rowsOf(text('README.md'), 'The nine stages');
  assert.equal(stages.length, 9);
  assert.deepEqual(stages.map(([n, stage, question, output]) => [n, stage, question, output]), conductor.map(([n, stage, , question, output]) => [n, stage, question, output]));
  for (const [, stage] of stages) assert.ok(here(`skills/${stage.toLowerCase()}/SKILL.md`), stage);
});

test('README: what it says is in the repository is there, and its counts are counted', () => {
  const readme = text('README.md');
  const paths = rowsOf(readme, 'What is in the repository').map(([path]) => path.replace(/`/g, ''));
  assert.deepEqual(paths, ['.claude-plugin/', 'skills/', 'pool/', 'templates/', 'kit/', 'scripts/', 'reference/', 'evals/', 'tests/', 'LESSONS.md', 'docs/']);
  for (const path of paths) assert.ok(here(path), path);
  for (const [, file] of readme.matchAll(/`((?:reference|pool|skills|templates|scripts|kit)\/[\w./-]+)`/g)) assert.ok(here(file), file);
  const count = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const cards = folder => names(`pool/${folder}`).filter(name => name.endsWith('.md')).length;
  assert.ok(readme.includes(`| ${count[names('skills').length][0].toUpperCase()}${count[names('skills').length].slice(1)} skills. `), 'the skills');
  assert.ok(readme.includes(`${count[cards('makers')]} makers, ${count[cards('judges')]} judges, ${count[cards('audiences')]} audience, and ${count[cards('persons')]} people with no profession`), 'the pool');
  assert.ok(readme.includes(`| ${count[names('evals').filter(name => name !== 'results').length][0].toUpperCase()}${count[names('evals').filter(name => name !== 'results').length].slice(1)} cases `), 'the cases');
  // What it does not do by itself, and when not to use it.
  assert.ok(readme.includes('`claude plugin eval . --no-publish --ablation none --runs 1 --allow-tools Bash Write Edit`'), 'the run, as one command');
  assert.ok(readme.includes('`--no-publish` keeps its report on the machine'));
  assert.match(text('.gitignore'), /^evals\/results\/$/m);
  for (const said of ['**Its scripts send nothing off the machine by themselves.**', 'which talks to its model as any session does', '`evals/results/`, which git ignores', '`engines-on`', '**It never handles a key.**', 'A design package is a folder in your project', '## When not to use it', '**Backend or infrastructure work.** This kit is about screens.']) assert.ok(readme.includes(said), said);
  assert.match(readme, /## Version 1\n\n[^\n]*\n[^\n]*lives at the tag `version-1`\./);
});

test("LESSONS.md: appended and never rewritten, one dated entry for each lesson, each in the three parts of a project's entry", () => {
  const lessons = text('LESSONS.md');
  const [head, ...entries] = lessons.split(/\n(?=## )/);
  assert.ok(head.startsWith('# Lessons · the kit\n\nAppended, never rewritten'));
  for (const said of ['One dated entry for each lesson', 'only what is true of the process on any project', 'nothing of one product, one person or one profession', '`skills/design/references/lessons.md`']) assert.ok(head.replace(/\s+/g, ' ').includes(said), said);
  // The shape a project's entry has, less what belongs to one design.
  const shape = text('templates/project/LESSONS.md');
  const LABELS = ['**What was tried.**', '**What happened.**', '**What the next design does differently.**'];
  for (const label of LABELS) assert.ok(shape.includes(label), label);
  // The seed: what the two source processes had learned, as the plan lists it.
  const SEED = [/brief that prescribes the design returns the session's own idea/, /Nothing is shortlisted, detailed or drawn before the founder marks/, /His own sentences are the calibration for words/,
    /A number named to him is counted by a tool first/, /one idea in three palettes are not a choice/, /adjectives goes many rounds; one given in references and refused tells converges/,
    /A simulated reader agrees too easily: only the ranking carries information/, /Safe briefs and judges who reward reduction make work cleaner and emptier/, /One artefact for each review, and one question/,
    /A stage skipped is the founder's decision, and it is logged/, /Record whose proposals are picked, and let that decide which seats stay/];
  // What the pipeline learned itself is appended after the seed. M3 of the fix review: the seeded entry on his sentences
  // said he is asked "when the words will matter", the rule R164 replaced; it is answered by a later entry, never rewritten.
  const LEARNED = [/His words are asked for once, at every design/];
  const TITLES = [...SEED, ...LEARNED];
  assert.equal(entries.length, TITLES.length);
  for (const [i, entry] of entries.entries()) {
    const [title, ...paragraphs] = entry.trim().split('\n\n');
    assert.match(title, /^## \d{4}-\d\d-\d\d · \S/, title);
    assert.match(title, TITLES[i], title);
    assert.deepEqual(paragraphs.map(paragraph => /^\*\*[^*]+\*\*/.exec(paragraph)?.[0]), LABELS, title);
  }
  assert.ok(head.replace(/\s+/g, ' ').includes(`The first eleven entries of 2026-11-15 are the seed`) && SEED.length === 11);
  const seeded = entries[2].replace(/\s+/g, ' ');
  assert.ok(seeded.includes('When the words will matter, he is asked for one or two sentences as he would say them'), 'the seeded entry stands as it was written');
  const answer = entries.at(-1).replace(/\s+/g, ' ');
  for (const said of ['The entry above on his own sentences', 'His words are asked for once, at every design', '"None" is an answer', 'that part of the earlier entry stands']) assert.ok(answer.includes(said), said);
  assert.doesNotMatch(lessons, /clinic|radiolog|surgeon|physician|doctor|nurse|lawyer|teacher/i, 'no profession is named');
});
