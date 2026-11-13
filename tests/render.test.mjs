import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, CONTAINERS, validate } from '../scripts/lib/walkthrough.mjs';
import { renderProposal } from '../scripts/render.mjs';
import { mergeProposals } from '../scripts/lib/merge.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'render.mjs');
const greyKit = join(here, '..', 'kit', 'grey');
const contractPath = join(here, '..', 'kit', 'KIT-CONTRACT.md');
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
// Where the script itself writes, apart from the maker's words: the head, the page's header and every tag
// (element names and attributes). A maker's text may well say "track" or "source"; the script never does.
const scaffolding = page => [page.match(/<head>[\s\S]*?<\/head>/)[0], headerOf(page), ...[...page.matchAll(/<[^>]*>/g)].map(([tag]) => tag)].join('\n');
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
    assert.doesNotMatch(scaffolding(page), /first ?idea/i, name);
  }
});

for (const key of PROVENANCE) {
  test(`who made a proposal is never drawn: not the key ${key}, not its value`, () => {
    for (const name of ALL) {
      const p = load(name);
      const page = renderProposal(p, { letter: 'A' });
      assert.equal(count(page, '<section class="ux-frame"'), p.screens.length, `${name}: the page is drawn`);
      assert.doesNotMatch(scaffolding(page), new RegExp(`\\b${key}\\b`, 'i'), `${name}: the key ${key}`);
      if (Object.hasOwn(p, key)) assert.ok(!scaffolding(page).includes(p[key]), `${name}: the value of ${key}, ${p[key]}`);
    }
    assert.ok(Object.hasOwn(load(EVERY), key), `the render fixture carries ${key}`);
    // The maker may use the word: only what the script writes is held to it. That the drawing does not
    // depend on who made the proposal is the byte comparison below.
    const said = load(EVERY);
    said.screens[0].items[1].text = `${key} changes`;
    const page = renderProposal(said, { letter: 'A' });
    assert.ok(page.includes(`<h3 class="ux-heading">${key} changes</h3>`));
    assert.doesNotMatch(scaffolding(page), new RegExp(`\\b${key}\\b`, 'i'));
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
    <p class="ux-over">opens over Today, at 9:40</p>
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

test("a dialog's caption names the screen it opens over by that screen's title, after its own title; a screen's names none", () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    const titles = new Map(p.screens.map(s => [s.id, s.title]));
    for (const screen of p.screens) {
      const frame = frameOf(page, screen.id);
      if (screen.container === 'dialog') {
        assert.ok(frame.includes(`    <h2>${screen.title}</h2>\n    <p class="ux-over">opens over ${titles.get(screen.over)}</p>\n`), `${name}: ${screen.id}`);
      } else {
        assert.ok(!frame.includes('ux-over'), `${name}: ${screen.id} opens over nothing`);
      }
    }
    assert.equal(count(page, 'class="ux-over"'), p.screens.filter(s => s.container === 'dialog').length, name);
  }
  // A dialog written before its screen still names it; the line comes before the dialog's own note.
  const p = load(EVERY);
  p.screens.reverse();
  p.screens[0].note = 'Opens on Book Room 2.';
  assert.deepEqual(validate(p), []);
  assert.ok(frameOf(renderProposal(p, { letter: 'A' }), 'book').startsWith(`<section class="ux-frame" data-screen="book">
  <header>
    <h2>Booking Room 2</h2>
    <p class="ux-over">opens over Today, at 9:40</p>
    <p class="ux-note">Opens on Book Room 2.</p>
  </header>
  <div class="ux-dialog">
`));
});

test('a dialog over a screen whose title holds markup names that title escaped', () => {
  const p = load(EVERY);
  p.screens[0].title = 'Today <b>at 9:40</b> & "after"';
  const page = renderProposal(p, { letter: 'A' });
  assert.ok(frameOf(page, 'book').includes('<p class="ux-over">opens over Today &lt;b&gt;at 9:40&lt;/b&gt; &amp; &quot;after&quot;</p>'));
  assert.doesNotMatch(page, /<b>/);
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
  const numberOf = text => Number(text.match(/"(\d+)"/)[1]);
  // The first idea is never drawn; the title of the screen the dialog opens over is drawn twice.
  const firstIdea = numberOf(p.firstIdea);
  const over = numberOf(p.screens.find(s => s.id === p.screens[1].over).title);
  for (let n = 1; n <= made; n++) {
    const escaped = `&lt;b title=&quot;x&quot;&gt;&#39;Tom &amp; Jerry&#39; &quot;${n}&quot;&lt;/b&gt;`;
    assert.equal(count(page, escaped), n === firstIdea ? 0 : n === over ? 2 : 1, `string ${n}`);
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

// The whole page, byte for byte. To change it on purpose, draw it again and read the diff before committing:
//   node -e "import('./scripts/render.mjs').then(({ renderProposal }) => process.stdout.write(renderProposal(JSON.parse(require('fs').readFileSync('tests/fixtures/render/every-part.json', 'utf8')), { letter: 'D' })))" > tests/fixtures/render/every-part.D.html
test('the render fixture drawn as option D is, byte for byte, the committed page every-part.D.html', () => {
  assert.equal(renderProposal(load(EVERY), { letter: 'D' }), readFileSync(fixturePath('render/every-part.D.html'), 'utf8'));
});

test('the kit contract states what the drawing relies on: the page header, the board\'s own words, ids per frame, the stylesheet set', () => {
  const contract = readFileSync(contractPath, 'utf8');
  // A section of the contract, its lines joined: the prose wraps anywhere.
  const flat = text => text.replace(/\s+/g, ' ');
  const section = title => flat(contract.slice(contract.indexOf(`## ${title}\n`), contract.indexOf('\n## ', contract.indexOf(`## ${title}\n`) + 1)));
  const page = renderProposal(load(EVERY), { letter: 'B' });
  // Every element of the page's header is named in "The document", which says no kit styles it.
  const document = section('The document');
  const elements = new Set([...headerOf(page).matchAll(/<([a-z][a-z0-9]*)\b/g)].map(([, tag]) => tag));
  assert.deepEqual([...elements].sort(), ['dd', 'dl', 'dt', 'h1', 'header', 'li', 'ul']);
  for (const tag of elements) assert.ok(document.includes(`\`<${tag}>\``), `the contract names <${tag}> of the page header`);
  assert.match(document, /no kit styles it/);
  // The stylesheet set: kit.css is linked, may import the others, and all of them travel together.
  assert.match(document, /A kit may hold more than one stylesheet\. `kit\.css` is the one the document links, and it may import the others by relative name/);
  assert.match(document, /copies every stylesheet found directly in the kit's folder beside the document, so they all travel together/);
  // The only words of the board inside a frame are the ones before a title in ux-over.
  const board = page.match(/<p class="ux-over">(opens over )/)[1];
  const markup = section('The markup');
  assert.ok(markup.includes(`\`${board}\``), 'the contract quotes the words the board writes');
  assert.doesNotMatch(markup, /Every string in it is the proposal's own words\./);
  // A data-ux repeats across frames: a part is found by its frame and its id together.
  const ids = section('The markup');
  assert.match(ids, /unique within its screen only, so the same `data-ux` may appear in two frames/);
  assert.match(ids, /found by its frame's `data-screen` and its own `data-ux` together/);
});

test('no product name appears in the render script or its fixture', () => {
  for (const file of [cli, fixturePath(EVERY), fixturePath('render/every-part.D.html')]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});

// ---- the command line

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
// The command run from another folder, with a module required before it (a CommonJS file, so that this
// needs nothing newer than the Node 20 the package names).
const runWith = ({ cwd, preload, env }, ...args) =>
  spawnSync(process.execPath, [...(preload ? ['--require', preload] : []), cli, ...args], { encoding: 'utf8', cwd, env: { ...process.env, ...env } });
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

test('the CLI reads a proposal file that starts with a byte-order mark, and strips only that one', () => {
  const dir = fresh();
  const json = JSON.stringify(load(EVERY), null, 2);
  const marked = writeProposal(join(dir, 'marked'), `\uFEFF${json}`);
  assert.deepEqual([...readFileSync(marked).subarray(0, 3)], [0xef, 0xbb, 0xbf], 'the file starts with the UTF-8 byte-order mark');
  const out = join(dir, 'board', 'B.html');
  let r = run(marked, '--kit', greyKit, '--out', out, '--letter', 'B');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readFileSync(out), Buffer.from(renderProposal(load(EVERY), { letter: 'B' }), 'utf8'));
  // A second mark, or a mark anywhere but first, is not a byte-order mark: the file is not JSON.
  for (const [folder, text] of [['twice', `\uFEFF\uFEFF${json}`], ['inside', `{\uFEFF${json.slice(1)}`]]) {
    const file = writeProposal(join(dir, folder), text);
    r = run(file, '--kit', greyKit, '--out', join(dir, folder, 'A.html'));
    assert.equal(r.status, 1, folder);
    assert.match(r.stderr, /: it is not JSON \(/, folder);
  }
});

test('the CLI copies every stylesheet directly in the kit folder beside the page, byte for byte, and nothing else', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const kit = join(dir, 'project kit');
  mkdirSync(join(kit, 'nested'), { recursive: true });
  mkdirSync(join(kit, 'folder.css'));
  writeFileSync(join(kit, 'kit.css'), '@import "Tokens.css";\n.ux-frame { color: var(--ux-ink); }\n');
  writeFileSync(join(kit, 'Tokens.css'), ':root { --ux-ink: #111111; } /* the project\'s token file */\n');
  writeFileSync(join(kit, 'notes.txt'), 'not a stylesheet\n');
  writeFileSync(join(kit, 'nested', 'deep.css'), '.ux-note { margin: 0; }\n');
  const out = join(dir, 'board', 'B.html');
  let r = run(input, '--kit', kit, '--out', out, '--letter', 'B');
  assert.equal(r.status, 0, r.stderr);
  // Named in the order of their names, whatever order the folder lists them in.
  assert.equal(r.stdout, `drew option B to ${out}, with Tokens.css, kit.css beside it\n`);
  assert.deepEqual(readdirSync(join(dir, 'board')).sort(), ['B.html', 'Tokens.css', 'kit.css']);
  for (const name of ['kit.css', 'Tokens.css']) assert.deepEqual(readFileSync(join(dir, 'board', name)), readFileSync(join(kit, name)), name);
  // Node lists a folder in name order on Linux but in the file system's order on Windows: the same line,
  // whichever order the folder is listed in.
  const reverse = join(dir, 'reverse.cjs');
  writeFileSync(reverse, [
    "const fs = require('node:fs');",
    "const { syncBuiltinESMExports } = require('node:module');",
    'const list = fs.readdirSync;',
    'fs.readdirSync = (...args) => list(...args).reverse();',
    'syncBuiltinESMExports();',
  ].join('\n'));
  r = runWith({ preload: reverse }, input, '--kit', kit, '--out', join(dir, 'reversed', 'B.html'), '--letter', 'B');
  assert.equal(r.stdout, `drew option B to ${join(dir, 'reversed', 'B.html')}, with Tokens.css, kit.css beside it\n`);
  // A page named like any stylesheet of the kit would be overwritten by it, whatever the case of its name.
  for (const name of ['Tokens.css', 'tokens.CSS', 'kit.css']) {
    r = run(input, '--kit', kit, '--out', join(dir, 'other', name));
    assert.equal(r.status, 2, name);
    assert.match(r.stderr, new RegExp(`^--out cannot be named ${name.replace('.', '\\.')}: the kit's stylesheet (Tokens|kit)\\.css is copied there, beside the page\\n\\nUsage:`), name);
  }
  assert.ok(!existsSync(join(dir, 'other')), 'nothing is written');
  // A kit without kit.css is no kit, whatever else it holds.
  const tokensOnly = join(dir, 'tokens only');
  mkdirSync(tokensOnly);
  writeFileSync(join(tokensOnly, 'Tokens.css'), ':root {}\n');
  r = run(input, '--kit', tokensOnly, '--out', join(dir, 'other', 'A.html'));
  assert.deepEqual([r.status, r.stderr], [1, `cannot read ${join(tokensOnly, 'kit.css')}: not found\n`]);
  assert.ok(!existsSync(join(dir, 'other')), 'nothing is written');
});

test('the CLI refuses a proposal file that is not UTF-8 (exit 1), and writes nothing', () => {
  const dir = fresh();
  // "Reunión" saved as Windows-1252: the ó is the single byte F3.
  const [before, after] = JSON.stringify(load(EVERY), null, 2).split('Reunión');
  const file = join(dir, 'latin.json');
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, Buffer.concat([Buffer.from(`${before}Reuni`), Buffer.from([0xf3]), Buffer.from(`n${after}`)]));
  const r = run(file, '--kit', greyKit, '--out', join(dir, 'board', 'A.html'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${file}: it is not UTF-8\n`]);
  assert.ok(!existsSync(join(dir, 'board')), 'nothing is written');
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
  const noKit = join(dir, 'no such kit');
  // Any other failure keeps the system's own words: a name longer than a file system allows.
  const long = join(dir, `${'n'.repeat(300)}.json`);
  const cases = [
    [[missing, '--kit', greyKit, '--out', out], `cannot read ${missing}: not found\n`],
    [[dir, '--kit', greyKit, '--out', out], `cannot read ${dir}: it is a folder, not a file\n`],
    [[join(input, 'x.json'), '--kit', greyKit, '--out', out], `cannot read ${join(input, 'x.json')}: part of the path is a file, not a folder\n`],
    [[long, '--kit', greyKit, '--out', out], `cannot read ${long}: ENAMETOOLONG: name too long, open '${long}'\n`],
    [[notJson, '--kit', greyKit, '--out', out], new RegExp(`^cannot read ${notJson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: it is not JSON \\(.+\\)\\n$`)],
    [[input, '--kit', emptyKit, '--out', out], `cannot read ${join(emptyKit, 'kit.css')}: not found\n`],
    [[input, '--kit', noKit, '--out', out], `cannot read ${noKit}: not found\n`],
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
  assert.equal(r.stderr, `cannot write ${folder}: it is a folder, not a file\n`);
  assert.ok(!existsSync(join(dir, 'kit.css')), 'the kit is not copied beside a page that was not written');
  // The page's folder cannot be made where a file stands.
  const file = join(dir, 'a file');
  writeFileSync(file, 'not a folder');
  const under = run(input, '--kit', greyKit, '--out', join(file, 'board', 'A.html'));
  assert.equal(under.status, 1);
  assert.equal(under.stderr, `cannot write ${join(file, 'board')}: part of the path is a file, not a folder\n`);
});

test('the CLI says "no permission" for a file it may not read, and nothing is written', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  // This file system grants every permission, so the refusal is made by hand, on the kit's stylesheet.
  const preload = join(dir, 'refuse.cjs');
  writeFileSync(preload, [
    "const fs = require('node:fs');",
    "const { syncBuiltinESMExports } = require('node:module');",
    'const read = fs.readFileSync;',
    'const code = process.env.REFUSE_WITH;',
    "fs.readFileSync = (file, ...rest) => { if (String(file).endsWith('kit.css')) throw Object.assign(new Error(`${code}: refused, open '${file}'`), { code }); return read(file, ...rest); };",
    'syncBuiltinESMExports();',
  ].join('\n'));
  for (const [code, words] of [['EACCES', 'no permission'], ['EPERM', 'no permission'], ['EIO', `EIO: refused, open '${join(greyKit, 'kit.css')}'`]]) {
    const r = runWith({ preload, env: { REFUSE_WITH: code } }, input, '--kit', greyKit, '--out', join(dir, 'board', 'A.html'));
    assert.deepEqual([r.status, r.stderr], [1, `cannot read ${join(greyKit, 'kit.css')}: ${words}\n`], code);
    assert.ok(!existsSync(join(dir, 'board')), `${code}: nothing is written`);
  }
});

test('the CLI prints an unexpected error with its stack and exits 1', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const preload = join(dir, 'explode.cjs');
  writeFileSync(preload, "process.stdout.write = () => { throw new Error('an unexpected failure'); };\n");
  const r = runWith({ preload }, input, '--kit', greyKit, '--out', join(dir, 'A.html'));
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
    // The kit is copied beside the page as kit.css, so a page of that name would be overwritten; in any case,
    // since a file system may not tell Kit.CSS from kit.css.
    [[input, '--kit', greyKit, '--out', join(dir, 'board', 'kit.css')], /^--out cannot be named kit\.css: the kit's stylesheet kit\.css is copied there, beside the page\n/],
    [[input, '--kit', greyKit, `--out=${join(dir, 'board', 'Kit.CSS')}`], /^--out cannot be named Kit\.CSS: the kit's stylesheet kit\.css is copied there/],
    // A flag never takes the next flag as its value.
    [[input, '--kit', greyKit, '--out', '--help'], /^--out needs a value; "--help" is a flag\n/],
    [[input, '--kit', greyKit, '--out', '-h'], /^--out needs a value; "-h" is a flag\n/],
    [[input, '--kit', '--out', out], /^--kit needs a value; "--out" is a flag\n/],
    [[input, '--kit', greyKit, '--out', out, '--letter', '--kit'], /^--letter needs a value; "--kit" is a flag\n/],
  ];
  for (const [args, pattern] of usages) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, pattern, args.join(' '));
    assert.match(r.stderr, /\n\nUsage: node scripts\/render\.mjs /, args.join(' '));
    assert.ok(!existsSync(join(dir, 'board')), `${args.join(' ')}: nothing is written`);
    assert.deepEqual(readdirSync(dir).sort(), ['the proposal.json'], `${args.join(' ')}: no page beside the proposal`);
  }
});

test('the CLI refuses to draw over the proposal itself (exit 2), however the path is written, and leaves it unchanged', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(EVERY));
  const before = readFileSync(input);
  const linked = join(dir, 'the same proposal.json');
  linkSync(input, linked);
  for (const [cwd, out] of [[undefined, input], [dir, 'the proposal.json'], [dir, './the proposal.json'], [undefined, linked]]) {
    const r = runWith({ cwd }, input, '--kit', greyKit, '--out', out);
    assert.equal(r.status, 2, `${out}: ${r.stderr}`);
    assert.match(r.stderr, /^--out is the proposal itself: drawing would overwrite it\n\nUsage:/, out);
    assert.deepEqual(readFileSync(input), before, `${out}: the proposal is unchanged`);
  }
  assert.deepEqual(readdirSync(dir).sort(), ['the proposal.json', 'the same proposal.json'], 'no kit.css is copied beside it');
});

test('the CLI --help prints the usage, naming every flag and the exit codes, and exits 0', () => {
  for (const args of [['--help'], ['-h'], ['p.json', '--help']]) {
    const r = run(...args);
    assert.equal(r.status, 0, args.join(' '));
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /^Usage: node scripts\/render\.mjs <proposal\.json> --kit <kit dir> --out <file\.html> \[--letter A\]\n/);
    for (const word of ['--kit', '--out', '--letter', 'kit.css', 'every stylesheet', 'not named like one of the kit\'s stylesheets', 'not the proposal itself', 'A when not given', '--flag=value', '0 success', '1 an invalid proposal', '2 bad usage']) {
      assert.ok(r.stdout.includes(word), word);
    }
  }
});

// ---- a letter copy

test('a letter copy written by the merge draws, and its page is its source\'s page, byte for byte, under the same letter', () => {
  const dir = fresh();
  const proposals = join(dir, 'the proposals');
  mkdirSync(proposals, { recursive: true });
  for (const name of ALL) copyFileSync(fixturePath(name), join(proposals, basename(name)));
  const board = join(dir, 'the board');
  mergeProposals(proposals, board, { seed: 1 });
  const map = JSON.parse(readFileSync(join(board, 'MAP.sealed.json'), 'utf8'));
  assert.equal(Object.keys(map).length, ALL.length);
  for (const [letter, { file }] of Object.entries(map)) {
    const copyFile = join(board, `${letter}.json`);
    const copy = JSON.parse(readFileSync(copyFile, 'utf8'));
    assert.ok(!Object.hasOwn(copy, 'firstIdea'), `${letter}: a letter copy, without firstIdea`);
    const page = renderProposal(JSON.parse(readFileSync(join(proposals, file), 'utf8')), { letter });
    assert.equal(renderProposal(copy, { letter }), page, `${letter} (${file}): the same page`);
    // By the command too, from the letter's file.
    const out = join(dir, 'pages', `${letter}.html`);
    const r = run(copyFile, '--kit', greyKit, '--out', out, '--letter', letter);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(out, 'utf8'), page, `${letter}: the same page by the command`);
  }
  // Without firstIdea a proposal is read in the sealed form: it may not say who made it.
  const signed = { ...JSON.parse(readFileSync(join(board, 'A.json'), 'utf8')), engine: 'claude' };
  const stays = 'not a valid proposal:\nproposal: "engine" stays in the source file; a letter copy does not carry it';
  assert.throws(() => renderProposal(signed, { letter: 'A' }), e => e instanceof TypeError && e.message === stays);
  // Anything that is not an object is still refused as one, whichever form is asked of it.
  for (const value of [null, undefined, 'a proposal', 7, []]) {
    assert.throws(() => renderProposal(value, { letter: 'A' }), e => e instanceof TypeError && e.message === 'not a valid proposal:\nproposal: must be an object', String(value));
  }
});
