import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, CONTAINERS, PLACES, validate } from '../scripts/lib/walkthrough.mjs';
import { AREA_CLASSES, renderProposal } from '../scripts/render.mjs';
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
// The kit's sample: three screens and a dialog, each screen placing its regions in the page's areas.
const PLACED = 'render/front-desk.json';
const PROPOSALS = ['unified-list', 'free-first', 'calendar'].map(name => `proposals/${name}.json`);
const ALL = [EVERY, ...PROPOSALS, PLACED];
const PROVENANCE = ['author', 'engine', 'track', 'model', 'source'];

const count = (text, part) => text.split(part).length - 1;
// A frame runs from its opening tag to the first `</section>` at the start of a line: a region inside it
// closes indented.
const frameOf = (page, id) => page.match(new RegExp(`<section class="ux-frame" data-screen="${id}">\\n[\\s\\S]*?\\n</section>\\n`))?.[0];
// The page's title, which opens the body; the overview, which follows it; the proposal's own account, which
// closes the body when it is drawn at all.
const headerOf = page => page.match(/<body>\n\n(<header class="ux-option">\n[\s\S]*?\n<\/header>\n)/)?.[1];
const overviewOf = page => page.match(/\n(<section class="ux-overview">\n[\s\S]*?\n<\/section>\n)/)?.[1];
const accountOf = page => page.match(/\n(<section class="ux-account">\n[\s\S]*?\n<\/section>\n)\n<\/body>/)?.[1];
// Where the script itself writes, apart from the maker's words in the parts: the head, the page's title, the
// proposal's own account and every tag (element names and attributes). A maker's text may well say "track"
// or "source"; the script never does.
const scaffolding = page => [page.match(/<head>[\s\S]*?<\/head>/)[0], headerOf(page), accountOf(page), ...[...page.matchAll(/<[^>]*>/g)].map(([tag]) => tag)].join('\n');
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
  // It places no region: it is drawn as one column, as every proposal was before a region could say where it is.
  assert.ok(items.every(i => !Object.hasOwn(i, 'place')));
});

test('the sample fixture is valid: three screens and a dialog, every screen placing its regions, the four areas on one of them', () => {
  const p = load(PLACED);
  assert.deepEqual(validate(p), []);
  assert.deepEqual(p.screens.map(s => s.container).sort(), ['dialog', 'screen', 'screen', 'screen']);
  const placesOf = screen => screen.items.map(item => item.place);
  for (const screen of p.screens.filter(s => s.container === 'screen')) {
    assert.ok(screen.items.every(item => item.container === 'region' && PLACES.includes(item.place)), screen.id);
    assert.ok(placesOf(screen).includes('main') && placesOf(screen).includes('navigation'), screen.id);
  }
  assert.ok(p.screens.some(screen => PLACES.every(place => placesOf(screen).includes(place))), 'one screen has all four');
  assert.ok(p.screens.some(screen => screen.container === 'screen' && !placesOf(screen).includes('beside')), 'and one has no beside');
  const roles = new Set(itemsOf(p).filter(i => i.role).map(i => i.role));
  assert.deepEqual([...roles].sort(), [...ROLES].sort(), 'every role is in it');
  assert.ok(itemsOf(p).some(i => i.note) && p.screens.some(s => s.note), 'notes, on a screen and on an item');
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

// R196 of the board change: the page is drawn as a product. The option's title, then the overview, then the screens,
// and the proposal's own account last, under its own heading: never above the drawing.
test('the page opens with the option\'s title alone: its letter and its name', () => {
  const p = load(EVERY);
  const page = renderProposal(p, { letter: 'B' });
  assert.equal(headerOf(page), `<header class="ux-option">
  <h1>Option B: Floors, free first</h1>
</header>
`);
  assert.equal(count(page, 'Option B'), 2, 'in the document\'s title and in the page\'s');
  assert.match(headerOf(renderProposal(load(PROPOSALS[1]), { letter: 'C' })), /<h1>Option C: Free rooms first<\/h1>/);
});

test('the page is drawn in order: the title, the overview, the screens, and the proposal\'s own account last', () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    const places = [headerOf(page), overviewOf(page), ...p.screens.map(screen => frameOf(page, screen.id)), accountOf(page)];
    assert.ok(places.every(Boolean), `${name}: each is drawn`);
    const at = places.map(part => page.indexOf(part));
    assert.deepEqual(at, [...at].sort((a, b) => a - b), `${name}: in that order`);
    // Nothing else is in the body: the parts, each after one empty line.
    assert.equal(page.slice(page.indexOf('<body>'), page.indexOf('</body>')), `<body>\n\n${places.join('\n')}\n`, name);
    for (const part of ['class="ux-option"', 'class="ux-overview"', 'class="ux-account"', '<h1>']) assert.equal(count(page, part), 1, `${name}: ${part}`);
  }
});

// R202 of the board change: the page drawn without the proposal's own account is the audience's. She is handed
// pictures of screens and nothing that says how a design is laid out as a whole, and "without scrolling" is answered
// on its first-screen picture, which must begin with the first window.
test('without the proposal\'s own account the page is its title and its screens, and nothing else: no overview, and the first screen follows the title', () => {
  for (const name of ALL) {
    const p = load(name);
    const bare = renderProposal(p, { letter: 'A', notes: false });
    const places = [headerOf(bare), ...p.screens.map(screen => frameOf(bare, screen.id))];
    assert.ok(places.every(Boolean), `${name}: each is drawn`);
    assert.equal(bare.slice(bare.indexOf('<body>'), bare.indexOf('</body>')), `<body>\n\n${places.join('\n')}\n`, `${name}: the title, then each screen, each after one empty line`);
    assert.equal(overviewOf(bare), undefined, `${name}: no overview`);
    assert.doesNotMatch(bare, /ux-overview|ux-account|<ol>|<dl>|<dt>|<dd>|<b>/, `${name}: nothing of the overview's or the account's markup`);
    assert.ok(bare.includes(`</header>\n\n<section class="ux-frame" data-screen="${p.screens[0].id}">`), `${name}: the first screen follows the title`);
    // And the page that carries the account keeps its overview, between the title and the first screen.
    const full = renderProposal(p, { letter: 'A' });
    assert.ok(full.includes('</header>\n\n<section class="ux-overview">') && full.includes(`</section>\n\n<section class="ux-frame" data-screen="${p.screens[0].id}">`), name);
  }
});

test('the proposal\'s own account closes the page under its own heading: the bet, the cost, what is absent and the hardest state, each once', () => {
  const p = load(EVERY);
  const page = renderProposal(p, { letter: 'B' });
  assert.equal(accountOf(page), `<section class="ux-account">
  <h2>Its own account</h2>
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
</section>
`);
  for (const text of [p.name, p.bet, p.cost, ...p.absent, p.hardest]) assert.equal(count(page, text), 1, text);
  assert.ok(page.endsWith(`${accountOf(page)}\n</body>\n</html>\n`), 'nothing is drawn after it');
  // The real fixtures too: their words reach the account, escaped the same way.
  assert.ok(accountOf(renderProposal(load(PROPOSALS[1]), { letter: 'C' })).includes('<li>A &quot;show free rooms&quot; filter: the screen does the filtering</li>'));
});

// The overview: every screen of the proposal at a glance, drawn from the proposal alone.
test('the overview names every screen once, its areas in the format\'s order with what each holds in a line, and a dialog under the screen it opens over', () => {
  const p = load(PLACED);
  const page = renderProposal(p, { letter: 'A' });
  const overview = overviewOf(page);
  assert.ok(overview.startsWith(`<section class="ux-overview">
  <ol>
    <li>
      <b>Today, at 9:40</b>
      <dl>
        <dt>navigation</dt>
        <dd>Front desk · Today, Rooms, Bookings, Settings · Help</dd>
        <dt>bar</dt>
        <dd>Find a patient or a room · Updated 9:40 · Book a walk-in</dd>
        <dt>main</dt>
        <dd>Rooms right now · 2 rooms free now · Free now · Busy, being cleaned or closed</dd>
        <dt>beside</dt>
        <dd>Next to arrive · Booked for the next hour · See all of today&#39;s bookings</dd>
      </dl>
      <ol>
        <li>
          <b>Booking Room 2</b>
          <dl>
            <dt>dialog</dt>
            <dd>Room 2 — free until 10:30 · Patient name · How long? · Book · Cancel</dd>
          </dl>
        </li>
      </ol>
    </li>
    <li>
      <b>Rooms</b>
      <dl>
        <dt>navigation</dt>
`), overview);
  assert.ok(overview.endsWith(`    <li>
      <b>Bookings</b>
      <dl>
        <dt>navigation</dt>
        <dd>Front desk · Today, Rooms, Bookings, Settings · Help</dd>
        <dt>bar</dt>
        <dd>Find a patient or a room · Updated 9:40 · Book a walk-in</dd>
        <dt>main</dt>
        <dd>Today&#39;s bookings · 11 bookings, 3 still to arrive · Still to arrive · Already here or gone (8) · Move a booking</dd>
      </dl>
    </li>
  </ol>
</section>
`), overview);
  // Every screen and dialog once, by its title; a screen in the walkthrough's order, a dialog under its screen.
  assert.deepEqual([...overview.matchAll(/<b>([^<]*)<\/b>/g)].map(([, title]) => title), ['Today, at 9:40', 'Booking Room 2', 'Rooms', 'Bookings']);
  for (const name of ALL) {
    const q = load(name);
    const drawn = overviewOf(renderProposal(q, { letter: 'A' }));
    assert.equal(count(drawn, '<b>'), q.screens.length, name);
    assert.equal(count(drawn, '<dt>dialog</dt>'), q.screens.filter(s => s.container === 'dialog').length, name);
    assert.equal(count(drawn, '\n    <li>\n'), q.screens.filter(s => s.container === 'screen').length, `${name}: a screen is an entry of the overview itself`);
    // The areas are named in the format's own words and in its order, whatever order the maker wrote them in.
    const words = [...drawn.matchAll(/<dt>([^<]*)<\/dt>/g)].map(([, word]) => word);
    assert.deepEqual(words.filter(word => ![...PLACES, 'screen', 'dialog'].includes(word)), [], name);
  }
});

test('the overview says the areas in the format\'s order whatever order they are written in, and what an area holds from its own parts', () => {
  const p = load(PLACED);
  p.screens[0].items.reverse();
  assert.deepEqual(validate(p), []);
  const overview = overviewOf(renderProposal(p, { letter: 'A' }));
  assert.deepEqual([...overview.slice(0, overview.indexOf('<ol>', overview.indexOf('<ol>') + 1)).matchAll(/<dt>([^<]*)<\/dt>/g)].map(([, word]) => word), PLACES);
  assert.equal(overview, overviewOf(renderProposal(load(PLACED), { letter: 'A' })), 'the same overview');
  // A line is the area's label, then the words of each part directly in it: a nav by its places, a container by its
  // label, and one without a label by what it holds.
  const q = load(PLACED);
  q.screens[0].items = [{ container: 'region', place: 'main', label: 'Rooms', items: [
    { role: 'nav', text: 'Floors', options: ['Ground floor', 'Upstairs'] },
    { container: 'group', items: [{ role: 'text', text: 'Free until 10:30' }, { container: 'expansion', label: 'Later today', items: [{ role: 'text', text: 'Never said' }] }] },
    { container: 'region', label: 'Not free', items: [{ role: 'text', text: 'Never said either' }] },
    { role: 'choice', text: 'How long?', options: ['15 min', '30 min'] },
  ] }];
  assert.deepEqual(validate(q), []);
  assert.ok(overviewOf(renderProposal(q, { letter: 'A' })).includes('        <dt>main</dt>\n        <dd>Rooms · Ground floor, Upstairs · Free until 10:30 · Later today · Not free · How long?</dd>\n'));
});

test('a screen that places no region is one entry of the overview with one line, named by its container; a dialog written first still sits under its screen', () => {
  const p = load(EVERY);
  const expected = `<section class="ux-overview">
  <ol>
    <li>
      <b>Today, at 9:40</b>
      <dl>
        <dt>screen</dt>
        <dd>Today, Rooms, Settings · Rooms right now · 2 rooms free now · Ground floor · Upstairs · Plan of the first floor, free rooms marked · Later today · Closed rooms · &lt;script&gt;alert(1)&lt;/script&gt; · See the rest of the day</dd>
      </dl>
      <ol>
        <li>
          <b>Booking Room 2</b>
          <dl>
            <dt>dialog</dt>
            <dd>Book Room 2 · Still free until 10:30 · Patient · Book · Cancel</dd>
          </dl>
        </li>
      </ol>
    </li>
  </ol>
</section>
`;
  assert.equal(overviewOf(renderProposal(p, { letter: 'B' })), expected);
  p.screens.reverse();
  assert.equal(overviewOf(renderProposal(p, { letter: 'B' })), expected, 'the dialog written before its screen');
  // Two dialogs over one screen follow it in the order written; a screen with none has no list under it.
  const two = load(EVERY);
  two.screens.push({ id: 'cancel', title: 'Cancelling a booking', container: 'dialog', over: 'today', items: [{ role: 'text', text: 'Cancel it?' }] }, { id: 'rooms', title: 'Rooms', container: 'screen', items: [{ role: 'text', text: 'Every room' }] });
  const overview = overviewOf(renderProposal(two, { letter: 'B' }));
  assert.deepEqual([...overview.matchAll(/<b>([^<]*)<\/b>/g)].map(([, title]) => title), ['Today, at 9:40', 'Booking Room 2', 'Cancelling a booking', 'Rooms']);
  assert.equal(count(overview, '<ol>'), 2, 'the overview, and one list of dialogs');
  assert.ok(overview.endsWith('    <li>\n      <b>Rooms</b>\n      <dl>\n        <dt>screen</dt>\n        <dd>Every room</dd>\n      </dl>\n    </li>\n  </ol>\n</section>\n'));
});

test('the overview is drawn from the proposal alone: it carries no id of the frames, no note, and nothing of the proposal\'s own account', () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    const overview = overviewOf(page);
    assert.doesNotMatch(overview, /data-ux|data-screen|\sid=|href=|class="(?!ux-overview")/, `${name}: one class, and no attribute a part is found by`);
    // So every data-screen is on one frame, and every data-ux on one part of its frame.
    const screens = [...page.matchAll(/ data-screen="([^"]*)"/g)].map(([, id]) => id);
    assert.deepEqual(screens, p.screens.map(screen => screen.id), `${name}: one data-screen per screen`);
    for (const screen of p.screens) {
      const ids = [...frameOf(page, screen.id).matchAll(/ data-ux="([^"]*)"/g)].map(([, id]) => id);
      assert.equal(new Set(ids).size, ids.length, `${name}: ${screen.id}`);
    }
    for (const holder of [...p.screens, ...itemsOf(p)]) if (holder.note) assert.ok(!overview.includes(holder.note), `${name}: ${holder.note}`);
    for (const words of [p.name, p.bet, p.cost, p.hardest, ...p.absent]) assert.ok(!overview.includes(words), `${name}: ${words}`);
  }
});

// R171 with R154 of the dry run: the pictures an audience is handed carried the makers' reasons, which she is never given.
// What the page is without the proposal's own account: the page as it is drawn, less its name and what the founder judges it by, and less every note.
const withoutNotes = page => page
  .replace(headerOf(page), `<header class="ux-option">\n  <h1>${headerOf(page).match(/<h1>(Option [A-Z]): /)[1]}</h1>\n</header>\n`)
  .replace(`\n${overviewOf(page)}`, '')
  .replace(`\n${accountOf(page)}`, '')
  .replace(/^ *<p class="ux-note">.*<\/p>\n/gm, '');

test('without the proposal\'s own account the page keeps its letter and its screens, and holds no name, bet, cost, absence, hardest state or note; nothing else changes', () => {
  for (const [i, name] of ALL.entries()) {
    const p = load(name);
    const letter = 'ABCDE'[i];
    const full = renderProposal(p, { letter });
    const bare = renderProposal(p, { letter, notes: false });
    assert.equal(headerOf(bare), `<header class="ux-option">\n  <h1>Option ${letter}</h1>\n</header>\n`, name);
    assert.equal(bare, withoutNotes(full), `${name}: the page with the notes, less the notes`);
    assert.equal(accountOf(bare), undefined, `${name}: no account at all`);
    assert.doesNotMatch(bare, /<dl>|<dt>|<dd>|ux-overview|ux-account|ux-note|Its own account|Its bet|Deliberately bad at|Absent on purpose|In the hardest state/, name);
    assert.ok(count(full, 'class="ux-note"') > 0 && accountOf(full).includes('<dl>'), `${name}: the page with the notes has some`);
    // Every frame is there, with its caption and what a dialog opens over, and every part with its id.
    for (const part of ['<section class="ux-frame"', '<header>\n    <h2>', 'class="ux-window"', 'class="ux-over"', 'data-ux="', '<button', '<nav', '<details']) assert.equal(count(bare, part), count(full, part), `${name}: ${part}`);
    assert.match(bare, new RegExp(`<title>Option ${letter}</title>`));
    // With the notes is how a page is drawn when nothing is said, and when it is said.
    assert.equal(renderProposal(p, { letter, notes: true }), full);
  }
  // The makers' words for the whole are not on the page, in any form.
  const p = load(PROPOSALS[1]);
  const bare = renderProposal(p, { letter: 'B', notes: false });
  for (const words of [p.name, p.bet, p.cost, p.hardest, ...p.absent]) assert.ok(!bare.includes(words), words);
  // A letter copy, which carries no first idea and no word of who made it, draws the same page without them as its source does.
  const { firstIdea, author, engine, track, model, source, ...copy } = load(PROPOSALS[0]);
  assert.ok(firstIdea !== undefined && [author, engine, track, model, source].some(value => value !== undefined), 'the fixture is a source');
  assert.equal(renderProposal(copy, { letter: 'A', notes: false }), renderProposal(load(PROPOSALS[0]), { letter: 'A', notes: false }));
  for (const notes of ['no', 0, null, 'false']) assert.throws(() => renderProposal(p, { letter: 'B', notes }), e => e instanceof TypeError && /^notes must be true or false; it is /.test(e.message), JSON.stringify(notes));
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
  <div class="ux-window">
    <div class="ux-screen">
      <nav class="ux-nav" data-ux="places">Where she can go
        <ul>
          <li aria-current="page">Today</li>
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
  </div>
</section>
`);
});

// R194 and R196 of the board change: a region that says which area of the page it is carries that area's class,
// and the kit lays the areas out as a page; the walkthrough's order and every part stay as they are written.
test('a placed region is drawn as its region with the class of its area beside ux-region; the parts in it are drawn as anywhere', () => {
  const p = load(PLACED);
  const page = renderProposal(p, { letter: 'A' });
  assert.equal(frameOf(page, 'today'), `<section class="ux-frame" data-screen="today">
  <header>
    <h2>Today, at 9:40</h2>
    <p class="ux-note">Open all day on the desk monitor; it is where she lands.</p>
  </header>
  <div class="ux-window">
    <div class="ux-screen">
      <section class="ux-region ux-navigation">
        <h3 class="ux-heading">Front desk</h3>
        <nav class="ux-nav" data-ux="places">Places
          <ul>
            <li aria-current="page">Today</li>
            <li>Rooms</li>
            <li>Bookings</li>
            <li>Settings</li>
          </ul>
        </nav>
        <a class="ux-link" href="#">Help</a>
      </section>
      <section class="ux-region ux-bar">
        <p class="ux-input" data-ux="find">Find a patient or a room</p>
        <p class="ux-status" data-ux="updated">Updated 9:40</p>
        <button class="ux-action is-primary" type="button" data-ux="book-walk-in">Book a walk-in</button>
      </section>
      <section class="ux-region ux-main">
        <h3 class="ux-heading">Rooms right now</h3>
        <p class="ux-status" data-ux="free-count">2 rooms free now</p>
        <section class="ux-region">
          <header>Free now</header>
          <div class="ux-group">
            <header>Room 2</header>
            <p class="ux-text">Free until 10:30</p>
            <button class="ux-action" type="button" data-ux="book-room-2">Book Room 2</button>
            <p class="ux-note">Opens the booking over this screen.</p>
          </div>
          <div class="ux-group">
            <header>Sala Jardín 🌿</header>
            <p class="ux-text">Free until 11:15</p>
            <button class="ux-action" type="button" data-ux="book-sala-jardin">Book Sala Jardín 🌿</button>
          </div>
        </section>
        <div class="ux-list" data-ux="not-free">Busy, being cleaned or closed
          <ul>
            <li>Room 3 — being cleaned, ready at 9:50</li>
            <li>Room 1 — Dan with Maria K., until 10:00</li>
            <li>Gym — out of service today</li>
          </ul>
        </div>
        <p class="ux-note">Soonest free first.</p>
      </section>
      <section class="ux-region ux-beside">
        <header>Next to arrive</header>
        <div class="ux-list" data-ux="arriving">Booked for the next hour
          <ul>
            <li>9:50 — Ana G., with Leila</li>
            <li>10:00 — Luis M., with Tomás</li>
            <li>10:30 — Ruth B., with Dan</li>
          </ul>
        </div>
        <a class="ux-link" href="#">See all of today&#39;s bookings</a>
      </section>
    </div>
  </div>
</section>
`);
  // Each area's class is on the region written with that place, once on a screen, and nowhere else.
  for (const screen of p.screens.filter(s => s.container === 'screen')) {
    const frame = frameOf(page, screen.id);
    for (const place of PLACES) {
      assert.equal(count(frame, `<section class="ux-region ux-${place}">`), screen.items.filter(item => item.place === place).length, `${screen.id}: ${place}`);
    }
    assert.equal(count(frame, '      <section class="ux-region ux-'), screen.items.length, `${screen.id}: the direct items, and only they`);
  }
  assert.doesNotMatch(frameOf(page, 'book'), /ux-(navigation|bar|main|beside)/, 'a dialog has no area');
  // The areas are drawn in the order written: where each sits on the page is the kit's.
  const reversed = load(PLACED);
  reversed.screens[0].items.reverse();
  const classes = [...frameOf(renderProposal(reversed, { letter: 'A' }), 'today').matchAll(/^ {6}<section class="ux-region (ux-[a-z]+)">/gm)].map(([, name]) => name);
  assert.deepEqual(classes, ['ux-beside', 'ux-main', 'ux-bar', 'ux-navigation']);
  // A proposal that places nothing carries no area class: its screens are one column in the same window.
  for (const name of [EVERY, ...PROPOSALS]) assert.doesNotMatch(renderProposal(load(name), { letter: 'A' }), /ux-(navigation|bar|main|beside)/, name);
  // The script names the same four areas the format does, and the classes a kit made before them lacks.
  assert.deepEqual(AREA_CLASSES.filter(name => PLACES.includes(name.slice(3))), PLACES.map(place => `ux-${place}`));
});

test('every screen and every dialog is drawn in a window: the frame holds its caption, then the ux-window, which holds the screen or the dialog alone', () => {
  for (const name of ALL) {
    const p = load(name);
    const page = renderProposal(p, { letter: 'A' });
    assert.equal(count(page, '<div class="ux-window">'), p.screens.length, name);
    for (const screen of p.screens) {
      const frame = frameOf(page, screen.id);
      assert.match(frame, new RegExp(`^<section class="ux-frame" data-screen="${screen.id}">\n  <header>\n[\\s\\S]*?\n  </header>\n  <div class="ux-window">\n    <div class="ux-${screen.container}">\n[\\s\\S]*\n    </div>\n  </div>\n</section>\n$`), `${name}: ${screen.id}`);
    }
  }
});

// R197 of the board change: the navigation's entries are rows with the current one marked. No key says which is
// current, so the board marks the place a screen's own title names, and no place when it names none.
test('the place a screen\'s title opens with is marked as the current one, on a screen only, one in a nav at most', () => {
  const navOf = (title, options, container = 'screen') => {
    const p = load(PLACED);
    p.screens.length = 2;
    const screen = container === 'screen' ? p.screens[0] : p.screens[1];
    screen.title = title;
    const nav = { role: 'nav', text: 'Places', options };
    if (container === 'screen') screen.items[0].items = [nav];
    else screen.items.push(nav);
    assert.deepEqual(validate(p), [], title);
    return [...frameOf(renderProposal(p, { letter: 'A' }), screen.id).match(/<nav class="ux-nav">[\s\S]*?<\/nav>/)[0].matchAll(/<li( aria-current="page")?>([^<]*)<\/li>/g)].map(([, current, text]) => (current ? `[${text}]` : text));
  };
  assert.deepEqual(navOf('Today, at 9:40', ['Today', 'Rooms']), ['[Today]', 'Rooms']);
  assert.deepEqual(navOf('Rooms', ['Today', 'Rooms']), ['Today', '[Rooms]']);
  assert.deepEqual(navOf('  rooms   BY floor ', ['Today', 'Rooms by  Floor']), ['Today', '[Rooms by  Floor]'], 'whatever the case and the spaces');
  assert.deepEqual(navOf('Bookings', ['Today', 'Rooms']), ['Today', 'Rooms'], 'a title that names no place marks none');
  assert.deepEqual(navOf('Roomservice', ['Room', 'Rooms']), ['Room', 'Rooms'], 'whole words only');
  assert.deepEqual(navOf('Today\u2019s bookings', ['Today', 'Bookings']), ['[Today]', 'Bookings'], 'the words the title opens with, not any it holds');
  assert.deepEqual(navOf('All — Today', ['Today', 'Rooms']), ['Today', 'Rooms'], 'nor a place the title only ends with');
  assert.deepEqual(navOf('Rooms upstairs', ['Rooms', 'Rooms upstairs', 'Today']), ['Rooms', '[Rooms upstairs]', 'Today'], 'the longest place that opens it');
  assert.deepEqual(navOf('Today', ['Today', 'today']), ['[Today]', 'today'], 'one at most: the first of two alike');
  assert.deepEqual(navOf('Today', ['Today', 'Rooms'], 'dialog'), ['Today', 'Rooms'], 'never in a dialog');
  // Every nav of the screen is read the same way, wherever it is.
  const p = load(PLACED);
  p.screens[0].items[2].items.push({ role: 'nav', text: 'Days', options: ['Yesterday', 'Today'] });
  assert.equal(count(frameOf(renderProposal(p, { letter: 'A' }), 'today'), '<li aria-current="page">Today</li>'), 2);
  // The mark is on a place of a nav, and on nothing else: not on a list's row, not on a choice's option.
  const rows = load(PLACED);
  rows.screens[0].items[2].items.push({ role: 'list', text: 'Days', options: ['Today', 'Tomorrow'] }, { role: 'choice', text: 'Which day?', options: ['Today', 'Tomorrow'] });
  assert.equal(count(frameOf(renderProposal(rows, { letter: 'A' }), 'today'), 'aria-current'), 1, 'the nav\'s place alone');
  for (const name of ALL) {
    const page = renderProposal(load(name), { letter: 'A' });
    assert.equal(count(page, 'aria-current'), count(page, '<li aria-current="page">'), name);
    for (const [part] of page.matchAll(/<div class="ux-(?:list|choice)"[\s\S]*?<\/div>/g)) assert.doesNotMatch(part, /aria-current/, name);
  }
});

test('a dialog is drawn in a frame of its own, as ux-dialog in place of ux-screen; the screen it opens over is not drawn again', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.equal(frameOf(page, 'book'), `<section class="ux-frame" data-screen="book">
  <header>
    <h2>Booking Room 2</h2>
    <p class="ux-over">opens over Today, at 9:40</p>
  </header>
  <div class="ux-window">
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
  <div class="ux-window">
    <div class="ux-dialog">
`));
});

test('a dialog over a screen whose title holds markup names that title escaped', () => {
  const p = load(EVERY);
  p.screens[0].title = 'Today <b>at 9:40</b> & "after"';
  const page = renderProposal(p, { letter: 'A' });
  assert.ok(frameOf(page, 'book').includes('<p class="ux-over">opens over Today &lt;b&gt;at 9:40&lt;/b&gt; &amp; &quot;after&quot;</p>'));
  assert.ok(overviewOf(page).includes('<b>Today &lt;b&gt;at 9:40&lt;/b&gt; &amp; &quot;after&quot;</b>'), 'and so does the overview');
  assert.doesNotMatch(page, /<b>at/);
});

test('an item whose text is <script>alert(1)</script> is shown escaped, and no <script tag is in the page', () => {
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.ok(page.includes('<p class="ux-text">&lt;script&gt;alert(1)&lt;/script&gt;</p>'));
  assert.doesNotMatch(page, /<script/i);
});

test('every string of the proposal goes through one escape, in the header, the captions, the labels, the parts, the options and the notes', () => {
  // Each string becomes markup of its own, numbered; ids, roles and containers are kebab words and stay.
  const keep = new Set(['id', 'over', 'role', 'container', 'place', ...PROVENANCE]);
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
  // The first idea is never drawn; the title of the screen the dialog opens over is drawn twice. The overview says some
  // of the same strings again, each escaped the same way: it is counted apart.
  const firstIdea = numberOf(p.firstIdea);
  const over = numberOf(p.screens.find(s => s.id === p.screens[1].over).title);
  const overview = overviewOf(page);
  const rest = page.replace(overview, '');
  const titles = p.screens.map(screen => numberOf(screen.title));
  for (let n = 1; n <= made; n++) {
    const escaped = `&lt;b title=&quot;x&quot;&gt;&#39;Tom &amp; Jerry&#39; &quot;${n}&quot;&lt;/b&gt;`;
    assert.equal(count(rest, escaped), n === firstIdea ? 0 : n === over ? 2 : 1, `string ${n}`);
    if (titles.includes(n)) assert.equal(count(overview, escaped), 1, `string ${n}, a title, in the overview`);
  }
  assert.ok(made > 40, `${made} strings`);
  assert.ok(count(overview, '&lt;b title=&quot;x&quot;&gt;') > titles.length, 'the overview says what the areas hold');
  // The only <b> on the page is the overview's own, around a title; no markup of the proposal's is.
  assert.doesNotMatch(page.replace(/<b>(?=&lt;)/g, ''), /<b[\s>]|Tom & Jerry|'Tom|"\d+"/);
  // The placed sample too: every string of it, wherever an area or the overview says it.
  made = 0;
  const q = hostile(load(PLACED));
  assert.deepEqual(validate(q), []);
  assert.doesNotMatch(renderProposal(q, { letter: 'B' }).replace(/<b>(?=&lt;)/g, ''), /<b[\s>]|Tom & Jerry|'Tom|"\d+"/);
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

// The sample the board's pictures are taken of, whole: drawn again the same way, with front-desk.json and letter A.
test('the sample fixture drawn as option A is, byte for byte, the committed page front-desk.A.html', () => {
  assert.equal(renderProposal(load(PLACED), { letter: 'A' }), readFileSync(fixturePath('render/front-desk.A.html'), 'utf8'));
});

test('the kit contract states what the drawing relies on: the page\'s order, the board\'s own words, the overview, ids per frame, the stylesheet set', () => {
  const contract = readFileSync(contractPath, 'utf8');
  // A section of the contract, its lines joined: the prose wraps anywhere.
  const flat = text => text.replace(/\s+/g, ' ');
  const section = title => flat(contract.slice(contract.indexOf(`## ${title}\n`), contract.indexOf('\n## ', contract.indexOf(`## ${title}\n`) + 1)));
  const page = renderProposal(load(PLACED), { letter: 'B' });
  const document = section('The document');
  const markup = section('The markup');
  // The order of the page, as the script draws it: each part's class is named in that order.
  const order = ['ux-option', 'ux-overview', 'ux-frame', 'ux-account'];
  assert.deepEqual([...page.matchAll(/^<(?:header|section) class="(ux-[a-z]+)"/gm)].map(([, name]) => name).filter((name, i, all) => name !== all[i - 1]), order);
  const steps = [...contract.matchAll(/^\d\. \*\*[^*]+\*\*, (?:one )?`(ux-[a-z]+)`/gm)].map(([, name]) => name);
  assert.deepEqual(steps, order, 'the contract lists the page\'s parts in the order drawn');
  assert.match(document, /Last, and never above the drawing/);
  // Every element the page's own parts are drawn on is named where the contract states their markup.
  for (const [part, where] of [[headerOf(page), markup], [overviewOf(page), section('The markup')], [accountOf(page), markup]]) {
    for (const tag of new Set([...part.matchAll(/<([a-z][a-z0-9]*)\b/g)].map(([, name]) => name))) assert.ok(where.includes(`\`<${tag}>\``) || where.includes(`\`<${tag} `), `the contract names <${tag}>`);
  }
  // S10 of the fix review: the contract describes the page drawn without the proposal's own account too, as the script draws it.
  // N3 of the last re-review: in the words Structure uses for it, never "the makers' notes".
  const bare = renderProposal(load(PLACED), { letter: 'B', notes: false });
  assert.equal(headerOf(bare), '<header class="ux-option">\n  <h1>Option B</h1>\n</header>\n');
  assert.equal(count(bare, 'class="ux-note"') + count(bare, 'ux-account') + count(bare, 'ux-overview'), 0);
  assert.ok(count(page, 'class="ux-note"') > 0 && count(page, 'class="ux-account"') === 1 && count(page, 'class="ux-overview"') === 1);
  for (const screen of load(PLACED).screens.filter(s => !s.note)) assert.equal(frameOf(bare, screen.id).replace(/^ *<p class="ux-note">.*<\/p>\n/gm, ''), frameOf(page, screen.id).replace(/^ *<p class="ux-note">.*<\/p>\n/gm, ''), screen.id);
  assert.match(document, /Drawn without the proposal's own account, for a reader who must not see it, the page is its title and its screens and nothing else: the title is `Option ` and the letter alone, with no name; no `ux-overview` and no `ux-account` is drawn, and no `ux-note` in any frame\. Its first screen follows its title, so a picture of the page's first screen begins with the first window\. The screens are the same either way\./);
  assert.doesNotMatch(document, /the makers' notes/);
  // The stylesheet set: kit.css is linked, may import the others, and all of them travel together.
  assert.match(document, /A kit may hold more than one stylesheet\. `kit\.css` is the one the document links, and it may import the others by relative name/);
  assert.match(document, /copies every stylesheet found directly in the kit's folder beside the document, so they all travel together/);
  // The words the board itself writes: what is left of a page once every word of the proposal is taken out of it.
  // The contract quotes each of them.
  // Each string becomes a run of one character no word holds, each run of another length: no two titles alike.
  let runs = 0;
  const marked = value => {
    if (typeof value === 'string') return '\u0000'.repeat(++runs);
    if (Array.isArray(value)) return value.map(marked);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, ['id', 'over', 'role', 'container', 'place', 'firstIdea'].includes(key) ? v : marked(v)]));
  };
  const blank = renderProposal(marked(load(PLACED)), { letter: 'B' });
  const said = new Set(blank.slice(blank.indexOf('<body>')).replace(/<[^>]*>/g, '\n').split(/[\n\u0000]+/).filter(words => words.trim() !== ''));
  assert.deepEqual([...said].sort(), [' · ', ', ', ...PLACES, 'Absent on purpose', 'Deliberately bad at', 'In the hardest state', 'Its bet', 'Its own account', 'Option B: ', 'dialog', 'opens over '].sort());
  for (const words of [...said].filter(words => words !== 'Option B: ')) assert.ok(markup.includes(`\`${words}\``), `the contract quotes the board's "${words}"`);
  for (const words of ['Option ', ': ', 'screen']) assert.ok(markup.includes(`\`${words}\``), `the contract quotes the board's "${words}"`);
  assert.match(markup, /Every string in it is the proposal's own words but these, which the board writes/);
  assert.doesNotMatch(markup, /Every string in it is the proposal's own words\./);
  // The overview, as the script draws it: what an area holds, and that it carries nothing a part is found by.
  assert.match(markup, /What an area holds is said from the proposal alone: the region's label, when it has one, then the words of each item directly in it, joined by ` · `\. An item's words are its text; a nav's are its places, joined by `, `; a container's are its label, and those of what it holds when it has none\./);
  assert.match(markup, /The overview carries no class but its own, no `data-screen` and no `data-ux`, so it repeats no id of the frames, and no note\. It is drawn only on the page that carries the proposal's own account\./);
  assert.doesNotMatch(contract.replace(/a picture, a video or a map/, ''), /\bmap\b/i, 'the board\'s overview is never called the map, which is the sealed file\'s name');
  // The place she is at, as the script marks it.
  assert.ok(page.includes('<li aria-current="page">'));
  assert.match(markup, /the `<li>` of one place at most carries `aria-current="page"`: the place whose words open the screen's title, whatever the case and the spaces/);
  assert.match(markup, /A nav in a dialog marks none\./);
  // A data-ux repeats across frames: a part is found by its frame and its id together.
  assert.match(markup, /unique within its screen only, so the same `data-ux` may appear in two frames/);
  assert.match(markup, /found by its frame's `data-screen` and its own `data-ux` together/);
  assert.match(markup, /Each `data-screen` is on one element of the document, and nothing outside the frames carries either attribute: the overview repeats none\./);
  // R198: the classes a kit made before the page's areas lacks are the ones the script looks for, and no other.
  const before = flat(contract.slice(contract.indexOf("### A kit made before the page's areas\n"), contract.indexOf('\n## The markup')));
  assert.deepEqual([...before.matchAll(/`(ux-[a-z]+)`/g)].map(([, name]) => name), AREA_CLASSES);
  assert.match(before, /A kit whose stylesheets style none of them was made before them\. The drawing script still draws with it, the board then shows no areas, and the script says so in one warning line/);
  // Each of them is a class the contract gives a row, and an area's class is drawn after ux-region.
  for (const name of AREA_CLASSES) assert.match(contract, new RegExp(`^\\| \`${name}\` \\| \`<[a-z]+>\` \\|`, 'm'), name);
  for (const place of PLACES) assert.ok(markup.includes(`\`class="ux-region ux-${place}"\``) && page.includes(`class="ux-region ux-${place}"`), place);
});

test('no product name appears in the render script or its fixture', () => {
  for (const file of [cli, fixturePath(EVERY), fixturePath('render/every-part.D.html'), fixturePath(PLACED), fixturePath('render/front-desk.A.html')]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});

// ---- the command line

// Run from the test's own folder, so that a path the command should never take lands nowhere else.
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root });
// The command run from another folder, with a module required before it (a CommonJS file, so that this
// needs nothing newer than the Node 20 the package names).
const runWith = ({ cwd = root, preload, env }, ...args) =>
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
  writeFileSync(join(dir, 'kit.css'), '/* a project kit: déjà vu 🙂 */\n.ux-frame { margin: 0; }\n.ux-window { margin: 0; }\n');
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

test('the CLI draws the page without the proposal\'s own account with --without-notes, says so, and draws it with it without the switch', () => {
  const dir = fresh();
  const input = fixturePath(PROPOSALS[1]);
  const [withNotes, without] = [join(dir, 'board', 'B.html'), join(dir, 'board', 'B-screens.html')];
  const drawn = run(input, '--kit', greyKit, '--out', withNotes, '--letter', 'B');
  assert.deepEqual([drawn.status, drawn.stderr, drawn.stdout], [0, '', `drew option B to ${withNotes}, with kit.css beside it\n`]);
  const bare = run(input, '--kit', greyKit, '--out', without, '--letter', 'B', '--without-notes');
  assert.deepEqual([bare.status, bare.stderr, bare.stdout], [0, '', `drew option B to ${without}, without the proposal's own account, with kit.css beside it\n`]);
  assert.equal(readFileSync(withNotes, 'utf8'), renderProposal(load(PROPOSALS[1]), { letter: 'B' }));
  assert.equal(readFileSync(without, 'utf8'), renderProposal(load(PROPOSALS[1]), { letter: 'B', notes: false }));
  assert.deepEqual(readdirSync(join(dir, 'board')).sort(), ['B-screens.html', 'B.html', 'kit.css']);
  // A switch takes no value, and comes anywhere.
  const first = run('--without-notes', input, '--kit', greyKit, '--out', without, '--letter', 'B');
  assert.deepEqual([first.status, first.stdout], [0, bare.stdout]);
  const valued = run(input, '--kit', greyKit, '--out', without, '--without-notes=yes');
  assert.equal(valued.status, 2);
  assert.ok(valued.stderr.startsWith('--without-notes takes no value\n\nUsage: node scripts/render.mjs'), valued.stderr);
});

// R198 of the board change: a project kit made before the page had areas is noticed, and nothing else changes.
test('the CLI warns in one line when no stylesheet of the kit styles a class of the page\'s areas, draws all the same, and exits 0', () => {
  const dir = fresh();
  const input = writeProposal(dir, load(PLACED));
  const kitOf = (name, sheets) => {
    const kit = join(dir, name);
    mkdirSync(kit, { recursive: true });
    for (const [file, css] of Object.entries(sheets)) writeFileSync(join(kit, file), css);
    return kit;
  };
  const OLD = '.ux-frame { margin: 0; }\n.ux-screen, .ux-dialog { padding: 1rem; }\n.ux-region { padding: 1rem; }\n.ux-nav > ul { display: flex; }\n';
  const warning = kit => `warning: no stylesheet of ${kit} styles any of the page's areas (ux-option, ux-overview, ux-window, ux-navigation, ux-bar, ux-main, ux-beside, ux-account), so the board is drawn without them: this kit was made before them, run setup's kit steps again\n`;
  assert.deepEqual(AREA_CLASSES, ['ux-option', 'ux-overview', 'ux-window', 'ux-navigation', 'ux-bar', 'ux-main', 'ux-beside', 'ux-account']);
  const drawn = (kit, ...more) => {
    const out = join(dir, 'boards', basename(kit), 'A.html');
    const r = run(input, '--kit', kit, '--out', out, ...more);
    return { ...r, out, said: `drew option A to ${out},${more.includes('--without-notes') ? ' without the proposal\'s own account,' : ''} with ${readdirSync(kit).sort().join(', ')} beside it\n` };
  };
  // A kit made before: one line on the error stream, the page and the stylesheet written as ever, exit 0.
  const old = kitOf('an old kit', { 'kit.css': OLD });
  for (const more of [[], ['--without-notes']]) {
    const r = drawn(old, ...more);
    assert.deepEqual([r.status, r.stdout, r.stderr], [0, r.said, warning(old)], more.join(' '));
    assert.equal(count(r.stderr, '\n'), 1, 'one line');
    assert.equal(readFileSync(r.out, 'utf8'), renderProposal(load(PLACED), { letter: 'A', notes: !more.length }), 'the same page as with any kit');
    assert.deepEqual(readFileSync(join(dirname(r.out), 'kit.css'), 'utf8'), OLD);
  }
  // A class named in a comment, or as the start of another name, styles nothing.
  for (const [name, css] of [['commented', `/* .ux-overview and .ux-window come later */\n${OLD}`], ['longer', `${OLD}.ux-overviewed, .ux-barrier, .ux-main-old, .ux-window_ { margin: 0; }\n`]]) {
    const kit = kitOf(name, { 'kit.css': css });
    assert.equal(drawn(kit).stderr, warning(kit), name);
  }
  // One class of the areas, in any stylesheet of the kit's folder, and the kit is not taken for an old one.
  for (const name of AREA_CLASSES) {
    const kit = kitOf(`with ${name}`, { 'kit.css': `${OLD}.${name} { margin: 0; }\n` });
    const r = drawn(kit);
    assert.deepEqual([r.status, r.stdout, r.stderr], [0, r.said, ''], name);
  }
  for (const css of ['.ux-region.ux-main{margin:0}', '.ux-frame>.ux-window>.ux-screen{margin:0}', '.ux-screen:has(> .ux-beside) { margin: 0; }']) {
    const kit = kitOf(`written ${css.length}`, { 'kit.css': `${OLD}${css}\n` });
    assert.equal(drawn(kit).stderr, '', css);
  }
  for (const sheet of ['areas.css', 'zones.css']) {
    const imported = kitOf(`imported ${sheet}`, { 'kit.css': `@import "${sheet}";\n${OLD}`, [sheet]: '.ux-overview { margin: 0; }\n' });
    assert.equal(drawn(imported).stderr, '', `${sheet}: whichever stylesheet of the folder styles it`);
  }
  // The grey kit is never one.
  const grey = drawn(greyKit);
  assert.deepEqual([grey.status, grey.stderr], [0, '']);
  // A failure is still a failure, and says nothing of the kit's age.
  const bad = writeProposal(join(dir, 'bad'), { ...load(PLACED), bet: '' });
  const refused = run(bad, '--kit', old, '--out', join(dir, 'boards', 'refused', 'A.html'));
  assert.equal(refused.status, 1);
  assert.doesNotMatch(refused.stderr, /warning/);
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
    assert.match(r.stdout, /^Usage: node scripts\/render\.mjs <proposal\.json> --kit <kit dir> --out <file\.html> \[--letter A\] \[--without-notes\]\n/);
    const help = r.stdout.replace(/\s+/g, ' ');
    // N3 of the last re-review: the help is read with no skill beside it, so it spells the proposal's own account out once.
    assert.ok(help.includes('--without-notes draw the page without the proposal\'s own account (its name, its bet, its cost, what is absent, its hardest state, and the note on a screen or an item), for a reader who must not see it, as an audience: its heading is the option\'s letter alone; the screens, their captions and every part are drawn as they are with it'));
    assert.ok(!help.includes('the makers\' notes'), 'the old word is gone');
    // What the page is drawn as, and what is said of a kit made before its areas, as the script does it.
    assert.ok(help.includes('It is drawn in this order: the option\'s title; the overview (every screen at a glance: its title, its areas and what each holds, a dialog under the screen it opens over); the screens, each in a window the kit lays out as a page, with each region that says which area it is (navigation, bar, main, beside) in its place, and a screen that places none as one column; and last the proposal\'s own account.'));
    assert.ok(help.includes('With --without-notes the page is its title and its screens and nothing else: no overview, so its first screen follows its title.'));
    assert.doesNotMatch(help, /\bmap\b/i);
    assert.ok(help.includes(`A kit made before the page had areas styles none of their classes (${AREA_CLASSES.join(', ')}). The page is then drawn all the same, without its areas, and one warning line on the error stream says so and asks for setup's kit steps to be run again; the exit code is not changed by it.`));
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
  // The map sits beside the board folder, which holds the letters only.
  const map = JSON.parse(readFileSync(join(dir, 'MAP.sealed.json'), 'utf8')).letters;
  assert.deepEqual(readdirSync(board).sort(), Object.keys(map).map(letter => `${letter}.json`));
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
  // Anything that is not an object is still refused as one, whichever form is asked of it.
  for (const value of [null, undefined, 'a proposal', 7, []]) {
    assert.throws(() => renderProposal(value, { letter: 'A' }), e => e instanceof TypeError && e.message === 'not a valid proposal:\nproposal: must be an object', String(value));
  }
});

test('a proposal is read as a letter copy only when it carries none of the six keys of a source; with any of them, as a source', () => {
  const dir = fresh();
  const copy = JSON.parse(readFileSync(fixturePath(EVERY), 'utf8'));
  for (const key of ['firstIdea', ...PROVENANCE]) delete copy[key];
  const page = renderProposal(load(EVERY), { letter: 'B' });
  assert.equal(renderProposal(copy, { letter: 'B' }), page, 'none of the six: a letter copy, the same page');
  const missing = 'not a valid proposal:\nproposal: "firstIdea" is missing';
  for (const key of PROVENANCE) {
    // A source that forgot its firstIdea is told so, not that its other keys do not belong.
    assert.throws(() => renderProposal({ ...copy, [key]: 'x' }, { letter: 'B' }), e => e instanceof TypeError && e.message === missing, key);
  }
  assert.equal(renderProposal({ ...copy, firstIdea: 'Another idea, set aside.' }, { letter: 'B' }), page, 'firstIdea alone: a source, the same page');
  // The command reads the same way.
  const { firstIdea, ...forgot } = load(EVERY);
  const input = writeProposal(dir, forgot);
  const r = run(input, '--kit', greyKit, '--out', join(dir, 'board', 'A.html'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot draw ${input}: it is not a valid proposal\nproposal: "firstIdea" is missing\n`]);
});
