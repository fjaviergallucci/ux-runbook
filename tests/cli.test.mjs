import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELP, UsageError, isMain, parseArgs } from '../scripts/lib/cli.mjs';

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
