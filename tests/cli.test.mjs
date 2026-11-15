import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as browser from '../scripts/lib/browser.mjs';
import { HELP, UsageError, isMain, parseArgs, readTimeout } from '../scripts/lib/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cliUrl = pathToFileURL(join(here, '..', 'scripts', 'lib', 'cli.mjs')).href;
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'cli-'));
after(() => rmSync(root, { recursive: true, force: true }));

const FLAGS = { flags: ['out', 'seed'] };
const refuses = (argv, message, options = FLAGS) =>
  assert.throws(() => parseArgs(argv, options), e => e instanceof UsageError && e.message === message, `${argv.join(' ')} → ${message}`);

test('positionals and flags in any order, each flag written --flag value or --flag=value', () => {
  assert.deepEqual(parseArgs(['in', '--out', 'the board', 'more', '--seed=7'], FLAGS), {
    help: false,
    positional: ['in', 'more'],
    flags: { out: 'the board', seed: '7' },
  });
  // The value runs from the first "=" to the end; a single dash is no flag.
  assert.deepEqual(parseArgs(['--out=a=b', '-x', '-'], FLAGS), { help: false, positional: ['-x', '-'], flags: { out: 'a=b' } });
  assert.deepEqual(parseArgs([], FLAGS), { help: false, positional: [], flags: {} });
  // With no flags named, none is allowed; positionals still are.
  assert.deepEqual(parseArgs(['a', 'b']), { help: false, positional: ['a', 'b'], flags: {} });
  refuses(['a', '--out', 'b'], 'unknown flag --out', {});
  assert.throws(() => parseArgs(['--out', 'b']), e => e instanceof UsageError && e.message === 'unknown flag --out', 'no options at all');
});

test('--help or -h asks for help wherever it stands, unless a fault comes first', () => {
  assert.deepEqual(HELP, ['--help', '-h']);
  for (const argv of [['--help'], ['-h'], ['in', '--help'], ['--out', 'b', '-h'], ['--seed=1', '--help', '--colour']]) {
    assert.deepEqual(parseArgs(argv, FLAGS), { help: true }, argv.join(' '));
  }
  refuses(['--colour', 'grey', '--help'], 'unknown flag --colour');
});

test('an unknown flag, a flag given twice, a flag with no value, and a flag taken as a value are refused', () => {
  refuses(['--colour', 'grey'], 'unknown flag --colour');
  refuses(['--colour=grey'], 'unknown flag --colour');
  refuses(['--'], 'unknown flag --');
  refuses(['--out', 'a', '--out', 'b'], '--out is given twice');
  refuses(['--out=a', '--out', 'b'], '--out is given twice');
  refuses(['--out'], '--out needs a value');
  refuses(['--out='], '--out needs a value');
  refuses(['in', '--out', '--seed', '1'], '--out needs a value; "--seed" is a flag');
  refuses(['--out=--seed'], '--out needs a value; "--seed" is a flag');
  refuses(['--out', '--help'], '--out needs a value; "--help" is a flag');
  refuses(['--out', '-h'], '--out needs a value; "-h" is a flag');
  refuses(['--out', '--'], '--out needs a value; "--" is a flag');
});

test('a switch is a flag with no value: true when given, refused with a value, given twice, or not named', () => {
  const SWITCHED = { flags: ['out'], switches: ['allow-errors'] };
  assert.deepEqual(parseArgs(['in', '--allow-errors', '--out', 'b'], SWITCHED), {
    help: false,
    positional: ['in'],
    flags: { 'allow-errors': true, out: 'b' },
  });
  // A switch takes nothing after it: the next argument stays a positional.
  assert.deepEqual(parseArgs(['--allow-errors', 'in'], SWITCHED), { help: false, positional: ['in'], flags: { 'allow-errors': true } });
  assert.deepEqual(parseArgs(['in'], SWITCHED), { help: false, positional: ['in'], flags: {} });
  refuses(['--allow-errors=yes'], '--allow-errors takes no value', SWITCHED);
  refuses(['--allow-errors='], '--allow-errors takes no value', SWITCHED);
  refuses(['--allow-errors', '--allow-errors'], '--allow-errors is given twice', SWITCHED);
  refuses(['--out', '--allow-errors'], '--out needs a value; "--allow-errors" is a flag', SWITCHED);
  refuses(['--allow-errors'], 'unknown flag --allow-errors', { flags: ['out'] });
  // A flag named as a value-taking flag is not a switch.
  refuses(['--out'], '--out needs a value', SWITCHED);
});

test('isMain: true in the file node was given, even through a link; false in a file it imports, and with no file', t => {
  const dir = join(root, 'is main');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'child.mjs'), `import { isMain } from '${cliUrl}';\nconsole.log('child', isMain(import.meta.url));\n`);
  writeFileSync(join(dir, 'main.mjs'), `import { isMain } from '${cliUrl}';\nimport './child.mjs';\nconsole.log('main', isMain(import.meta.url));\n`);
  const node = (...args) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: dir });
  let r = node(join(dir, 'main.mjs'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, 'child false\nmain true\n', '']);
  // With no file at all, nothing is the main file.
  r = node('--input-type=module', '-e', `import { isMain } from '${cliUrl}'; console.log(isMain(import.meta.url), isMain('file:///nowhere.mjs'));`);
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, 'false false\n', '']);
  try {
    symlinkSync(join(dir, 'main.mjs'), join(dir, 'linked.mjs'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  r = node(join(dir, 'linked.mjs'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, 'child false\nmain true\n', '']);
});

test('readTimeout reads --timeout as a whole number of milliseconds from 1, and gives nothing when it is not there; it is command-line parsing, not the browser library', () => {
  assert.equal(readTimeout({}), undefined);
  assert.equal(readTimeout({ timeout: '1500' }), 1500);
  for (const value of ['0', '1.5', '2s', '-5', '99999999999999999999']) {
    assert.throws(() => readTimeout({ timeout: value }), e => e instanceof UsageError && e.message === `--timeout must be a whole number of milliseconds from 1, as 30000; it is "${value}"`, value);
  }
  // The longest a timer can wait, 2^31 - 1 ms: one more would fire at once.
  assert.equal(readTimeout({ timeout: '2147483647' }), 2147483647);
  for (const value of ['2147483648', '9007199254740991']) {
    assert.throws(() => readTimeout({ timeout: value }), e => e instanceof UsageError && e.message === `--timeout must be at most 2147483647 milliseconds, the longest a timer can wait; it is "${value}"`, value);
  }
  assert.ok(!('readTimeout' in browser), 'the browser library does not parse a command line');
});

// ---- the kit with no dependency installed (G5): as a stranger's machine has it, installed from a marketplace

test('with no dependency installed, every script still prints its --help, accept inpage and accept report still run, and a script that must start a browser refuses in one line that says where to run npm install', t => {
  // A copy of the scripts, the grey kit and the package file, in a folder of the system's own: no folder
  // above it holds a node_modules, as none does above an installed plugin.
  const kit = join(here, '..');
  const bare = realpathSync(mkdtempSync(join(tmpdir(), 'ux-bare-')));
  after(() => rmSync(bare, { recursive: true, force: true }));
  for (const folder of ['scripts', 'kit']) cpSync(join(kit, folder), join(bare, folder), { recursive: true });
  cpSync(join(kit, 'package.json'), join(bare, 'package.json'));
  assert.ok(!existsSync(join(bare, 'node_modules')));
  const node = (...args) => spawnSync(process.execPath, args, { cwd: bare, encoding: 'utf8', timeout: 60_000 });
  const found = node('--input-type=module', '-e', "await import('playwright-core')");
  if (found.status === 0) {
    t.skip(`a folder above ${bare} holds playwright-core: the kit cannot be tried without it here`);
    return;
  }
  assert.match(found.stderr, /ERR_MODULE_NOT_FOUND/);
  const scripts = readdirSync(join(bare, 'scripts')).filter(name => name.endsWith('.mjs')).sort();
  assert.deepEqual(scripts, ['accept.mjs', 'alone.mjs', 'card.mjs', 'deal.mjs', 'describe.mjs', 'merge.mjs', 'page.mjs', 'render.mjs', 'shots.mjs', 'state.mjs']);
  for (const script of scripts) {
    const help = node(join('scripts', script), '--help');
    assert.deepEqual([help.status, help.stderr], [0, ''], `${script} --help`);
    assert.ok(help.stdout.startsWith(`Usage: node scripts/${script}`), `${script}: ${help.stdout.slice(0, 80)}`);
  }
  // The two commands of accept that open no page.
  const inpage = node('scripts/accept.mjs', 'inpage');
  assert.deepEqual([inpage.status, inpage.stdout, inpage.stderr], [0, `${join(bare, 'scripts', 'inpage', 'accept-inpage.js')}\n`, '']);
  const results = [{ id: 'free-count-shown', pass: true, actual: { width: 390, height: 18 }, message: '', criterion: 'She sees how many rooms are free.', state: 'default', page: 'today.html', width: 390, theme: 'light' }];
  writeFileSync(join(bare, 'results.json'), JSON.stringify(results));
  const report = node('scripts/accept.mjs', 'report', 'results.json', '--out', 'checks.md');
  assert.deepEqual([report.status, report.stdout, report.stderr], [0, '1 checks: 0 failed, 1 passed; report in checks.md\n', '']);
  assert.match(readFileSync(join(bare, 'checks.md'), 'utf8'), /^\| pass \| free-count-shown \|/m);
  // The two that open one: refused before any browser is started. The Chrome named is this node, which is
  // there on every machine and is never run: the refusal comes first.
  const refusal = `playwright-core is not installed in ${bare}: run npm install there\n`;
  writeFileSync(join(bare, 'today.html'), '<!doctype html>\n<title>Today</title>\n<p data-ux="free-count">2 rooms free</p>\n');
  const shots = node('scripts/shots.mjs', 'today.html', '--out', 'shots', '--widths', '390', '--chrome', process.execPath);
  assert.deepEqual([shots.status, shots.stdout, shots.stderr], [1, '', refusal]);
  assert.deepEqual(existsSync(join(bare, 'shots')) ? readdirSync(join(bare, 'shots')) : [], [], 'no picture');
  const check = { id: 'free-count-shown', criterion: 'She sees how many rooms are free.', state: 'default', page: 'today.html', width: 390, type: 'visible', target: 'free-count' };
  writeFileSync(join(bare, 'acceptance.json'), JSON.stringify({ design: 'today', checks: [check] }));
  const prototype = node('scripts/accept.mjs', 'prototype', 'acceptance.json', '--root', '.', '--out', 'prototype-results.json', '--chrome', process.execPath);
  assert.deepEqual([prototype.status, prototype.stdout, prototype.stderr], [1, '', refusal]);
  assert.ok(!existsSync(join(bare, 'prototype-results.json')), 'no results');
  // A run that opens no page needs none: every page it names is missing, each check says so, and no browser is asked for.
  writeFileSync(join(bare, 'acceptance.json'), JSON.stringify({ design: 'today', checks: [{ ...check, page: 'tomorrow.html' }] }));
  const nothing = node('scripts/accept.mjs', 'prototype', 'acceptance.json', '--root', '.', '--out', 'prototype-results.json', '--chrome', process.execPath);
  assert.deepEqual([nothing.status, nothing.stderr], [1, 'failed: free-count-shown: cannot read the page tomorrow.html: not found\n']);
});

test('the browser library is the one file of the scripts that names playwright-core, and it loads it only where a browser is started', () => {
  const scripts = join(here, '..', 'scripts');
  const files = [...readdirSync(scripts), ...readdirSync(join(scripts, 'lib')).map(name => join('lib', name))].filter(name => name.endsWith('.mjs'));
  const naming = files.filter(name => /['"]playwright-core['"]/.test(readFileSync(join(scripts, name), 'utf8')));
  assert.deepEqual(naming, [join('lib', 'browser.mjs')]);
  const library = readFileSync(join(scripts, 'lib', 'browser.mjs'), 'utf8');
  assert.doesNotMatch(library, /^import [^\n]*playwright-core/m, 'never at the top of the file');
  assert.match(library, /await import\('playwright-core'\)/);
});
