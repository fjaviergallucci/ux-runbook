import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROLES, CONTAINERS, validate } from '../scripts/lib/walkthrough.mjs';
import { renderProposal } from '../scripts/render.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'render.mjs');
const greyKit = join(here, '..', 'kit', 'grey');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'render-'));
after(() => rmSync(root, { recursive: true, force: true }));

const fixturePath = name => join(here, 'fixtures', name);
const load = name => JSON.parse(readFileSync(fixturePath(name), 'utf8'));
// Every role and every container, a dialog, notes, a repeated id, provenance and hostile words.
const EVERY = 'render/every-part.json';
const PROPOSALS = ['unified-list', 'free-first', 'calendar'].map(name => `proposals/${name}.json`);
const ALL = [EVERY, ...PROPOSALS];
const PROVENANCE = ['author', 'engine', 'track', 'model', 'source'];

const count = (text, part) => text.split(part).length - 1;
// A frame runs from its opening tag to the first `</section>` at the start of a line: a region inside it
// closes indented.
const frameOf = (page, id) => page.match(new RegExp(`<section class="ux-frame" data-screen="${id}">\\n[\\s\\S]*?\\n</section>\\n`))?.[0];
const headerOf = page => page.match(/<body>\n\n(<header>\n[\s\S]*?\n<\/header>\n)/)?.[1];
const deepFreeze = value => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};
const walk = (holder, visit) => {
  for (const item of holder.items) {
    visit(item);
    if (Object.hasOwn(item, 'container')) walk(item, visit);
  }
};
const itemsOf = proposal => {
  const items = [];
  for (const screen of proposal.screens) walk(screen, item => items.push(item));
  return items;
};

// ---- the drawing

test('the render fixture is valid and holds every role, every container, and each way a container is written', () => {
  const p = load(EVERY);
  assert.deepEqual(validate(p), []);
  const items = itemsOf(p);
  const roles = new Set(items.filter(i => i.role).map(i => i.role));
  const containers = new Set(items.filter(i => i.container).map(i => i.container));
  assert.deepEqual([...roles].sort(), [...ROLES].sort());
  assert.deepEqual([...containers].sort(), [...CONTAINERS].sort());
  const of = kind => items.filter(i => i.container === kind);
  assert.ok(of('region').some(i => i.label) && of('region').some(i => !i.label), 'a labelled and an unlabelled region');
  assert.ok(of('group').some(i => i.label) && of('group').some(i => !i.label), 'a labelled and an unlabelled group');
  assert.deepEqual(of('expansion').map(i => i.open), [undefined, false, true], 'an expansion closed by default, one written closed, one open');
  assert.deepEqual(p.screens.map(s => s.container), ['screen', 'dialog']);
  for (const key of PROVENANCE) assert.equal(typeof p[key], 'string', key);
});

test('the document is a whole page: the doctype, utf-8, the viewport, kit.css linked from beside it, titled by its letter', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.ok(page.startsWith('<!doctype html>\n<html>\n<head>\n'), page.slice(0, 40));
  assert.deepEqual(page.match(/<head>\n([\s\S]*?)\n<\/head>/)[1].split('\n'), [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Option B</title>',
    '<link rel="stylesheet" href="kit.css">',
  ]);
  assert.ok(page.endsWith('\n</section>\n\n</body>\n</html>\n'), page.slice(-40));
});

test("each screen's title is the caption of a ux-frame carrying data-screen, one frame per screen, in order", () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    assert.equal(count(page, '<section class="ux-frame"'), p.screens.length, name);
    let last = -1;
    for (const screen of p.screens) {
      const frame = frameOf(page, screen.id);
      assert.ok(frame, `${name}: a frame for ${screen.id}`);
      assert.ok(frame.startsWith(`<section class="ux-frame" data-screen="${screen.id}">\n  <header>\n    <h2>${screen.title}</h2>\n`), `${name}: ${screen.id}`);
      assert.ok(page.indexOf(frame) > last, `${name}: ${screen.id} is drawn in the walkthrough's order`);
      last = page.indexOf(frame);
    }
  }
});

test('the header shows the letter, the name, the bet, the cost, what is absent and the hardest state, each once', () => {
  const p = load(EVERY);
  const page = renderProposal(p, { letter: 'B' });
  assert.equal(headerOf(page), `<header>
  <h1>Option B: Floors, free first</h1>
  <dl>
    <dt>Its bet</dt>
    <dd>Rooms grouped by floor, with what is free on each floor first, follow the way she walks a patient to a room.</dd>
    <dt>Deliberately bad at</dt>
    <dd>A free room upstairs sits below the ground floor: she scrolls to compare floors.</dd>
    <dt>Absent on purpose</dt>
    <dd>
      <ul>
        <li>A plan of the whole building</li>
        <li>Bookings after today</li>
      </ul>
    </dd>
    <dt>In the hardest state</dt>
    <dd>With every room busy, each floor still names the room that frees up soonest, and when.</dd>
  </dl>
</header>
`);
  assert.equal(count(headerOf(page), 'Option B'), 1);
  for (const text of [p.name, p.bet, p.cost, ...p.absent, p.hardest]) assert.equal(count(page, text), 1, text);
  // The real fixtures too: their words reach the header, escaped the same way.
  const free = renderProposal(load(PROPOSALS[1]), { letter: 'C' });
  assert.match(headerOf(free), /<h1>Option C: Free rooms first<\/h1>/);
  assert.ok(headerOf(free).includes('<li>A &quot;show free rooms&quot; filter: the screen does the filtering</li>'));
});

test('the first idea is never drawn: neither its words nor its key', () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    assert.equal(count(page, '<section class="ux-frame"'), p.screens.length, `${name}: the page is drawn`);
    assert.ok(!page.includes(p.firstIdea), name);
    assert.ok(!page.includes(p.firstIdea.slice(0, 20)), `${name}: not even its start`);
    assert.doesNotMatch(page, /first ?idea/i, name);
  }
});

for (const key of PROVENANCE) {
  test(`who made a proposal is never drawn: not the key ${key}, not its value`, () => {
    for (const name of ALL) {
      const p = load(name);
      const page = renderProposal(p, { letter: 'A' });
      assert.equal(count(page, '<section class="ux-frame"'), p.screens.length, `${name}: the page is drawn`);
      assert.doesNotMatch(page, new RegExp(`\\b${key}\\b`, 'i'), `${name}: the key ${key}`);
      if (Object.hasOwn(p, key)) assert.ok(!page.includes(p[key]), `${name}: the value of ${key}, ${p[key]}`);
    }
    assert.ok(Object.hasOwn(load(EVERY), key), `the render fixture carries ${key}`);
  });
}

test('the drawing depends only on what the proposal says: same proposal and letter, same bytes, whoever made it', () => {
  const p = deepFreeze(load(EVERY));
  const page = renderProposal(p, { letter: 'C' });
  assert.equal(renderProposal(p, { letter: 'C' }), page, 'twice, the same bytes; and the proposal is not changed');
  const { author, engine, track, model, source, ...said } = load(EVERY);
  assert.equal(renderProposal(said, { letter: 'C' }), page, 'without provenance');
  const reordered = { screens: said.screens, ...said, source: 'other.json', firstIdea: 'Another idea, set aside.', model: 'm', track: 'system', engine: 'e', author: 'Someone else' };
  assert.equal(renderProposal(reordered, { letter: 'C' }), page, 'other makers, another first idea, keys in another order');
  assert.notEqual(renderProposal(p, { letter: 'D' }), page, 'the letter is part of what is drawn');
  assert.ok(!page.includes(String(new Date().getFullYear())), 'no date is written');
});

test('an item with an id carries it as data-ux on its part; a repeated id is kept on each screen, never rewritten', () => {
  const p = load(EVERY);
  const page = renderProposal(p, { letter: 'B' });
  assert.equal(count(page, '<p class="ux-status" data-ux="free-count">'), 2);
  assert.ok(frameOf(page, 'today').includes('<p class="ux-status" data-ux="free-count">2 rooms free now</p>'));
  assert.ok(frameOf(page, 'book').includes('<p class="ux-status" data-ux="free-count">Still free until 10:30</p>'));
  const ids = itemsOf(p).filter(i => i.id).map(i => i.id);
  assert.deepEqual([...page.matchAll(/ data-ux="([^"]*)"/g)].map(([, id]) => id), ids, 'every id, in order, as written');
  assert.doesNotMatch(page, /class="ux-(region|group|expansion|frame|screen|dialog)"[^>]*data-ux/, 'no container carries one');
});

test('a primary action is drawn with class "ux-action is-primary"; every other action, primary false included, as ux-action', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.ok(page.includes('<button class="ux-action is-primary" type="button" data-ux="book-room-2">Book Room 2</button>'));
  assert.ok(page.includes('<button class="ux-action is-primary" type="button">Book</button>'));
  assert.ok(page.includes('<button class="ux-action" type="button">Hold sala 3</button>'));
  assert.ok(page.includes('<button class="ux-action" type="button">Cancel</button>'));
  assert.equal(count(page, 'is-primary'), 2);
});

test('a screen is drawn in the contract markup: each role on its element, containers nested in order, labels, notes', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.equal(frameOf(page, 'today'), `<section class="ux-frame" data-screen="today">
  <header>
    <h2>Today, at 9:40</h2>
    <p class="ux-note">Open all day on the desk monitor.</p>
  </header>
  <div class="ux-screen">
    <nav class="ux-nav" data-ux="places">Where she can go
      <ul>
        <li>Today</li>
        <li>Rooms</li>
        <li>Settings</li>
      </ul>
    </nav>
    <h3 class="ux-heading">Rooms right now</h3>
    <p class="ux-status" data-ux="free-count">2 rooms free now</p>
    <section class="ux-region">
      <header>Ground floor</header>
      <div class="ux-group">
        <header>Room 2</header>
        <p class="ux-text">Free until 10:30</p>
        <button class="ux-action is-primary" type="button" data-ux="book-room-2">Book Room 2</button>
        <p class="ux-note">The only filled button on the screen.</p>
      </div>
      <div class="ux-group">
        <p class="ux-text">Reunión — sala 3 🙂</p>
        <button class="ux-action" type="button">Hold sala 3</button>
      </div>
    </section>
    <section class="ux-region">
      <div class="ux-list" data-ux="upstairs">Upstairs
        <ul>
          <li>Room 4 — free until 12:00</li>
          <li>Gym — out of service today</li>
        </ul>
      </div>
      <p class="ux-note">Soonest free first.</p>
      <div class="ux-media">Plan of the first floor, free rooms marked</div>
    </section>
    <details class="ux-expansion">
      <summary>Later today</summary>
      <p class="ux-text">Room 1 — free from 10:00</p>
    </details>
    <details class="ux-expansion">
      <summary>Closed rooms</summary>
      <p class="ux-text">The gym reopens tomorrow.</p>
    </details>
    <p class="ux-text">&lt;script&gt;alert(1)&lt;/script&gt;</p>
    <a class="ux-link" href="#">See the rest of the day</a>
  </div>
</section>
`);
});

test('a dialog is drawn in a frame of its own, as ux-dialog in place of ux-screen; the screen it opens over is not drawn again', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.equal(frameOf(page, 'book'), `<section class="ux-frame" data-screen="book">
  <header>
    <h2>Booking Room 2</h2>
  </header>
  <div class="ux-dialog">
    <h3 class="ux-heading">Book Room 2</h3>
    <p class="ux-status" data-ux="free-count">Still free until 10:30</p>
    <details class="ux-expansion" open>
      <summary>Patient</summary>
      <p class="ux-input" data-ux="patient-name">Patient name</p>
      <p class="ux-note">The cursor is already here.</p>
      <div class="ux-choice">How long?
        <ul>
          <li>15 min</li>
          <li>30 min</li>
        </ul>
      </div>
    </details>
    <button class="ux-action is-primary" type="button">Book</button>
    <button class="ux-action" type="button">Cancel</button>
  </div>
</section>
`);
  assert.equal(count(page, 'class="ux-screen"'), 1);
  assert.equal(count(page, 'class="ux-dialog"'), 1);
  assert.equal(count(page, '<h2>Today, at 9:40</h2>'), 1);
});

test('an item whose text is <script>alert(1)</script> is shown escaped, and no <script tag is in the page', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.ok(page.includes('<p class="ux-text">&lt;script&gt;alert(1)&lt;/script&gt;</p>'));
  assert.doesNotMatch(page, /<script/i);
});

test('every string of the proposal goes through one escape, in the header, the captions, the labels, the parts, the options and the notes', () => {
  // Each string becomes markup of its own, numbered; ids, roles and containers are kebab words and stay.
  const keep = new Set(['id', 'over', 'role', 'container', ...PROVENANCE]);
  let made = 0;
  const hostile = (value, key) => {
    if (typeof value === 'string') return keep.has(key) ? value : `<b title="x">'Tom & Jerry' "${++made}"</b>`;
    if (Array.isArray(value)) return value.map(v => hostile(v, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, hostile(v, k)]));
    return value;
  };
  const p = hostile(load(EVERY));
  assert.deepEqual(validate(p), []);
  const page = renderProposal(p, { letter: 'B' });
  const firstIdea = Number(p.firstIdea.match(/"(\d+)"/)[1]);
  for (let n = 1; n <= made; n++) {
    const escaped = `&lt;b title=&quot;x&quot;&gt;&#39;Tom &amp; Jerry&#39; &quot;${n}&quot;&lt;/b&gt;`;
    assert.equal(count(page, escaped), n === firstIdea ? 0 : 1, `string ${n}`);
  }
  assert.ok(made > 40, `${made} strings`);
  assert.doesNotMatch(page, /<b[\s>]|Tom & Jerry|'Tom|"\d+"/);
});

test('Reunión — sala 3 🙂 is drawn intact, and the page declares charset="utf-8"', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.ok(page.includes('<p class="ux-text">Reunión — sala 3 🙂</p>'));
  assert.ok(page.includes('<meta charset="utf-8">'));
  assert.doesNotMatch(page, /&#x?[0-9a-f]+;(?<!&#39;)/i, 'no character is written as a numeric reference but the apostrophe');
});

test('renderProposal refuses an invalid proposal with every error, and a letter that is not one capital letter', () => {
  const bad = load(EVERY);
  bad.screens[1].items[0].role = 'card';
  delete bad.bet;
  const errors = validate(bad);
  assert.equal(errors.length, 2);
  assert.throws(() => renderProposal(bad, { letter: 'A' }), e => e instanceof TypeError && e.message === `not a valid proposal:\n${errors.join('\n')}`);
  for (const letter of [undefined, '', 'b', 'AB', 'Á', '1', ['B'], 66]) {
    assert.throws(() => renderProposal(load(EVERY), { letter }), e => e instanceof TypeError && /one capital letter, A to Z/.test(e.message), String(letter));
  }
  assert.throws(() => renderProposal(load(EVERY)), /one capital letter/);
});

test('no product name appears in the render script or its fixture', () => {
  for (const file of [cli, fixturePath(EVERY)]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});

// ---- the command line

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
let made = 0;
const fresh = () => join(root, `run ${++made}`);
// A proposal written to a path with a space in it.
const writeProposal = (dir, proposal) => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'the proposal.json');
  writeFileSync(file, typeof proposal === 'string' ? proposal : JSON.stringify(proposal, null, 2));
  return file;
};
// A kit of its own, in a folder with a space, so a copy of the grey kit's stylesheet cannot pass for it.
const writeKit = dir => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'kit.css'), '/* a project kit: déjà vu 🙂 */\n.ux-frame { margin: 0; }\n');
  return dir;
};

test('the CLI draws a proposal, copies kit.css beside it, works in paths with spaces, and exits 0', () => {
  const dir = fresh();
  const input = writeProposal(join(dir, 'the proposals'), load(EVERY));
  const kit = writeKit(join(dir, 'my kit'));
  const out = join(dir, 'the board', 'not yet made', 'B.html');
  let r = run(input, '--kit', kit, '--out', out, '--letter', 'B');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([r.stdout, r.stderr], [`drew option B to ${out}, with kit.css beside it\n`, '']);
  assert.deepEqual(readFileSync(out), Buffer.from(renderProposal(load(EVERY), { letter: 'B' }), 'utf8'), 'the page, byte for byte');
  assert.deepEqual(readFileSync(join(dirname(out), 'kit.css')), readFileSync(join(kit, 'kit.css')), 'the kit given, byte for byte');
  assert.deepEqual(readdirSync(dirname(out)).sort(), ['B.html', 'kit.css']);
  // Drawn again, the same bytes; with --flag=value and no --letter, the letter is A.
  const again = join(dir, 'the board', 'not yet made', 'again.html');
  r = run(`--kit=${kit}`, `--out=${again}`, input, '--letter=B');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readFileSync(again), readFileSync(out));
  const lettered = join(dir, 'the board', 'A.html');
  r = run(input, '--kit', greyKit, '--out', lettered);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(lettered, 'utf8'), renderProposal(load(EVERY), { letter: 'A' }));
  assert.deepEqual(readFileSync(join(dir, 'the board', 'kit.css')), readFileSync(join(greyKit, 'kit.css')));
});

test('the CLI exits 1 on an invalid proposal, naming the path and printing every error on a line of its own, and writes nothing', () => {
  const dir = fresh();
  const bad = load(EVERY);
  bad.screens[1].items[0].role = 'card';
  bad.screens[0].over = 'book';
  delete bad.bet;
  const errors = validate(bad);
  assert.equal(errors.length, 3);
  const input = writeProposal(dir, bad);
  const out = join(dir, 'board', 'A.html');
  const r = run(input, '--kit', greyKit, '--out', out);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, `cannot draw ${input}: it is not a valid proposal\n${errors.join('\n')}\n`);
  assert.ok(!existsSync(join(dir, 'board')), 'nothing is written');
});

test('the CLI exits 1 on an unreadable input or an unwritable output, naming the path, and writes nothing', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const out = join(dir, 'board', 'A.html');
  const missing = join(dir, 'no such proposal.json');
  const notJson = writeProposal(join(dir, 'broken'), '{ "name": "half a proposal",');
  const emptyKit = join(dir, 'empty kit');
  mkdirSync(emptyKit);
  const cases = [
    [[missing, '--kit', greyKit, '--out', out], `cannot read ${missing}: ENOENT\n`],
    [[notJson, '--kit', greyKit, '--out', out], new RegExp(`^cannot read ${notJson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: it is not JSON \\(.+\\)\\n$`)],
    [[input, '--kit', emptyKit, '--out', out], `cannot read ${join(emptyKit, 'kit.css')}: ENOENT\n`],
  ];
  for (const [args, expected] of cases) {
    const r = run(...args);
    assert.equal(r.status, 1, args.join(' '));
    assert.equal(r.stdout, '');
    if (typeof expected === 'string') assert.equal(r.stderr, expected);
    else assert.match(r.stderr, expected);
    assert.ok(!existsSync(join(dir, 'board')), `${args[0]}: nothing is written`);
  }
  const folder = join(dir, 'a folder.html');
  mkdirSync(folder);
  const r = run(input, '--kit', greyKit, '--out', folder);
  assert.equal(r.status, 1);
  assert.equal(r.stderr, `cannot write ${folder}: EISDIR\n`);
  assert.ok(!existsSync(join(dir, 'kit.css')), 'the kit is not copied beside a page that was not written');
  // The page's folder cannot be made where a file stands.
  const file = join(dir, 'a file');
  writeFileSync(file, 'not a folder');
  const under = run(input, '--kit', greyKit, '--out', join(file, 'board', 'A.html'));
  assert.equal(under.status, 1);
  assert.equal(under.stderr, `cannot write ${join(file, 'board')}: ENOTDIR\n`);
});

test('the CLI prints an unexpected error with its stack and exits 1', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const preload = join(dir, 'explode.mjs');
  writeFileSync(preload, "process.stdout.write = () => { throw new Error('an unexpected failure'); };\n");
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, cli, input, '--kit', greyKit, '--out', join(dir, 'A.html')], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Error: an unexpected failure\n\s+at /);
});

test('the CLI exits 2 on bad usage, printing the usage, and writes nothing', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const out = join(dir, 'board', 'A.html');
  const usages = [
    [[], /render takes one <proposal.json>, got 0/],
    [[input, input, '--kit', greyKit, '--out', out], /render takes one <proposal.json>, got 2/],
    [[input, '--out', out], /--kit is missing/],
    [[input, '--kit', greyKit], /--out is missing/],
    [[input, '--kit', greyKit, '--out', out, '--colour', 'grey'], /unknown flag --colour/],
    [[input, '--kit', greyKit, '--out'], /--out needs a value/],
    [[input, '--kit', greyKit, '--out='], /--out needs a value/],
    [[input, '--kit', greyKit, '--kit', greyKit, '--out', out], /--kit is given twice/],
    [[input, '--kit', greyKit, '--out', out, '--letter', 'b'], /--letter must be one capital letter, A to Z; it is "b"/],
    [[input, '--kit', greyKit, '--out', out, '--letter', 'AB'], /--letter must be one capital letter, A to Z; it is "AB"/],
  ];
  for (const [args, pattern] of usages) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, pattern, args.join(' '));
    assert.match(r.stderr, /\n\nUsage: node scripts\/render\.mjs /, args.join(' '));
    assert.ok(!existsSync(join(dir, 'board')), `${args.join(' ')}: nothing is written`);
  }
});

test('the CLI --help prints the usage, naming every flag and the exit codes, and exits 0', () => {
  for (const args of [['--help'], ['-h'], ['p.json', '--help']]) {
    const r = run(...args);
    assert.equal(r.status, 0, args.join(' '));
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /^Usage: node scripts\/render\.mjs <proposal\.json> --kit <kit dir> --out <file\.html> \[--letter A\]\n/);
    for (const word of ['--kit', '--out', '--letter', 'kit.css', 'A when not given', '--flag=value', '0 success', '1 an invalid proposal', '2 bad usage']) {
      assert.ok(r.stdout.includes(word), word);
    }
  }
});
