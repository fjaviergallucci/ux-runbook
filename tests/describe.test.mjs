import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { DEFAULT_TIMEOUT, DescribeError, baseOf, describe } from '../scripts/describe.mjs';
import { UsageError } from '../scripts/lib/cli.mjs';
import { validate } from '../scripts/lib/walkthrough.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'describe.mjs');
const FIXTURES = join(here, 'fixtures', 'proposals');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'describe-'));
after(() => rmSync(root, { recursive: true, force: true }));

// Every key here is made up by this file, and no run ever sees a key of this machine: describe() is always
// handed an environment the test made, and every child gets this process's environment without the two
// names, then the made-up key where the test wants one. Every assertion about a key compares, and prints
// only true or false.
const KEY = 'test-key-0000-not-real';
const OTHER_KEY = 'test-key-1111-not-real';
const NAMES = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
const MADE_UP = Object.freeze({ OPENAI_API_KEY: KEY, GEMINI_API_KEY: KEY });
// What a careless reader would change in a brief: white space at either end, line ends, accents, an emoji,
// trailing spaces.
const BRIEF = '\n# Structure brief\r\n\r\nThe rooms screen — Sala Jardín 🌿, "free now" first.   \r\nAnswer with one proposal.\n\n  ';
const ON = 'engines-on: [model:openai, model:gemini]';

let made = 0;
// A fresh folder for one run, in a path with a space.
const fresh = () => {
  const dir = join(root, `run ${++made}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};
const writeProfile = (dir, lines = [ON]) => {
  const file = join(dir, 'PROFILE.md');
  writeFileSync(file, ['---', ...lines, '---', '', '# Project profile', ''].join('\n'));
  return file;
};
const keysLine = path => `keys-file: "${path}"`;
// A dotenv file made up by the test, never named like a credentials file.
const writeKeys = (dir, lines, eol = '\n') => {
  const file = join(dir, 'made-up', 'fake-dotenv.txt');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, lines.join(eol) + eol);
  return file;
};
const fixture = name => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));
const fenced = value => `Here is my proposal.\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\nIt puts what is free first.`;
// The proposal as the script writes it: what the answer said, its engine and model set by the script.
const written = (value, provider = 'openai', model = 'test-model') => `${JSON.stringify({ ...value, engine: `model:${provider}`, model }, null, 2)}\n`;
const rawOf = out => `${out}.raw.txt`;
const resultLine = (provider, model, chars) => new RegExp(`^${provider} ${model}: ${chars} characters in \\d+\\.\\d s\\n$`);

// A provider played by a server on this machine: it records each request and answers with `answer`. Closed
// with its sockets destroyed, so that a request left hanging cannot hold the suite.
async function serve(answer) {
  const requests = [];
  const sockets = new Set();
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const seen = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString('utf8') };
      requests.push(seen);
      answer(seen, res);
    });
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const close = () =>
    new Promise(resolve => {
      for (const socket of sockets) socket.destroy();
      server.close(() => resolve());
    });
  return { endpoint: `http://127.0.0.1:${server.address().port}`, requests, close };
}
const open = async (t, answer) => {
  const server = await serve(answer);
  t.after(server.close);
  return server;
};
const reply =
  (status, body, headers = { 'content-type': 'application/json' }) =>
  (seen, res) => {
    res.writeHead(status, headers);
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
const openaiSays = text => reply(200, { id: 'chat-1', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }] });
const geminiSays = (...texts) => reply(200, { candidates: [{ content: { role: 'model', parts: texts.map(text => ({ text })) }, finishReason: 'STOP' }] });
const never = () => {};
// The header the key travels in, as the server saw it.
const sentKey = seen => seen.headers.authorization ?? seen.headers['x-goog-api-key'];

// A run's folder, brief, profile and provider. `brief: null` writes no brief.
async function setup(t, answer, { profile = [ON], brief = BRIEF } = {}) {
  const dir = fresh();
  const server = await open(t, answer);
  const briefPath = join(dir, 'BRIEF.md');
  if (brief !== null) writeFileSync(briefPath, brief);
  return { dir, server, endpoint: server.endpoint, briefPath, profilePath: writeProfile(dir, profile), outPath: join(dir, 'proposals', 'model openai.json') };
}

// describe() in this process, always with an environment the test made, never this process's own.
function call(s, over = {}) {
  const env = Object.hasOwn(over, 'env') ? over.env : MADE_UP;
  assert.ok(env && env !== process.env, 'a test hands describe() an environment of its own');
  return describe({ provider: 'openai', model: 'test-model', briefPath: s.briefPath, outPath: s.outPath, profilePath: s.profilePath, endpoint: s.endpoint, timeoutMs: 10_000, ...over, env });
}
async function refusal(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  assert.fail('the run was not refused');
}
// An environment that holds nothing and records every name looked up in it.
const watched = () => {
  const looked = [];
  const note = (_, name) => {
    looked.push(String(name));
    return undefined;
  };
  return { looked, env: new Proxy({}, { get: note, has: note, getOwnPropertyDescriptor: note }) };
};
// Nothing of the key, in any form inspect shows: message, stack, own properties, cause.
const holdsKey = e => inspect(e, { showHidden: true, depth: Infinity }).includes(KEY);
// A FUSE mount (this checkout's NTFS one) keeps a file removed while some process holds it open for a moment
// as .fuse_hidden…: no file a run made, so a listing of what a run left passes over it.
const MOUNT_LEFTOVER = /^\.fuse_hidden/;
const filesIn = dir => (existsSync(dir) ? readdirSync(dir).filter(name => !MOUNT_LEFTOVER.test(name)).sort() : []);
// Whether any file anywhere under the folder holds one of the texts. Every file is read, a mount's leftover
// too; only a leftover already gone by the time it is read is passed over.
const anyFileHolds = (dir, ...texts) =>
  readdirSync(dir, { recursive: true }).some(name => {
    const path = join(dir, String(name));
    let content;
    try {
      if (!statSync(path).isFile()) return false;
      content = readFileSync(path, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT' && MOUNT_LEFTOVER.test(basename(String(name)))) return false;
      throw e;
    }
    return texts.some(text => content.includes(text));
  });
// What the command says when an answer holds the key, and nothing of it is saved.
const HELD = 'the answer held the key, so nothing of it was saved: no proposal and no raw file\n';

// The command, started without waiting (the provider is a server in this process). Its environment is this
// process's without the two key names, then the test's own.
const childEnv = extra => {
  const env = { ...process.env };
  for (const name of NAMES) delete env[name];
  return { ...env, ...extra };
};
const spawnRun = (args, { env = MADE_UP, cwd = root, preload } = {}) =>
  new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [...(preload ? ['--require', preload] : []), cli, ...args], { cwd, env: childEnv(env) });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('close', status => resolve({ status, stdout, stderr, ms: Date.now() - started }));
  });
// In no run does the key reach standard output or error.
async function run(args, options) {
  const result = await spawnRun(args, options);
  assert.equal(result.stdout.includes(KEY) || result.stderr.includes(KEY), false, 'the made-up key reached standard output or error');
  return result;
}
const flagsOf = (s, over = {}) => {
  const flags = { provider: 'openai', model: 'test-model', brief: s.briefPath, out: s.outPath, profile: s.profilePath, endpoint: s.endpoint, timeout: '10000', ...over };
  return Object.entries(flags).flatMap(([name, value]) => (value === null ? [] : [`--${name}`, value]));
};

// --- The tests' own helpers -------------------------------------------------------------------------

test('a listing of what a run left passes over a mount’s hidden leftover, and over nothing else', () => {
  const dir = fresh();
  writeFileSync(join(dir, '.fuse_hidden0001'), 'a file the mount keeps for a moment');
  assert.deepEqual(filesIn(dir), [], 'a folder holding only a leftover is empty');
  writeFileSync(join(dir, 'model openai.json'), '{}');
  writeFileSync(join(dir, 'a.fuse_hidden0002'), 'not a leftover: the name only holds the word');
  assert.deepEqual(filesIn(dir), ['a.fuse_hidden0002', 'model openai.json'], 'a folder holding more is not');
  // The check for the key still reads a leftover.
  writeFileSync(join(dir, '.fuse_hidden0001'), `a leftover that held ${KEY}`);
  assert.equal(anyFileHolds(dir, KEY), true, 'a leftover holding the key is found');
});

// --- The brief's seven -------------------------------------------------------------------------------

test('an openai answer in one fenced json block is unfenced, checked and written with its engine and model', async t => {
  const proposal = fixture('calendar.json');
  const answer = fenced(proposal);
  const s = await setup(t, openaiSays(answer));
  const result = await call(s);
  assert.equal(result.ok, true);
  assert.equal(result.heldKey, false);
  assert.equal(result.chars, answer.length);
  assert.equal(typeof result.seconds, 'number');
  assert.deepEqual(result.errors, []);
  assert.equal(readFileSync(s.outPath, 'utf8'), written(proposal));
  assert.equal(existsSync(rawOf(s.outPath)), false);
  // The request is the brief's exactly: one POST to the chat address, JSON, the key in its header only.
  assert.equal(s.server.requests.length, 1);
  const [seen] = s.server.requests;
  assert.equal(seen.method, 'POST');
  assert.equal(seen.url, '/v1/chat/completions');
  assert.equal(seen.headers['content-type'], 'application/json');
  assert.equal(seen.headers.authorization === `Bearer ${KEY}`, true, 'the key is sent as a bearer token');
  assert.equal('x-goog-api-key' in seen.headers, false);
  assert.deepEqual(JSON.parse(seen.body), { model: 'test-model', messages: [{ role: 'user', content: BRIEF }] });
  assert.equal(seen.url.includes(KEY) || seen.body.includes(KEY), false, 'the key is in neither the address nor the body');
});

test('a prose answer is kept in <out>.raw.txt, no proposal is written, and the run is not ok', async t => {
  const prose = 'I would put the free rooms first, then the ones that free up soon, then the rest.';
  const s = await setup(t, openaiSays(prose));
  const result = await call(s);
  assert.equal(result.ok, false);
  assert.equal(result.chars, prose.length);
  assert.equal(readFileSync(rawOf(s.outPath), 'utf8'), prose);
  assert.equal(existsSync(s.outPath), false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /no JSON object/);
});

test('a 401 whose body holds sk-secret shows 401 and nothing of the body', async t => {
  const s = await setup(t, reply(401, { error: { message: 'Incorrect API key provided: sk-secret****1234.', type: 'invalid_request_error' } }));
  const r = await run(flagsOf(s));
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, 'openai answered 401: the key was refused\n');
  assert.equal(`${r.stdout}${r.stderr}`.includes('sk-secret'), false);
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

test('the key reaches standard output or error in no run, whatever the provider does', async t => {
  let answer;
  const s = await setup(t, (seen, res) => answer(seen, res));
  const echo = seen => `You sent ${sentKey(seen)}; ${KEY}.`;
  const runs = {
    'a valid answer': openaiSays(fenced(fixture('calendar.json'))),
    'an answer that echoes the key': (seen, res) => openaiSays(echo(seen))(seen, res),
    'an error body that echoes the key': (seen, res) => reply(500, echo(seen), { 'content-type': 'text/plain' })(seen, res),
    'a 200 that is not JSON and echoes the key': (seen, res) => reply(200, echo(seen), { 'content-type': 'text/plain' })(seen, res),
  };
  for (const [what, responder] of Object.entries(runs)) {
    answer = responder;
    for (const provider of ['openai', 'gemini']) {
      const r = await run(flagsOf(s, { provider }));
      assert.notEqual(r.status, null, `${what}, ${provider}: the run ends`);
    }
  }
  assert.equal(s.server.requests.length, 8);
  assert.equal(s.server.requests.every(seen => sentKey(seen)?.includes(KEY)), true, 'every request carried the made-up key');
});

test('a gemini request carries the key in its header and none in its address, and its answer joins its parts', async t => {
  const proposal = fixture('free-first.json');
  const text = fenced(proposal);
  const half = Math.floor(text.length / 2);
  const s = await setup(t, geminiSays(text.slice(0, half), text.slice(half)));
  const result = await call(s, { provider: 'gemini', model: 'gemini-test.1_b' });
  assert.equal(result.ok, true);
  assert.equal(result.chars, text.length);
  assert.equal(readFileSync(s.outPath, 'utf8'), written(proposal, 'gemini', 'gemini-test.1_b'));
  const [seen] = s.server.requests;
  assert.equal(seen.method, 'POST');
  assert.equal(seen.url, '/v1beta/models/gemini-test.1_b:generateContent');
  assert.equal(seen.url.includes('key=') || seen.url.includes('?') || seen.url.includes(KEY), false, 'the address holds no key');
  assert.equal(seen.headers['x-goog-api-key'] === KEY, true, 'the key is in the x-goog-api-key header');
  assert.equal('authorization' in seen.headers, false);
  assert.equal(seen.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(seen.body), { contents: [{ parts: [{ text: BRIEF }] }] });
});

test('with no key anywhere the run stops naming the variable, before any request', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  for (const [provider, name] of [['openai', 'OPENAI_API_KEY'], ['gemini', 'GEMINI_API_KEY']]) {
    const r = await run(flagsOf(s, { provider }), { env: {} });
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.equal(
      r.stderr,
      `no key for ${provider}: set ${name} in the environment, or write the line ${name}=<the key> in the file the profile's keys-file names (the profile names none)\n`,
    );
  }
  assert.equal(s.server.requests.length, 0);
});

// Each test of the timeout has one of its own, so that a script that never stops fails the test, not the suite.
const BOUNDED = { timeout: 15_000 };

test('a request that never answers ends at the timeout, and its process with it', BOUNDED, async t => {
  const s = await setup(t, never);
  const r = await run(flagsOf(s, { timeout: '500' }));
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, 'openai: no answer within 0.5 s\n');
  assert.ok(r.ms < 500 + 2000, `the run ended after ${r.ms} ms`);
  assert.equal(s.server.requests.length, 1);
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

// --- 6. Off unless the profile turns it on -----------------------------------------------------------

test('an outside engine is off unless the profile’s engines-on list holds it; no key is looked up and nothing is sent', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const missingKeys = join(s.dir, 'no-such-dotenv.txt');
  const profiles = {
    'no engines-on': [],
    'another engine on': ['engines-on: [model:gemini]'],
    'the engine written as text, not as a list': ['engines-on: model:openai'],
    'an empty list': ['engines-on: []'],
    'near names only': ['engines-on: [openai, model:openai-x, model:OpenAI]'],
  };
  for (const [what, lines] of Object.entries(profiles)) {
    const profilePath = writeProfile(fresh(), [...lines, keysLine(missingKeys)]);
    const { env, looked } = watched();
    const e = await refusal(call({ ...s, profilePath }, { env }));
    assert.ok(e instanceof DescribeError, what);
    assert.equal(
      e.message,
      `the profile ${profilePath} does not turn model:openai on. An outside model is sent the brief, so it stays off until the profile turns it on: add model:openai to its engines-on list, as engines-on: [model:openai]`,
      what,
    );
    assert.deepEqual(looked, [], `${what}: no key is looked up`);
  }
  assert.equal(s.server.requests.length, 0);
  // The command says so, exit 1.
  const r = await run(flagsOf({ ...s, profilePath: writeProfile(fresh(), ['engines-on: [model:openai]']) }, { provider: 'gemini' }));
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /does not turn model:gemini on\..* engines-on: \[model:gemini\]\n$/);
  assert.equal(s.server.requests.length, 0);
  // Turned on, the same run goes ahead.
  const result = await call({ ...s, profilePath: writeProfile(fresh(), ['engines-on: [model:openai]']) });
  assert.equal(result.ok, true);
});

test('a profile that cannot be read or parsed, or names a keys-file that is not a path, is a refusal naming it', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const missing = join(dir, 'NO-PROFILE.md');
  const broken = join(dir, 'BROKEN.md');
  writeFileSync(broken, `---\n${ON}\n\n# never closed\n`);
  const nested = join(dir, 'NESTED.md');
  writeFileSync(nested, `---\n${ON}\nkeys-file:\n  path: x\n---\n`);
  const cases = {
    [missing]: `cannot read the profile ${missing}: not found`,
    [dir]: `cannot read the profile ${dir}: it is a folder, not a file`,
    [broken]: `cannot read the profile ${broken}: line 1: the frontmatter opened here is never closed by a "---" line`,
    [nested]: `cannot read the profile ${nested}: line 3: "keys-file" has a nested value below it; frontmatter is flat, so write the value on this line (lists inline as [a, b])`,
    [writeProfile(fresh(), [ON, 'keys-file: [a, b]'])]: 'keys-file must be the path of one file',
    [writeProfile(fresh(), [ON, 'keys-file: 12'])]: 'keys-file must be the path of one file',
  };
  for (const [profilePath, message] of Object.entries(cases)) {
    const { env, looked } = watched();
    const e = await refusal(call({ ...s, profilePath }, { env }));
    assert.ok(e instanceof DescribeError, profilePath);
    if (message.startsWith('cannot')) assert.equal(e.message, message);
    else assert.equal(e.message, `cannot read the profile ${profilePath}: ${message}`);
    assert.deepEqual(looked, []);
  }
  assert.equal(s.server.requests.length, 0);
});

// --- 7. The key, found by name inside the script -----------------------------------------------------

test('the key is taken from the environment first, and the keys file is then never opened', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const keys = writeKeys(dir, [`OPENAI_API_KEY=${OTHER_KEY}`]);
  const result = await call({ ...s, profilePath: writeProfile(dir, [ON, keysLine(keys)]) }, { env: { OPENAI_API_KEY: KEY } });
  assert.equal(result.ok, true);
  // A keys file that cannot be read is no matter while the environment holds the key.
  const elsewhere = fresh();
  const again = await call({ ...s, profilePath: writeProfile(elsewhere, [ON, keysLine(join(elsewhere, 'missing.txt'))]) }, { env: { OPENAI_API_KEY: KEY } });
  assert.equal(again.ok, true);
  assert.equal(s.server.requests.length, 2);
  assert.equal(s.server.requests.every(seen => seen.headers.authorization === `Bearer ${KEY}`), true, 'the environment’s key was sent');
});

test('an empty environment variable is unset, and the key comes from the keys file', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const keys = writeKeys(dir, [`OPENAI_API_KEY=${KEY}`]);
  const result = await call({ ...s, profilePath: writeProfile(dir, [ON, keysLine(keys)]) }, { env: { OPENAI_API_KEY: '' } });
  assert.equal(result.ok, true);
  assert.equal(s.server.requests[0].headers.authorization === `Bearer ${KEY}`, true, 'the file’s key was sent');
});

test('the keys file is found at an absolute path, beside the profile, or under ~/', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  // Beside the profile: a relative path is read from the profile's folder, not from where the run starts.
  const project = join(fresh(), 'project');
  mkdirSync(project, { recursive: true });
  writeKeys(project, [`OPENAI_API_KEY=${KEY}`]);
  const beside = await call({ ...s, profilePath: writeProfile(project, [ON, 'keys-file: made-up/fake-dotenv.txt']) }, { env: {} });
  assert.equal(beside.ok, true);
  // Under ~/: the home folder, here one the test makes and hands the child as HOME.
  const home = fresh();
  writeKeys(home, [`OPENAI_API_KEY=${KEY}`]);
  const profilePath = writeProfile(fresh(), [ON, 'keys-file: ~/made-up/fake-dotenv.txt']);
  const r = await run(flagsOf({ ...s, profilePath }), { env: { HOME: home, USERPROFILE: home } });
  assert.equal(r.status, 0);
  assert.equal(s.server.requests.length, 2);
  assert.equal(s.server.requests.every(seen => seen.headers.authorization === `Bearer ${KEY}`), true, 'the file’s key was sent');
});

// Lines a dotenv file may hold that are not the one exact line: none is taken, and none of their text is
// seen anywhere.
const NOISE = [
  '# OPENAI_API_KEY=noise-0001-a-comment',
  'GEMINI_API_KEY=noise-0002-another-name',
  'OPENAI_API_KEY =noise-0003-a-space-before',
  ' OPENAI_API_KEY=noise-0004-indented',
  'OPENAI_API_KEYS=noise-0005-a-longer-name',
  'MY_OPENAI_API_KEY=noise-0006-a-prefix',
  'export  OPENAI_API_KEY=noise-0007-two-spaces',
  'noise-0008 a line with no name at all',
];
const holdsNoise = text => text.includes('noise-000');

test('from the keys file only the one exact line is taken, its quotes stripped, and no other text is kept', async t => {
  const s = await setup(t, (seen, res) => openaiSays(`You sent ${sentKey(seen)}.`)(seen, res));
  const dir = fresh();
  const keys = writeKeys(dir, [...NOISE.slice(0, 4), `export OPENAI_API_KEY="${KEY}"`, ...NOISE.slice(4)], '\r\n');
  const r = await run(flagsOf({ ...s, profilePath: writeProfile(dir, [ON, keysLine(keys)]) }), { env: {} });
  assert.equal(s.server.requests[0].headers.authorization === `Bearer ${KEY}`, true, 'the exact line’s key was sent');
  // The echo holds the key the file gave: nothing of it is kept, and the file's other text is nowhere.
  assert.equal(r.status, 1);
  assert.equal(r.stderr, HELD);
  assert.equal(existsSync(rawOf(s.outPath)), false);
  assert.equal(holdsNoise(`${r.stdout}${r.stderr}`), false, 'text of another line was kept');
  // One pair of matching quotes, single or double, is stripped; only one.
  const quoted = {
    [`OPENAI_API_KEY='${KEY}'`]: KEY,
    [`OPENAI_API_KEY=${KEY}`]: KEY,
    [`OPENAI_API_KEY="'${KEY}'"`]: `'${KEY}'`,
    [`export OPENAI_API_KEY='"${KEY}"'`]: null,
    [`OPENAI_API_KEY="${KEY}'`]: null,
  };
  for (const [line, expected] of Object.entries(quoted)) {
    const there = fresh();
    const call1 = call({ ...s, profilePath: writeProfile(there, [ON, keysLine(writeKeys(there, [line]))]) }, { env: {} });
    if (expected === null) {
      // Inner or unmatched quotes stay, and a key holds no double quote: refused, without the value.
      const e = await refusal(call1);
      assert.ok(e instanceof DescribeError && e.message.startsWith('the key in OPENAI_API_KEY, from '), line);
      assert.equal(holdsKey(e), false);
    } else {
      await call1;
      assert.equal(s.server.requests.at(-1).headers.authorization === `Bearer ${expected}`, true, line);
    }
  }
});

test('a byte-order mark before the keys file’s first line does not hide that line', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const keys = writeKeys(dir, [`\uFEFFOPENAI_API_KEY=${KEY}`, '# the rest of the file']);
  const result = await call({ ...s, profilePath: writeProfile(dir, [ON, keysLine(keys)]) }, { env: {} });
  assert.equal(result.ok, true);
  assert.equal(s.server.requests[0].headers.authorization === `Bearer ${KEY}`, true, 'the first line’s key was sent');
});

test('a keys file without the line, or with an empty value, is no key, and shows none of its text', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  for (const last of [null, 'OPENAI_API_KEY=', 'OPENAI_API_KEY=""', "export OPENAI_API_KEY=''", 'OPENAI_API_KEY=   ']) {
    const dir = fresh();
    const keys = writeKeys(dir, last === null ? NOISE : [...NOISE, last]);
    const profilePath = writeProfile(dir, [ON, keysLine(keys)]);
    const e = await refusal(call({ ...s, profilePath }, { env: {} }));
    assert.ok(e instanceof DescribeError);
    assert.equal(
      e.message,
      `no key for openai: set OPENAI_API_KEY in the environment, or write the line OPENAI_API_KEY=<the key> in the file the profile's keys-file names (${keys} holds no such line)`,
    );
    assert.equal(holdsNoise(inspect(e, { showHidden: true })), false);
    const r = await run(flagsOf({ ...s, profilePath }), { env: {} });
    assert.equal(r.status, 1);
    assert.equal(holdsNoise(`${r.stdout}${r.stderr}`), false);
  }
  assert.equal(s.server.requests.length, 0);
});

test('a keys file that cannot be read stops the run with its path and error code, nothing more', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const missing = join(dir, 'made-up', 'missing-dotenv.txt');
  const e = await refusal(call({ ...s, profilePath: writeProfile(dir, [ON, keysLine(missing)]) }, { env: {} }));
  assert.ok(e instanceof DescribeError);
  assert.equal(e.message, `cannot read the keys file ${missing}: ENOENT`);
  const folder = join(fresh(), 'a folder');
  mkdirSync(folder);
  const profilePath = writeProfile(dirname(folder), [ON, keysLine(folder)]);
  const r = await run(flagsOf({ ...s, profilePath }), { env: {} });
  assert.equal(r.status, 1);
  assert.equal(r.stderr, `cannot read the keys file ${folder}: EISDIR\n`);
  assert.equal(s.server.requests.length, 0);
});

test('the command line takes no key and no keys file: those flags and any other unknown one are bad usage', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const keys = writeKeys(fresh(), [`OPENAI_API_KEY=${KEY}`]);
  const cases = [
    [['--key', KEY], 'unknown flag --key'],
    [[`--key=${KEY}`], 'unknown flag --key'],
    [['--keys-file', keys], 'unknown flag --keys-file'],
    [['--api-key', KEY], 'unknown flag --api-key'],
    [['--openai-api-key', KEY], 'unknown flag --openai-api-key'],
    [[KEY], 'describe takes no positional argument; 1 given'],
  ];
  for (const [extra, message] of cases) {
    const r = await run([...flagsOf(s), ...extra], { env: {} });
    assert.equal(r.status, 2, message);
    assert.equal(r.stdout, '');
    assert.ok(r.stderr.startsWith(`${message}\n\nUsage: node scripts/describe.mjs`), message);
    assert.equal(r.stderr.includes(keys), false, 'the keys file is not named back');
  }
  assert.equal(s.server.requests.length, 0);
});

test('a key is sent trimmed, and one a header cannot carry exactly is refused without showing it', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const result = await call(s, { env: { OPENAI_API_KEY: `  ${KEY}\n` } });
  assert.equal(result.ok, true);
  assert.equal(s.server.requests[0].headers.authorization === `Bearer ${KEY}`, true, 'the key was sent trimmed');
  for (const bad of ['test key 0000 not real', 'test-key\n0000', 'test-kéy-0000', 'test-key-"0000"', 'test-key\\0000']) {
    const e = await refusal(call(s, { env: { OPENAI_API_KEY: bad } }));
    assert.ok(e instanceof DescribeError);
    assert.equal(
      e.message,
      'the key in OPENAI_API_KEY, from the environment, holds a character no key holds (a space, a quote, a backslash, a control character or a letter beyond ASCII); write it as one word',
    );
  }
  assert.equal(s.server.requests.length, 1);
});

// --- 8. The key leaves by no other door --------------------------------------------------------------

// The key written with JSON escapes: its first letter as \u0074, its first hyphen as \u002D. Not the key as
// text; the key once the escapes are undone.
const ESCAPED = `\\u0074${KEY.slice(1).replace('-', '\\u002D')}`;
// A key with a slash, which JSON may write as \/.
const SLASH_KEY = 'test/key-2222-not-real';

test('an answer that holds the key as written is saved nowhere, valid or not, and an earlier run’s files go too', async t => {
  const proposal = fixture('unified-list.json');
  let answer;
  const s = await setup(t, (seen, res) => answer(seen, res));
  const cases = {
    // A valid proposal but for the key in one of its lines.
    'a valid proposal': [{ provider: 'gemini' }, () => JSON.stringify({ ...proposal, hardest: `${proposal.hardest} ${KEY}` }), seen => geminiSays(JSON.stringify({ ...proposal, hardest: `${proposal.hardest} ${sentKey(seen)}` }))],
    // Prose where a backslash before it would read as \t once escapes were undone: only the text as written shows it.
    'prose, after a backslash': [{}, () => `Saved under C:\\${KEY} for you.`, seen => openaiSays(`Saved under C:\\${sentKey(seen).slice(7)} for you.`)],
  };
  for (const [what, [over, text, responder]] of Object.entries(cases)) {
    answer = (seen, res) => responder(seen)(seen, res);
    mkdirSync(dirname(s.outPath), { recursive: true });
    writeFileSync(s.outPath, 'an earlier proposal\n');
    writeFileSync(rawOf(s.outPath), 'an earlier answer');
    const r = await run(flagsOf(s, over));
    assert.equal(r.status, 1, what);
    assert.match(r.stdout, resultLine(over.provider ?? 'openai', 'test-model', text().length), what);
    assert.equal(r.stderr, HELD, what);
    assert.deepEqual(filesIn(dirname(s.outPath)), [], what);
    assert.equal(anyFileHolds(s.dir, KEY), false, `${what}: a file holds the key`);
  }
  // In this process: not ok, held, and no reason beside it.
  answer = (seen, res) => openaiSays(`You sent ${sentKey(seen)}.`)(seen, res);
  const result = await call(s);
  assert.equal(result.ok, false);
  assert.equal(result.heldKey, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.chars, `You sent Bearer ${KEY}.`.length);
  assert.deepEqual(filesIn(dirname(s.outPath)), []);
});

test('an answer that holds the key in JSON escapes inside a valid proposal is saved nowhere', async t => {
  const proposal = fixture('unified-list.json');
  // The escapes go into the JSON text as they are; the rest of the line is written as JSON writes it.
  const withKey = escaped => JSON.stringify({ ...proposal, hardest: 'HARDEST' }).replace('HARDEST', () => `${JSON.stringify(proposal.hardest).slice(1, -1)} ${escaped}`);
  const s = await setup(t, (seen, res) => openaiSays(withKey(sentKey(seen) === `Bearer ${KEY}` ? ESCAPED : SLASH_KEY.replace('/', '\\/')))(seen, res));
  // Without the key in it, the same answer is a valid proposal.
  assert.deepEqual(validate({ ...JSON.parse(withKey('a line')), engine: 'model:openai', model: 'test-model' }), []);
  for (const [key, escaped] of [[KEY, ESCAPED], [SLASH_KEY, SLASH_KEY.replace('/', '\\/')]]) {
    const r = await run(flagsOf(s), { env: { OPENAI_API_KEY: key } });
    assert.equal(r.status, 1, escaped);
    assert.match(r.stdout, resultLine('openai', 'test-model', withKey(escaped).length));
    assert.equal(r.stderr, HELD, escaped);
    assert.equal(`${r.stdout}${r.stderr}`.includes(key) || `${r.stdout}${r.stderr}`.includes(escaped), false, 'the key reached the screen');
    assert.deepEqual(filesIn(dirname(s.outPath)), [], escaped);
    assert.equal(anyFileHolds(s.dir, key, escaped), false, 'a file holds the key');
  }
});

test('an answer that holds the key in JSON escapes inside prose keeps no raw file', async t => {
  const prose = `I was given \\u0074${KEY.slice(1)}; here is no proposal.`;
  const s = await setup(t, openaiSays(prose));
  const r = await run(flagsOf(s));
  assert.equal(r.status, 1);
  assert.match(r.stdout, resultLine('openai', 'test-model', prose.length));
  assert.equal(r.stderr, HELD);
  assert.equal(existsSync(rawOf(s.outPath)), false);
  assert.equal(anyFileHolds(s.dir, KEY, ESCAPED, `\\u0074${KEY.slice(1)}`), false, 'a file holds the key');
});

test('no thrown error carries the key, even where a path it names holds it', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  writeFileSync(join(dir, KEY), 'a file where a folder is wanted');
  // An earlier run's --out cannot be cleared there, so nothing is sent.
  const e = await refusal(call({ ...s, outPath: join(dir, KEY, 'proposal.json') }));
  assert.ok(e instanceof DescribeError);
  assert.equal(e.message, `cannot remove ${join(dir, '[key]', 'proposal.json')}: part of the path is a file, not a folder`);
  assert.equal(holdsKey(e), false);
  assert.equal(s.server.requests.length, 0);
});

test('a key echoed in an error body reaches neither the screen nor a file', async t => {
  const s = await setup(t, (seen, res) => reply(403, { error: { message: `Forbidden for ${sentKey(seen)}` } })(seen, res));
  const r = await run(flagsOf(s));
  assert.equal(r.status, 1);
  assert.equal(r.stderr, 'openai answered 403: the key was refused\n');
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

// --- 9. No error body is shown or saved --------------------------------------------------------------

test('a status outside 2xx is the status and the sentence of its class, and nothing of the body', async t => {
  let status;
  const s = await setup(t, (seen, res) => reply(status, { error: { message: `Incorrect API key provided: sk-secret; you sent ${sentKey(seen)}` } })(seen, res));
  const classes = [
    [401, 'the key was refused'],
    [403, 'the key was refused'],
    [404, 'the model or the address was not found'],
    [429, 'the provider is limiting requests or the quota is spent'],
    [500, 'the provider failed'],
    [503, 'the provider failed'],
    [400, 'the request was refused'],
    [418, 'the request was refused'],
  ];
  for (const [code, sentence] of classes) {
    status = code;
    for (const provider of ['openai', 'gemini']) {
      const e = await refusal(call(s, { provider }));
      assert.ok(e instanceof DescribeError);
      assert.equal(e.message, `${provider} answered ${code}: ${sentence}`);
      assert.equal(holdsKey(e) || inspect(e, { showHidden: true }).includes('sk-secret'), false, 'the error holds the body');
      assert.equal(e.cause, undefined);
    }
  }
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

test('a network failure is a fixed sentence and its code, never a stack', async t => {
  const s = await setup(t, never);
  const closed = await serve(never);
  await closed.close();
  const r = await run(flagsOf(s, { endpoint: closed.endpoint }));
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, 'the request to openai failed before any answer came: ECONNREFUSED\n');
  const e = await refusal(call(s, { endpoint: closed.endpoint }));
  assert.equal(e.message, 'the request to openai failed before any answer came: ECONNREFUSED');
  assert.equal(e.cause, undefined);
});

// --- 10. No redirect is followed ---------------------------------------------------------------------

test('a redirect is never followed, so the key header is never resent elsewhere', async t => {
  const elsewhere = await open(t, openaiSays(fenced(fixture('calendar.json'))));
  let status;
  const s = await setup(t, never);
  const redirecting = await open(t, (seen, res) => reply(status, '', { location: `${elsewhere.endpoint}/v1/chat/completions` })(seen, res));
  for (const code of [302, 307, 308]) {
    status = code;
    const e = await refusal(call({ ...s, endpoint: redirecting.endpoint }));
    assert.ok(e instanceof DescribeError);
    assert.equal(e.message, 'openai answered with a redirect, which is never followed: it would send the key on to another address');
    assert.equal(holdsKey(e), false);
  }
  assert.equal(redirecting.requests.length, 3);
  assert.equal(elsewhere.requests.length, 0, 'the second server received a request');
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

// --- 11. The address, the model, the timeout ---------------------------------------------------------

test('an endpoint is a stand-in on this machine only, http: or https:, with no user, password, query or fragment', () => {
  const accepted = {
    'https://127.0.0.1:8443': 'https://127.0.0.1:8443',
    'http://127.0.0.1:8080': 'http://127.0.0.1:8080',
    'http://localhost:8080/': 'http://localhost:8080',
    'https://localhost/stand-in/': 'https://localhost/stand-in',
    'http://[::1]:8080': 'http://[::1]:8080',
  };
  for (const [endpoint, base] of Object.entries(accepted)) assert.equal(baseOf(endpoint), base, endpoint);
  const elsewhere = /must be an http: or https: address on this machine/;
  const refused = {
    // Any host but this machine, the providers' own among them: their address is reached by leaving the flag out.
    'https://api.openai.com': elsewhere,
    'https://generativelanguage.googleapis.com': elsewhere,
    'https://api.example.test': elsewhere,
    'https://api.example.test/': elsewhere,
    'http://api.example.test': elsewhere,
    'http://127.0.0.2:8080': elsewhere,
    'https://localhost.example.test': elsewhere,
    'ftp://127.0.0.1': elsewhere,
    'file:///tmp/x': elsewhere,
    'https://user:pw@127.0.0.1': /no user and no password/,
    'https://user@localhost': /no user and no password/,
    'https://:pw@127.0.0.1': /no user and no password/,
    'http://user@[::1]:8080': /no user and no password/,
    'https://127.0.0.1/?x=1': /no query and no fragment/,
    'https://127.0.0.1/?': /no query and no fragment/,
    'https://localhost/#part': /no query and no fragment/,
    'https://localhost#': /no query and no fragment/,
    'not an address': /must be an address/,
    '': /must be an address/,
  };
  for (const [endpoint, message] of Object.entries(refused)) {
    assert.throws(() => baseOf(endpoint), e => e instanceof UsageError && message.test(e.message) && e.message.startsWith('--endpoint '), endpoint);
  }
  // A module caller's address that is not text is no address, even one a URL could be made from.
  for (const endpoint of [new URL('http://127.0.0.1:8080'), 443, null]) {
    assert.throws(() => baseOf(endpoint), e => e instanceof UsageError && /must be an address/.test(e.message), String(endpoint));
  }
});

test('the provider’s own address is reached by leaving --endpoint out, never by naming it', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  // No key, no keys file: whatever the address, nothing can be sent.
  for (const [provider, endpoint] of [['openai', 'https://api.openai.com'], ['gemini', 'https://generativelanguage.googleapis.com'], ['openai', 'https://api.example.test']]) {
    const r = await run(flagsOf(s, { provider, endpoint }), { env: {} });
    assert.equal(r.status, 2, endpoint);
    assert.ok(r.stderr.startsWith('--endpoint must be an http: or https: address on this machine'), endpoint);
  }
  // Left out, the provider's own address passes the usage: the run goes on to the brief, which is missing.
  const { env, looked } = watched();
  const briefPath = join(s.dir, 'NO-BRIEF.md');
  const e = await refusal(call({ ...s, briefPath }, { endpoint: undefined, env }));
  assert.ok(e instanceof DescribeError);
  assert.equal(e.message, `cannot read the brief ${briefPath}: not found`);
  assert.deepEqual(looked, []);
  assert.equal(s.server.requests.length, 0);
});

test('a trailing slash on the endpoint is tolerated, and a bad endpoint on the command line is bad usage', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const result = await call(s, { endpoint: `${s.endpoint}/` });
  assert.equal(result.ok, true);
  assert.equal(s.server.requests[0].url, '/v1/chat/completions');
  const r = await run(flagsOf(s, { endpoint: `http://user:pw@${s.endpoint.slice('http://'.length)}` }));
  assert.equal(r.status, 2);
  assert.ok(r.stderr.startsWith('--endpoint must carry no user and no password\n\nUsage: '));
  assert.equal(r.stderr.includes('pw@'), false, 'the endpoint is not shown back');
  assert.equal(s.server.requests.length, 1);
});

test('the model id is safe in an address: letters, digits, dot, underscore and hyphen only', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  for (const model of ['gpt/4', '../v1', 'a b', 'x?y', 'x#y', 'mödel', '', 'gpt:4']) {
    const { env, looked } = watched();
    const e = await refusal(call(s, { provider: 'gemini', model, env }));
    assert.ok(e instanceof UsageError, JSON.stringify(model));
    assert.equal(e.message, '--model must be a model id of letters, digits, ".", "_" and "-", as gpt-4o-mini');
    assert.deepEqual(looked, []);
  }
  assert.equal(s.server.requests.length, 0);
  const r = await run(flagsOf(s, { model: 'gpt/4' }));
  assert.equal(r.status, 2);
  assert.equal(r.stderr.includes('gpt/4'), false, 'the model is not shown back');
});

test('the timeout is a whole number of milliseconds from 1 to 2147483647, and 300000 when none is given', async t => {
  assert.equal(DEFAULT_TIMEOUT, 300000);
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  for (const timeoutMs of [0, -1, 1.5, Number.NaN, '500', 2 ** 31, 2 ** 53]) {
    const { env, looked } = watched();
    const e = await refusal(call(s, { timeoutMs, env }));
    assert.ok(e instanceof UsageError, String(timeoutMs));
    assert.equal(e.message, '--timeout must be a whole number of milliseconds from 1 to 2147483647, as 30000');
    assert.deepEqual(looked, []);
  }
  for (const timeout of ['0', 'abc', '1.5', '-5', '2147483648']) {
    const r = await run(flagsOf(s, { timeout }));
    assert.equal(r.status, 2, timeout);
  }
  // The longest a timer can wait is taken; the answer comes at once, so nothing waits for it.
  assert.equal((await call(s, { timeoutMs: 2 ** 31 - 1 })).ok, true);
  assert.equal((await run(flagsOf(s, { timeout: '2147483647' }))).status, 0);
  // Left out, the run goes ahead under the default.
  const result = await call(s, { timeoutMs: undefined });
  assert.equal(result.ok, true);
  const r = await run(flagsOf(s, { timeout: null }));
  assert.equal(r.status, 0);
});

test('the profile is read before the usage, and the usage before the brief, the key and the request', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const off = writeProfile(fresh(), []);
  const on = writeProfile(fresh(), [ON, keysLine(join(s.dir, 'no-such-dotenv.txt'))]);
  const bad = {
    'a model with a slash': { model: 'gpt/4' },
    'an http address off this machine': { endpoint: 'http://api.example.test' },
    'the provider’s own address, named': { endpoint: 'https://api.openai.com' },
    'an address with a query': { endpoint: `${s.endpoint}/?x=1` },
    'a timeout of 0': { timeoutMs: 0 },
    'an out that is not .json': { outPath: join(s.dir, 'proposal.txt') },
  };
  for (const [what, over] of Object.entries(bad)) {
    const first = await refusal(call({ ...s, profilePath: off }, { ...over, env: watched().env }));
    assert.ok(first instanceof DescribeError && first.message.includes('does not turn model:openai on'), `${what}: the profile first`);
    const { env, looked } = watched();
    const second = await refusal(call({ ...s, profilePath: on, briefPath: join(s.dir, 'NO-BRIEF.md') }, { ...over, env }));
    assert.ok(second instanceof UsageError, `${what}: then the usage, before the brief`);
    assert.deepEqual(looked, [], `${what}: no key is looked up`);
  }
  // The command line: an engine that is off is said before a bad model.
  const r = await run(flagsOf({ ...s, profilePath: off }, { model: 'gpt/4' }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /does not turn model:openai on/);
  assert.equal(s.server.requests.length, 0);
});

test('an earlier run’s files are gone once a request is sent, whatever comes back, and stay when nothing is sent', BOUNDED, async t => {
  let answer;
  const s = await setup(t, (seen, res) => answer(seen, res));
  const folder = dirname(s.outPath);
  const stale = () => {
    mkdirSync(folder, { recursive: true });
    writeFileSync(s.outPath, 'an earlier proposal\n');
    writeFileSync(rawOf(s.outPath), 'an earlier answer');
  };
  const closed = await serve(never);
  await closed.close();
  const sent = {
    'a 500': [reply(500, 'Incorrect API key provided: sk-secret'), {}],
    'a 200 without text': [reply(200, { choices: [] }), {}],
    'no answer in time': [never, { timeoutMs: 300 }],
    'a network failure': [never, { endpoint: closed.endpoint }],
  };
  for (const [what, [responder, over]] of Object.entries(sent)) {
    answer = responder;
    stale();
    const e = await refusal(call(s, over));
    assert.ok(e instanceof DescribeError, what);
    assert.deepEqual(filesIn(folder), [], `${what}: an earlier run’s file is left`);
  }
  assert.equal(s.server.requests.length, 3);
  // Refused before anything is sent: the disk is as it was.
  const notSent = {
    'the engine off': [{ ...s, profilePath: writeProfile(fresh(), []) }, {}],
    'bad usage': [s, { model: 'gpt/4' }],
    'no brief': [{ ...s, briefPath: join(s.dir, 'NO-BRIEF.md') }, {}],
    'no key': [s, { env: {} }],
  };
  for (const [what, [where, over]] of Object.entries(notSent)) {
    stale();
    await refusal(call(where, over));
    assert.deepEqual(filesIn(folder), ['model openai.json', 'model openai.json.raw.txt'], what);
  }
  assert.equal(s.server.requests.length, 3);
});

// --- 12. The timeout really stops it -----------------------------------------------------------------

test('an answer that stops halfway ends at the timeout too', BOUNDED, async t => {
  const s = await setup(t, (seen, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{"choices": [{"message": {"content": "');
  });
  const started = Date.now();
  const e = await refusal(call(s, { timeoutMs: 300 }));
  assert.ok(e instanceof DescribeError);
  assert.equal(e.message, 'openai: no answer within 0.3 s');
  assert.ok(Date.now() - started < 300 + 2000);
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

// --- 13. The request ---------------------------------------------------------------------------------

test('an empty or missing brief is refused before the key and before any request', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const dir = fresh();
  const cases = { 'BRIEF-empty.md': '', 'BRIEF-blank.md': '  \r\n\t\n' };
  for (const [name, text] of Object.entries(cases)) {
    const briefPath = join(dir, name);
    writeFileSync(briefPath, text);
    const { env, looked } = watched();
    const e = await refusal(call({ ...s, briefPath }, { env }));
    assert.ok(e instanceof DescribeError);
    assert.equal(e.message, `the brief ${briefPath} is empty: there is nothing to send`);
    assert.deepEqual(looked, []);
  }
  const missing = join(dir, 'NO-BRIEF.md');
  const e = await refusal(call({ ...s, briefPath: missing }, { env: watched().env }));
  assert.equal(e.message, `cannot read the brief ${missing}: not found`);
  const r = await run(flagsOf({ ...s, briefPath: missing }));
  assert.equal(r.status, 1);
  assert.equal(r.stderr, `cannot read the brief ${missing}: not found\n`);
  assert.equal(s.server.requests.length, 0);
});

// --- 14. The answer ----------------------------------------------------------------------------------

test('an answer is one JSON object: the whole answer, or the content of its one fenced block', async t => {
  let answer;
  const s = await setup(t, (seen, res) => openaiSays(answer)(seen, res));
  const proposal = fixture('unified-list.json');
  const body = JSON.stringify(proposal, null, 2);
  const block = (info, text) => `\`\`\`${info}\n${text}\n\`\`\``;
  const accepted = {
    'the whole answer, with white space around it': `\n\n  ${body}  \n`,
    'one json block, with prose around it': `Here it is:\n${block('json', body)}\nThat is all.`,
    'one bare block': block('', body),
  };
  const refused = {
    'prose only': 'Put the free rooms first.',
    'an object inside prose, with no block': `Here: ${JSON.stringify(proposal)}`,
    'two json blocks': `${block('json', body)}\nOr:\n${block('json', body)}`,
    'a json block and another block': `${block('json', body)}\n${block('text', 'notes')}`,
    'a block marked as another language': block('js', body),
    'a block never closed': `\`\`\`json\n${body}\n`,
    'a list, not an object': JSON.stringify([proposal]),
    'a block holding a list': block('json', JSON.stringify([proposal])),
    'a block that is not JSON': block('json', "{ name: 'x' }"),
  };
  for (const [what, text] of Object.entries(accepted)) {
    answer = text;
    const outPath = join(fresh(), 'proposal.json');
    const result = await call({ ...s, outPath });
    assert.equal(result.ok, true, what);
    assert.equal(readFileSync(outPath, 'utf8'), written(proposal), what);
    assert.equal(existsSync(rawOf(outPath)), false, what);
  }
  for (const [what, text] of Object.entries(refused)) {
    answer = text;
    const outPath = join(fresh(), 'proposal.json');
    const result = await call({ ...s, outPath });
    assert.equal(result.ok, false, what);
    assert.equal(result.errors.length, 1, what);
    assert.equal(readFileSync(rawOf(outPath), 'utf8'), text, what);
    assert.equal(existsSync(outPath), false, what);
  }
});

test('the engine and the model are the script’s, whatever the answer said', async t => {
  const proposal = { ...fixture('calendar.json'), engine: 'claude', model: 'another-model', author: 'a maker' };
  const s = await setup(t, openaiSays(JSON.stringify(proposal)));
  const result = await call(s, { model: 'gpt-test-2' });
  assert.equal(result.ok, true);
  const out = JSON.parse(readFileSync(s.outPath, 'utf8'));
  assert.equal(out.engine, 'model:openai');
  assert.equal(out.model, 'gpt-test-2');
  assert.equal(out.author, 'a maker');
});

test('a proposal and a raw file never both exist after a run', async t => {
  let answer;
  const s = await setup(t, (seen, res) => openaiSays(answer)(seen, res));
  mkdirSync(dirname(s.outPath), { recursive: true });
  // A valid answer takes away a raw file an earlier run left.
  writeFileSync(rawOf(s.outPath), 'an earlier answer');
  answer = fenced(fixture('calendar.json'));
  assert.equal((await call(s)).ok, true);
  assert.deepEqual(filesIn(dirname(s.outPath)), ['model openai.json']);
  // One that is not valid takes away the proposal an earlier run wrote.
  answer = 'No proposal today.';
  assert.equal((await call(s)).ok, false);
  assert.deepEqual(filesIn(dirname(s.outPath)), ['model openai.json.raw.txt']);
});

test('the first ten validation errors go to standard error, and the result line to standard output', async t => {
  const answer = { name: '', bet: '', cost: '', absent: [], hardest: '', firstIdea: '', screens: [], one: 1, two: 2, three: 3, four: 4, five: 5 };
  const text = JSON.stringify(answer);
  const s = await setup(t, openaiSays(text));
  const errors = validate({ ...answer, engine: 'model:openai', model: 'test-model' });
  assert.ok(errors.length > 11, 'the answer has more than ten errors');
  const r = await run(flagsOf(s));
  assert.equal(r.status, 1);
  assert.match(r.stdout, resultLine('openai', 'test-model', text.length));
  assert.equal(
    r.stderr,
    [
      `the answer is not one valid proposal, so no proposal is written; the answer is kept as it came, in ${rawOf(s.outPath)}:`,
      ...errors.slice(0, 10).map(error => `  ${error}`),
      `  ... and ${errors.length - 10} more`,
      '',
    ].join('\n'),
  );
  assert.equal(readFileSync(rawOf(s.outPath), 'utf8'), text);
});

test('an answer too deep to be checked is not a valid one: kept as it came, with the result line', async t => {
  // Containers nested 20,000 deep: JSON reads it, and checking it runs out of stack.
  const nest = '{"container":"group","label":"g","items":['.repeat(20_000) + '{"role":"text","text":"x"}' + ']}'.repeat(20_000);
  const text = JSON.stringify({ ...fixture('calendar.json'), screens: [{ id: 'deep', title: 'Deep', container: 'screen', items: ['NEST'] }] }).replace('"NEST"', () => nest);
  const s = await setup(t, openaiSays(text));
  const r = await run(flagsOf(s));
  assert.equal(r.status, 1);
  assert.match(r.stdout, resultLine('openai', 'test-model', text.length));
  assert.equal(
    r.stderr,
    `the answer is not one valid proposal, so no proposal is written; the answer is kept as it came, in ${rawOf(s.outPath)}:\n  the answer could not be checked against the walkthrough format (it may be nested too deeply)\n`,
  );
  assert.equal(readFileSync(rawOf(s.outPath), 'utf8') === text, true, 'the raw file holds the answer as it came');
});

test('a 2xx without text is a fixed sentence, with the provider’s reason only when it is a short token', async t => {
  let body;
  const s = await setup(t, (seen, res) => reply(200, typeof body === 'function' ? body(seen) : body)(seen, res));
  const openai = 'openai answered 200 with no text at choices[0].message.content';
  const gemini = 'gemini answered 200 with no text at candidates[0].content.parts[].text';
  const tail = '; nothing of its body is shown or kept';
  const cases = [
    ['openai', { choices: [{ message: { content: '' }, finish_reason: 'length' }] }, `${openai} (length)${tail}`],
    ['openai', { choices: [{ message: { content: null }, finish_reason: 'content_filter' }] }, `${openai} (content_filter)${tail}`],
    ['openai', { choices: [{ message: { content: ' \n ' }, finish_reason: 'stop' }] }, `${openai} (stop)${tail}`],
    ['openai', {}, `${openai}${tail}`],
    ['openai', '<html>sk-secret</html>', `${openai}${tail}`],
    ['openai', seen => ({ choices: [{ message: { content: '' }, finish_reason: `stop for ${sentKey(seen)}` }] }), `${openai}${tail}`],
    ['openai', { choices: [{ message: { content: '' }, finish_reason: 'a'.repeat(41) }] }, `${openai}${tail}`],
    ['openai', { choices: [{ message: { content: '' }, finish_reason: 'sk-secret' }] }, `${openai}${tail}`],
    ['gemini', { promptFeedback: { blockReason: 'SAFETY' } }, `${gemini} (SAFETY)${tail}`],
    ['gemini', { candidates: [{ finishReason: 'RECITATION' }] }, `${gemini} (RECITATION)${tail}`],
    ['gemini', { candidates: [{ content: { parts: [{ inlineData: {} }] }, finishReason: 'STOP' }] }, `${gemini} (STOP)${tail}`],
    ['gemini', 'not json', `${gemini}${tail}`],
  ];
  for (const [provider, answer, message] of cases) {
    body = answer;
    const e = await refusal(call(s, { provider }));
    assert.ok(e instanceof DescribeError, message);
    assert.equal(e.message, message);
    assert.equal(holdsKey(e), false);
  }
  assert.deepEqual(filesIn(join(s.dir, 'proposals')), []);
});

test('the proposal is written whole: a write that fails leaves no part of it, and nothing staged', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const folder = dirname(s.outPath);
  mkdirSync(folder, { recursive: true });
  writeFileSync(s.outPath, 'EARLIER\n');
  // Every file written in that folder gets one byte, and then the disk is full.
  const preload = join(fresh(), 'faults.cjs');
  writeFileSync(
    preload,
    [
      "const fs = require('node:fs');",
      "const { dirname } = require('node:path');",
      'const write = fs.writeFileSync;',
      'fs.writeFileSync = (path, data, ...rest) => {',
      '  if (dirname(String(path)) === process.env.FAULT_DIR) {',
      '    write(path, String(data).slice(0, 1), ...rest);',
      "    throw Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' });",
      '  }',
      '  return write(path, data, ...rest);',
      '};',
      "require('node:module').syncBuiltinESMExports();",
    ].join('\n'),
  );
  const r = await run(flagsOf(s), { env: { ...MADE_UP, FAULT_DIR: folder }, preload });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, `cannot write ${s.outPath}: ENOSPC: no space left on device, write\n`);
  // The earlier one went before the request; of this one, not a byte is at --out.
  assert.deepEqual(filesIn(folder), []);
});

test('a folder that turns into a file between the clearing and the write is said as the write’s failure', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const folder = dirname(s.outPath);
  // Another hand puts a file where the folder of --out is to be made, just as it is made.
  const preload = join(fresh(), 'turns.cjs');
  writeFileSync(
    preload,
    [
      "const fs = require('node:fs');",
      'const make = fs.mkdirSync;',
      'fs.mkdirSync = (path, ...rest) => {',
      "  if (String(path) === process.env.TURN_DIR) fs.writeFileSync(path, 'a file now');",
      '  return make(path, ...rest);',
      '};',
      "require('node:module').syncBuiltinESMExports();",
    ].join('\n'),
  );
  const r = await run(flagsOf(s), { env: { ...MADE_UP, TURN_DIR: folder }, preload });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.ok(r.stderr.startsWith(`cannot write ${s.outPath}: `), 'the failure said is the write’s');
  assert.equal(r.stderr.split('\n').length, 2, 'one line, no stack');
});

// --- 15, 16. Standard output, --out, exit codes ------------------------------------------------------

test('standard output is the one result line on success, and the proposal is written where --out says', async t => {
  const proposal = fixture('free-first.json');
  const answer = fenced(proposal);
  const s = await setup(t, geminiSays(answer));
  const r = await run(flagsOf(s, { provider: 'gemini', model: 'gemini-2.5-pro' }));
  assert.equal(r.status, 0);
  assert.match(r.stdout, resultLine('gemini', 'gemini-2\\.5-pro', answer.length));
  assert.equal(r.stderr, '');
  assert.equal(readFileSync(s.outPath, 'utf8'), written(proposal, 'gemini', 'gemini-2.5-pro'));
});

test('--out must name a .json file', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  const outPath = join(s.dir, 'proposal.txt');
  const e = await refusal(call({ ...s, outPath }, { env: watched().env }));
  assert.ok(e instanceof UsageError);
  assert.equal(e.message, `--out must name a .json file; it is ${outPath}`);
  const r = await run(flagsOf({ ...s, outPath }));
  assert.equal(r.status, 2);
  assert.ok(r.stderr.startsWith(`--out must name a .json file; it is ${outPath}\n\nUsage: `));
  assert.equal(s.server.requests.length, 0);
});

test('help goes to standard output, and a missing flag or an unknown provider is bad usage', async t => {
  const s = await setup(t, openaiSays(fenced(fixture('calendar.json'))));
  for (const ask of ['--help', '-h']) {
    const help = await run([ask, ...flagsOf(s)]);
    assert.equal(help.status, 0, ask);
    assert.equal(help.stderr, '', ask);
    assert.ok(help.stdout.startsWith('Usage: node scripts/describe.mjs --provider <openai|gemini> --model <id>'), ask);
    assert.ok(help.stdout.endsWith('2 bad usage.\n'), ask);
  }
  const missing = await run(['--provider', 'openai', '--model', 'test-model']);
  assert.equal(missing.status, 2);
  assert.ok(missing.stderr.startsWith('--brief, --out, --profile are missing\n\nUsage: '));
  const unknown = await run(flagsOf(s, { provider: 'claude' }));
  assert.equal(unknown.status, 2);
  assert.ok(unknown.stderr.startsWith('--provider must be openai or gemini\n\nUsage: '));
  assert.equal(s.server.requests.length, 0);
});

// --- 18. The script's text ---------------------------------------------------------------------------

test('the script writes standard output in two functions, everything through redact, and builds no key= address', () => {
  const source = readFileSync(cli, 'utf8');
  // The result line, and the usage --help asks for: the only two places standard output is written.
  let rest = source;
  for (const name of ['printResult', 'printUsage']) {
    const printer = new RegExp(`\\nfunction ${name}\\([^)]*\\) \\{\\n[\\s\\S]*?\\n\\}\\n`).exec(source);
    assert.ok(printer, `the script has a function ${name}`);
    assert.equal((printer[0].match(/process\.stdout\.write\(/g) ?? []).length, 1, `${name} writes standard output once`);
    assert.equal(/process\.stdout\.write\(redact\(/.test(printer[0]), true, `${name} writes through redact`);
    rest = rest.replace(printer[0], '\n');
  }
  assert.equal(/console\.log|process\.stdout\.write/.test(rest), false, 'console.log or process.stdout.write outside printResult and printUsage');
  assert.equal(/console\./.test(source), false, 'no console call at all');
  // Named once per door, so that no alias (const out = process.stdout) writes past the checks.
  const count = text => source.split(text).length - 1;
  assert.equal(count('process.stdout'), 2, 'process.stdout is named in printResult and printUsage only');
  assert.equal(count('process.stderr'), 1, 'process.stderr is named in say only');
  assert.equal(count('writeFileSync('), 1, 'one call writes a file');
  for (const writer of ['appendFileSync', 'appendFile(', 'createWriteStream', 'writeFile(', 'writeSync(', 'fs/promises', 'fs.promises', 'promises.']) {
    assert.equal(source.includes(writer), false, `the script names ${writer}`);
  }
  // Where a key may go when no --endpoint is given, and how localhost is looked up: read by no other test.
  assert.equal(count("endpoint: 'https://api.openai.com',"), 1, 'the openai default address');
  assert.equal(count("endpoint: 'https://generativelanguage.googleapis.com',"), 1, 'the gemini default address');
  assert.equal(count('https://'), 4, 'no other https: address in the script but the two defaults, named again in the usage');
  assert.match(source, /^import dns from 'node:dns';$/m);
  assert.equal((source.match(/^dns\.setDefaultResultOrder\('ipv4first'\);$/gm) ?? []).length, 1, 'the dns line, at the top level');
  // Every other door, standard error and each file written, passes through redact too.
  const doors = source.match(/(?:process\.stderr\.write|writeFileSync)\([^\n]*/g) ?? [];
  assert.ok(doors.length >= 2, 'the script writes standard error and files');
  for (const door of doors) assert.match(door, /^(?:process\.stderr\.write\(redact\(|writeFileSync\([^,]+, redact\()/);
  assert.equal(source.includes('key='), false, 'an address the script builds holds key=');
  assert.equal(source.includes('child_process'), false, 'the script starts no child process');
  assert.equal(source.split("'[key]'").length - 1, 1, 'one place puts [key] where the key was');
});
