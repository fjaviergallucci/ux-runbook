import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { CONTAINERS, KEYS, MAX_SCREENS, ORDER, PLACES, ROLES, SOURCE_ONLY as STRIPPED, validate } from '../scripts/lib/walkthrough.mjs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const FIXTURES = ['unified-list', 'free-first', 'calendar'];
const fixture = name => JSON.parse(read(`tests/fixtures/proposals/${name}.json`));

// A small valid proposal: a screen, and a dialog over it.
const minimal = () => ({
  name: 'Free rooms first',
  bet: 'Free rooms lead the screen, so she never has to look for one.',
  cost: 'A busy room moves as its status changes.',
  absent: ['A filter'],
  hardest: 'With nothing free it names the room that frees up soonest.',
  firstIdea: 'A count of free rooms; set aside because she needs to know which, not how many.',
  screens: [
    {
      id: 'today',
      title: 'Today, at 9:40',
      container: 'screen',
      items: [
        { role: 'status', id: 'free-count', text: '2 rooms free now' },
        { role: 'action', text: 'Book Room 2', primary: true },
      ],
    },
    { id: 'book', title: 'Putting a walk-in in Room 2', container: 'dialog', over: 'today', items: [{ role: 'input', text: 'Patient name' }] },
  ],
});
const changed = change => {
  const p = minimal();
  change(p);
  return p;
};
const group = (items, extra = {}) => ({ container: 'group', label: 'Room 2', ...extra, items });
const line = { role: 'text', text: 'Free until 10:30' };

// Exactly one error, at `path`, saying what `pattern` matches.
function refuses(proposal, path, pattern) {
  const errors = validate(proposal);
  assert.equal(errors.length, 1, `expected one error, got ${JSON.stringify(errors)}`);
  assert.ok(errors[0].startsWith(`${path}: `), `expected the error at ${path}, got ${errors[0]}`);
  assert.match(errors[0], pattern);
}

test('the vocabulary is ten roles, three containers and the four areas a region may be', () => {
  assert.deepEqual(ROLES, ['heading', 'text', 'choice', 'input', 'action', 'list', 'status', 'media', 'link', 'nav']);
  assert.deepEqual(CONTAINERS, ['region', 'group', 'expansion']);
  assert.deepEqual(PLACES, ['navigation', 'bar', 'main', 'beside']);
  assert.equal(MAX_SCREENS, 5);
  for (const list of [ROLES, CONTAINERS, PLACES]) assert.ok(Object.isFrozen(list));
});

test('each fixture validates: two screens, the system track, and real words', () => {
  for (const name of FIXTURES) {
    const p = fixture(name);
    assert.deepEqual(validate(p), [], name);
    assert.equal(p.screens.length, 2, name);
    assert.equal(p.track, 'system', name);
  }
  const texts = FIXTURES.map(name => read(`tests/fixtures/proposals/${name}.json`));
  assert.ok(texts.some(text => /[\u00c0-\u024f]/.test(text)), 'one fixture holds an accented letter');
  assert.ok(texts.some(text => /\p{Extended_Pictographic}/u.test(text)), 'one fixture holds an emoji');
});

test('an item with an unknown role gives one error naming its path', () => {
  const p = changed(p => { p.screens[1].items[0].role = 'card'; });
  assert.deepEqual(validate(p), ['screens[1].items[0]: unknown role "card"']);
});

test('a screen whose container is "sheet" is refused', () => {
  refuses(changed(p => { p.screens[1].container = 'sheet'; }), 'screens[1]', /"container" must be "screen" or "dialog"; it is "sheet"/);
  refuses(changed(p => { delete p.screens[1].container; }), 'screens[1]', /"container" is missing/);
});

test('a dialog whose "over" names no screen is refused', () => {
  refuses(changed(p => { p.screens[1].over = 'agenda'; }), 'screens[1]', /"over" names "agenda", which is no screen/);
});

test('a dialog over a screen whose container is refused adds nothing: one error, at that screen', () => {
  refuses(changed(p => { p.screens[0].container = 'sheet'; }), 'screens[0]', /"container" must be "screen" or "dialog"; it is "sheet"/);
  refuses(changed(p => { delete p.screens[0].container; }), 'screens[0]', /"container" is missing/);
});

test('a dialog may be written before the screen it opens over', () => {
  assert.deepEqual(validate(changed(p => p.screens.reverse())), []);
});

test('a proposal with no bet is refused', () => {
  assert.deepEqual(validate(changed(p => { delete p.bet; })), ['proposal: "bet" is missing']);
});

test('containers nest: a group holding an expansion holding an item validates', () => {
  const p = changed(p => {
    p.screens[0].items.push(group([{ container: 'expansion', label: 'Book Room 2', open: true, items: [{ role: 'input', text: 'Patient name' }] }]));
  });
  assert.deepEqual(validate(p), []);
});

test('primary: true on a role other than action is refused', () => {
  refuses(changed(p => { p.screens[0].items[0].primary = true; }), 'screens[0].items[0]', /"primary" belongs to an action, not to a "status"/);
});

// Every refusal below has a test that fails without it.

test('anything but an object is refused as a whole', () => {
  for (const value of [null, undefined, [], 'a proposal', 3]) {
    assert.deepEqual(validate(value), ['proposal: must be an object'], JSON.stringify(value));
  }
});

test('every text field is present, a string, and not blank', () => {
  const sites = [
    ...['name', 'bet', 'cost', 'hardest', 'firstIdea'].map(key => [p => p, 'proposal', key]),
    [p => p.screens[0], 'screens[0]', 'title'],
    [p => p.screens[0].items[0], 'screens[0].items[0]', 'text'],
  ];
  for (const [at, path, key] of sites) {
    refuses(changed(p => { delete at(p)[key]; }), path, new RegExp(`"${key}" is missing`));
    for (const bad of ['', '   ', 5, null]) {
      refuses(changed(p => { at(p)[key] = bad; }), path, new RegExp(`"${key}" must be a line of text`));
    }
  }
});

test('a note on a screen or an item, and a container label, are text when present', () => {
  for (const bad of ['', ' ', 7]) {
    refuses(changed(p => { p.screens[0].note = bad; }), 'screens[0]', /"note" must be a line of text/);
    refuses(changed(p => { p.screens[0].items[1].note = bad; }), 'screens[0].items[1]', /"note" must be a line of text/);
    refuses(changed(p => { p.screens[0].items.push(group([line], { label: bad })); }), 'screens[0].items[2]', /"label" must be a line of text/);
  }
});

test('absent is a list of at least one line of text', () => {
  refuses(changed(p => { delete p.absent; }), 'proposal', /"absent" is missing/);
  for (const bad of ['A filter', [], {}]) {
    refuses(changed(p => { p.absent = bad; }), 'proposal', /"absent" must be a list of at least one line of text/);
  }
  refuses(changed(p => { p.absent = ['A filter', '']; }), 'absent[1]', /must be a line of text/);
  refuses(changed(p => { p.absent = [3]; }), 'absent[0]', /must be a line of text/);
});

test('screens is a list of at least one screen, and each screen is an object', () => {
  refuses(changed(p => { delete p.screens; }), 'proposal', /"screens" is missing/);
  for (const bad of [[], {}, 'today']) {
    refuses(changed(p => { p.screens = bad; }), 'proposal', /"screens" must be a list of at least one screen/);
  }
  for (const bad of [null, 'today', []]) {
    refuses(changed(p => { p.screens = [bad]; }), 'screens[0]', /must be an object/);
  }
});

test('items is a list of at least one item, on a screen and in a container; each item is an object', () => {
  refuses(changed(p => { delete p.screens[0].items; }), 'screens[0]', /"items" is missing/);
  refuses(changed(p => { p.screens[0].items = []; }), 'screens[0]', /"items" must be a list of at least one item/);
  refuses(changed(p => { p.screens[0].items.push(group([])); }), 'screens[0].items[2]', /"items" must be a list of at least one item/);
  refuses(changed(p => { p.screens[0].items.push({ container: 'group' }); }), 'screens[0].items[2]', /"items" is missing/);
  for (const bad of [null, 'Book Room 2', []]) {
    refuses(changed(p => { p.screens[0].items[0] = bad; }), 'screens[0].items[0]', /must be an object/);
  }
});

test('an item is a role or a container, never both and never neither', () => {
  refuses(changed(p => { p.screens[0].items[0].container = 'group'; }), 'screens[0].items[0]', /has a "role" and a "container"; an item is one or the other/);
  refuses(changed(p => { delete p.screens[0].items[0].role; }), 'screens[0].items[0]', /needs a "role" or a "container"/);
});

test('an item container is a region, a group or an expansion', () => {
  for (const bad of ['dialog', 'screen', 'card', 3]) {
    refuses(changed(p => { p.screens[0].items.push({ container: bad, items: [line] }); }), 'screens[0].items[2]', new RegExp(`unknown container ${JSON.stringify(bad)}`));
  }
});

test('ids are kebab-case words', () => {
  // ['book'] reads as "book" to a regular expression, so it pins the string check.
  for (const bad of ['Book', 'put in', 'put_in', '-book', 'book-', 'book--now', '2-rooms', '', 5, ['book']]) {
    refuses(changed(p => { p.screens[1].id = bad; }), 'screens[1]', /"id" must be kebab-case/);
    refuses(changed(p => { p.screens[0].items[0].id = bad; }), 'screens[0].items[0]', /"id" must be kebab-case/);
  }
  refuses(changed(p => { delete p.screens[1].id; }), 'screens[1]', /"id" is missing/);
  assert.deepEqual(validate(changed(p => { p.screens[1].id = 'put-in-room-2'; })), []);
});

test('screen ids are unique, and an item id names one part of its screen', () => {
  refuses(changed(p => { p.screens[1].id = 'today'; }), 'screens[1]', /id "today" is already screens\[0\]/);
  refuses(
    changed(p => { p.screens[0].items.push(group([{ role: 'text', id: 'free-count', text: 'Free until 10:30' }])); }),
    'screens[0].items[2].items[0]',
    /id "free-count" is already screens\[0\]\.items\[0\] on this screen/,
  );
  assert.deepEqual(validate(changed(p => { p.screens[1].items[0].id = 'free-count'; })), [], 'the same id on two screens');
});

// The board names the screen a dialog opens over by its title, so two screen entries never share one.
test('no two screen entries share a title: the later is refused, naming the earlier', () => {
  refuses(changed(p => { p.screens[1].title = 'Today, at 9:40'; }), 'screens[1]', /title "Today, at 9:40" is already the title of screens\[0\]$/);
  refuses(
    changed(p => { p.screens.push({ id: 'booked', title: 'Putting a walk-in in Room 2', container: 'screen', items: [line] }); }),
    'screens[2]',
    /title "Putting a walk-in in Room 2" is already the title of screens\[1\]$/,
  );
  // A third entry with the title names the first, as the second does.
  const thrice = changed(p => {
    p.screens[1].title = 'Today, at 9:40';
    p.screens.push({ id: 'later', title: 'Today, at 9:40', container: 'screen', items: [line] });
  });
  assert.deepEqual(validate(thrice), [
    'screens[1]: title "Today, at 9:40" is already the title of screens[0]',
    'screens[2]: title "Today, at 9:40" is already the title of screens[0]',
  ]);
  // Spaces the page collapses tell no two titles apart; letter case does.
  refuses(changed(p => { p.screens[1].title = ' Today,\n  at 9:40 '; }), 'screens[1]', /is already the title of screens\[0\]$/);
  assert.deepEqual(validate(changed(p => { p.screens[1].title = 'today, at 9:40'; })), [], 'another case is another title');
  assert.deepEqual(validate(changed(p => { p.screens[1].title = 'Today, at 9:41'; })), []);
});

test('a dialog names the screen it opens over, and only a dialog does', () => {
  refuses(changed(p => { delete p.screens[1].over; }), 'screens[1]', /a dialog names the screen it opens over in "over"/);
  refuses(changed(p => { p.screens[0].over = 'book'; }), 'screens[0]', /only a dialog opens over a screen/);
  refuses(
    changed(p => { p.screens.push({ id: 'confirm', title: 'Confirming the booking', container: 'dialog', over: 'book', items: [line] }); }),
    'screens[2]',
    /"over" names "book", which is a dialog, not a screen/,
  );
  refuses(changed(p => { p.screens[1].over = 'book'; }), 'screens[1]', /"over" names "book", which is a dialog, not a screen/);
});

test('primary belongs to an action, and is true or false', () => {
  refuses(changed(p => { p.screens[0].items[0].primary = false; }), 'screens[0].items[0]', /"primary" belongs to an action/);
  refuses(changed(p => { p.screens[0].items[1].primary = 'yes'; }), 'screens[0].items[1]', /"primary" must be true or false/);
  assert.deepEqual(validate(changed(p => { p.screens[0].items[1].primary = false; })), []);
});

test('open belongs to an expansion, and is true or false', () => {
  refuses(changed(p => { p.screens[0].items.push(group([line], { open: true })); }), 'screens[0].items[2]', /"open" belongs to an expansion, not to a "group"/);
  refuses(changed(p => { p.screens[0].items.push({ container: 'expansion', label: 'Later today', open: 'yes', items: [line] }); }), 'screens[0].items[2]', /"open" must be true or false/);
  assert.deepEqual(validate(changed(p => { p.screens[0].items.push({ container: 'expansion', label: 'Later today', open: false, items: [line] }); })), []);
});

test('a mistyped role or container is reported once, not again by the keys that depend on it', () => {
  refuses(changed(p => { p.screens[0].items[1].role = 'acton'; }), 'screens[0].items[1]', /: unknown role "acton"$/);
  refuses(changed(p => { p.screens[0].items.push({ role: 'chioce', text: 'How long?', options: ['15 min', '30 min'] }); }), 'screens[0].items[2]', /: unknown role "chioce"$/);
  refuses(changed(p => { p.screens[0].items.push({ container: 'expanson', label: 'Later today', open: true, items: [line] }); }), 'screens[0].items[2]', /: unknown container "expanson"$/);
});

test('a screen has at most one primary action; a dialog is a screen of its own', () => {
  refuses(
    changed(p => { p.screens[0].items.push(group([{ role: 'action', text: 'Book Sala Jardín', primary: true }])); }),
    'screens[0].items[2].items[0]',
    /a second primary action on this screen; the first is screens\[0\]\.items\[1\]/,
  );
  assert.deepEqual(validate(changed(p => { p.screens[1].items.push({ role: 'action', text: 'Book', primary: true }); })), [], 'one on the screen and one on its dialog');
  assert.deepEqual(validate(changed(p => { p.screens[0].items.push({ role: 'action', text: 'Cancel', primary: false }); })), [], 'primary: false is not a second primary');
  assert.deepEqual(validate(changed(p => { p.screens[0].items.unshift({ role: 'action', text: 'Cancel', primary: false }); })), [], 'nor a first one');
});

test('an expansion carries a label; a region or a group may go without one', () => {
  const expansion = { container: 'expansion', items: [line] };
  refuses(changed(p => { p.screens[0].items.push(expansion); }), 'screens[0].items[2]', /"label" is missing/);
  refuses(changed(p => { p.screens[0].items.push({ ...expansion, label: ' ' }); }), 'screens[0].items[2]', /"label" must be a line of text/);
  for (const container of ['region', 'group']) {
    assert.deepEqual(validate(changed(p => { p.screens[0].items.push({ container, items: [line] }); })), [], container);
  }
});

test('options belong to a choice, a list or a nav, and those three need them', () => {
  const withItem = item => changed(p => { p.screens[1].items.push(item); });
  for (const role of ['heading', 'text', 'input', 'action', 'status', 'media', 'link']) {
    refuses(withItem({ role, text: 'Room 2', options: ['Free until 10:30'] }), 'screens[1].items[1]', new RegExp(`"options" belong to a choice, a list or a nav, not to a "${role}"`));
  }
  for (const role of ['choice', 'list', 'nav']) {
    refuses(withItem({ role, text: 'Rooms' }), 'screens[1].items[1]', /"options" is missing/);
  }
  for (const bad of ['15 min, 30 min', ['30 min'], [], {}]) {
    refuses(withItem({ role: 'choice', text: 'How long?', options: bad }), 'screens[1].items[1]', /"options" must be a list of at least two lines of text/);
  }
  for (const role of ['list', 'nav']) {
    refuses(withItem({ role, text: 'Rooms', options: [] }), 'screens[1].items[1]', /"options" must be a list of at least one line of text/);
    assert.deepEqual(validate(withItem({ role, text: 'Rooms', options: ['Room 2'] })), [], role);
  }
  assert.deepEqual(validate(withItem({ role: 'choice', text: 'How long?', options: ['15 min', '30 min'] })), []);
  refuses(withItem({ role: 'choice', text: 'How long?', options: ['15 min', ' '] }), 'screens[1].items[1].options[1]', /must be a line of text/);
  refuses(withItem({ role: 'list', text: 'Rooms', options: [15] }), 'screens[1].items[1].options[0]', /must be a line of text/);
});

test('an unknown key is refused at every level; the provenance keys are allowed on the proposal only', () => {
  refuses(changed(p => { p.layout = 'two columns'; }), 'proposal', /unknown key "layout"/);
  refuses(changed(p => { p.screens[0].width = 1280; }), 'screens[0]', /unknown key "width"/);
  refuses(changed(p => { p.screens[0].items[0].component = 'Badge'; }), 'screens[0].items[0]', /unknown key "component"/);
  refuses(changed(p => { p.screens[0].items.push(group([line], { columns: 2 })); }), 'screens[0].items[2]', /unknown key "columns"/);
  const provenance = { author: 'describer-2', engine: 'claude', track: 'system', model: 'opus', source: 'proposals/b.json' };
  assert.deepEqual(validate(changed(p => Object.assign(p, provenance))), []);
  refuses(changed(p => { p.screens[0].track = 'system'; }), 'screens[0]', /unknown key "track"/);
});

// R194 of the board change: a region may say which area of the page it is, and nothing else may say where anything goes.
const region = (place, extra = {}) => ({ container: 'region', ...(place ? { place } : {}), ...extra, items: [line] });
// The first screen holding one region for each place given, in that order; null is a region with no place.
const placing = (...places) => changed(p => { p.screens[0].items = places.map(place => region(place)); });

test('a region that is a direct item of a screen may say which of four areas it is; a screen with no placed region stays valid', () => {
  assert.deepEqual(validate(placing('main')), [], 'main alone');
  assert.deepEqual(validate(placing(...PLACES)), [], 'all four');
  assert.deepEqual(validate(placing('beside', 'main', 'bar', 'navigation')), [], 'in any order');
  for (const place of PLACES.filter(place => place !== 'main')) assert.deepEqual(validate(placing(place, 'main')), [], place);
  assert.deepEqual(validate(placing(null, null)), [], 'regions with no place, as before');
  assert.deepEqual(validate(minimal()), [], 'no region at all, as before');
  // A placed region is a region still: it may have a label, and holds anything a region holds.
  const full = placing('navigation', 'main');
  full.screens[0].items[1] = region('main', { label: 'Rooms right now', items: [group([{ container: 'region', label: 'Ground floor', items: [line] }]), { role: 'action', text: 'Book Room 2', primary: true }] });
  assert.deepEqual(validate(full), []);
  // A letter copy carries it as its source does.
  const { firstIdea, ...copy } = full;
  assert.deepEqual(validate(copy, { sealed: true }), []);
});

test('place is one of four words, and belongs to a region', () => {
  for (const bad of ['sidebar', 'Main', 'main ', 'header', 'footer', 'left', '', 3, true, null, ['main']]) {
    refuses(changed(p => { p.screens[0].items = [region('main'), { ...region(), place: bad }]; }), 'screens[0].items[1]', /^screens\[0\]\.items\[1\]: "place" must be "navigation", "bar", "main" or "beside"; it is /);
  }
  refuses(placing('mian'), 'screens[0].items[0]', /"place" must be "navigation", "bar", "main" or "beside"; it is "mian"$/);
  for (const container of ['group', 'expansion']) {
    refuses(
      changed(p => { p.screens[0].items = [region('main'), { container, label: 'Room 2', place: 'beside', items: [line] }]; }),
      'screens[0].items[1]',
      new RegExp(`"place" belongs to a region, not to a "${container}"$`),
    );
  }
  // A role has no such key, and neither has a screen or the proposal.
  refuses(changed(p => { p.screens[0].items = [region('main'), { role: 'nav', text: 'Places', options: ['Today'], place: 'navigation' }]; }), 'screens[0].items[1]', /unknown key "place"$/);
  refuses(changed(p => { p.screens[0].place = 'main'; }), 'screens[0]', /unknown key "place"$/);
  refuses(changed(p => { p.place = 'main'; }), 'proposal', /unknown key "place"$/);
});

test('place is only on a direct item of a screen: never inside another container, never in a dialog', () => {
  for (const holder of ['region', 'group', 'expansion']) {
    refuses(
      changed(p => { p.screens[0].items = [{ container: holder, label: 'Rooms', ...(holder === 'region' ? { place: 'main' } : {}), items: [region(holder === 'region' ? 'beside' : 'main')] }]; }),
      'screens[0].items[0].items[0]',
      /"place" belongs to a region that is a direct item of its screen; this one is inside another container$/,
    );
  }
  refuses(changed(p => { p.screens[1].items = [region('main')]; }), 'screens[1].items[0]', /"place" belongs to a region of a screen; a dialog has no areas$/);
  refuses(changed(p => { p.screens[1].items.push(group([region('beside')])); }), 'screens[1].items[1].items[0]', /a dialog has no areas$/);
  // And that is all that is said of it: a dialog is never a screen that places its regions.
  refuses(changed(p => { p.screens[1].items = [region('bar'), line]; }), 'screens[1].items[0]', /a dialog has no areas$/);
  // A dialog over a screen that places its regions is a dialog like any other.
  const p = placing('navigation', 'main');
  assert.deepEqual(validate(p), []);
  assert.equal(p.screens[1].container, 'dialog');
});

test('each area is on a screen once at most; another screen has its own', () => {
  for (const place of PLACES) {
    const places = place === 'main' ? ['main', 'bar', 'main'] : ['main', place, place];
    const second = places.lastIndexOf(place);
    refuses(placing(...places), `screens[0].items[${second}]`, new RegExp(`a second "${place}" on this screen; the first is screens\\[0\\]\\.items\\[${places.indexOf(place)}\\]$`));
  }
  // A third is told of the first too.
  assert.deepEqual(validate(placing('main', 'main', 'main')), [
    'screens[0].items[1]: a second "main" on this screen; the first is screens[0].items[0]',
    'screens[0].items[2]: a second "main" on this screen; the first is screens[0].items[0]',
  ]);
  const two = placing('navigation', 'main');
  two.screens.push({ id: 'rooms', title: 'Rooms', container: 'screen', items: [region('navigation'), region('main')] });
  assert.deepEqual(validate(two), [], 'the same areas on two screens');
});

test('a screen that places any region has a main', () => {
  for (const places of [['navigation'], ['bar'], ['beside'], ['navigation', 'bar', 'beside']]) {
    refuses(placing(...places), 'screens[0]', /^screens\[0\]: a screen that places a region has a "main"; this one has none$/);
  }
  // It is said at the screen, before what is said of its items.
  const p = placing('navigation', 'bar');
  p.screens[0].items[1].items = [];
  assert.deepEqual(validate(p).map(error => error.split(': ')[0]), ['screens[0]', 'screens[0].items[1]']);
});

test('on a screen that places a region, every direct item is a placed region: nothing floats outside the areas', () => {
  const floating = /on a screen that places a region, every direct item is a placed region; this /;
  refuses(changed(p => { p.screens[0].items = [region('main'), line]; }), 'screens[0].items[1]', new RegExp(`${floating.source}"text" is outside the areas$`));
  refuses(changed(p => { p.screens[0].items = [{ role: 'heading', text: 'Rooms' }, region('main')]; }), 'screens[0].items[0]', new RegExp(`${floating.source}"heading" is outside the areas$`));
  refuses(changed(p => { p.screens[0].items = [region('main'), group([line])]; }), 'screens[0].items[1]', new RegExp(`${floating.source}"group" is outside the areas$`));
  refuses(placing('main', null), 'screens[0].items[1]', new RegExp(`${floating.source}"region" has no "place"$`));
  assert.deepEqual(validate(placing(null, 'navigation', 'main', null)).map(error => error.split(': ')[0]), ['screens[0].items[0]', 'screens[0].items[3]']);
  // Inside an area, anything goes as before: a region with no place, a group, a role.
  assert.deepEqual(validate(changed(p => { p.screens[0].items = [region('main', { items: [line, region(), group([line])] })]; })), []);
});

test('a faulty place is one fault: it is not said again by the rules that count the areas', () => {
  // A mistyped main is not also a screen without a main, and a mistyped value is not a region outside the areas.
  refuses(placing('navigation', 'mian'), 'screens[0].items[1]', /"place" must be /);
  refuses(changed(p => { p.screens[0].items = [region('navigation'), { container: 'group', place: 'main', items: [line] }]; }), 'screens[0].items[1]', /"place" belongs to a region, not to a "group"$/);
  // A mistyped container that carries a place is one fault too.
  refuses(changed(p => { p.screens[0].items = [region('navigation'), { container: 'regoin', place: 'main', items: [line] }]; }), 'screens[0].items[1]', /: unknown container "regoin"$/);
  // So is an item that is a role and a container at once, whatever place it carries.
  refuses(changed(p => { p.screens[0].items = [{ role: 'text', text: 'Rooms', container: 'region', place: 'main', items: [line] }, line]; }), 'screens[0].items[0]', /has a "role" and a "container"/);
  // A place on something that places nothing does not make the screen one that places its regions.
  refuses(changed(p => { p.screens[0].items.push({ container: 'group', place: 'main', items: [line] }); }), 'screens[0].items[2]', /"place" belongs to a region, not to a "group"$/);
  refuses(changed(p => { p.screens[0].items.push(region('sidebar')); }), 'screens[0].items[2]', /"place" must be /);
});

// R195 of the board change: a structure that needs more than five screens is more than one design.
test('a proposal holds five screens at most, dialogs counted', () => {
  const extra = n => Array.from({ length: n }, (_, i) => ({ id: `step-${i + 1}`, title: `Step ${i + 1}`, container: i % 2 ? 'dialog' : 'screen', ...(i % 2 ? { over: 'today' } : {}), items: [line] }));
  assert.deepEqual(validate(changed(p => { p.screens.push(...extra(3)); })), [], 'five: two screens, a dialog and two more');
  assert.deepEqual(validate(changed(p => { p.screens.push(...extra(4)); })), [
    'proposal: "screens" holds 6 entries; a proposal holds 5 at most, dialogs counted: a structure that needs more is more than one design',
  ]);
  refuses(changed(p => { p.screens.push(...extra(9)); }), 'proposal', /"screens" holds 11 entries; a proposal holds 5 at most/);
  // The sixth is still read: what is wrong in it is said too.
  const p = changed(p => { p.screens.push(...extra(4)); });
  p.screens[5].items[0] = { role: 'card', text: 'Room 2' };
  assert.deepEqual(validate(p).map(error => error.split(': ')[0]), ['proposal', 'screens[5].items[0]']);
  const { firstIdea, ...copy } = changed(p => { p.screens.push(...extra(4)); });
  assert.equal(validate(copy, { sealed: true }).length, 1, 'a letter copy too');
});

// The sealed form: a letter copy, as the merge writes it. These six stay in the source file.
const SOURCE_ONLY = ['firstIdea', 'author', 'engine', 'track', 'model', 'source'];
const letterCopy = () => {
  const { firstIdea, ...copy } = minimal();
  return copy;
};
const stays = key => `proposal: "${key}" stays in the source file; a letter copy does not carry it`;

test('the sealed form: a letter copy validates; the source form still requires firstIdea', () => {
  assert.deepEqual(validate(letterCopy(), { sealed: true }), []);
  for (const name of FIXTURES) {
    const { firstIdea, track, ...copy } = fixture(name);
    assert.deepEqual(validate(copy, { sealed: true }), [], name);
  }
  // The source form is the default, and what { sealed: false } asks for.
  for (const options of [undefined, {}, { sealed: false }]) {
    assert.deepEqual(validate(letterCopy(), options), ['proposal: "firstIdea" is missing'], JSON.stringify(options));
    assert.deepEqual(validate(minimal(), options), [], JSON.stringify(options));
  }
  const provenance = { author: 'describer-2', engine: 'claude', track: 'system', model: 'opus', source: 'proposals/b.json' };
  assert.deepEqual(validate(changed(p => Object.assign(p, provenance))), [], 'a source may say who made it');
});

test('the sealed form refuses each of firstIdea, author, engine, track, model and source: one error each, naming it', () => {
  for (const key of SOURCE_ONLY) {
    for (const value of ['a line of text', 5, '']) {
      assert.deepEqual(validate({ ...letterCopy(), [key]: value }, { sealed: true }), [stays(key)], `${key}: ${JSON.stringify(value)}`);
    }
  }
  // Several at once: one error each, in the order of the proposal, among its other keys' errors.
  const many = { source: 's', name: 'Free rooms first', layout: 'two columns', firstIdea: 'f', model: 'm', ...letterCopy(), author: 'a', track: 'fresh', engine: 'e' };
  assert.deepEqual(validate(many, { sealed: true }), [stays('source'), 'proposal: unknown key "layout"', stays('firstIdea'), stays('model'), stays('author'), stays('track'), stays('engine')]);
});

test('the sealed form checks everything else as the source form does', () => {
  const bad = changed(p => {
    delete p.bet;
    p.layout = 'two columns';
    p.screens[0].items[0].role = 'card';
    p.screens[1].over = 'agenda';
  });
  const { firstIdea, ...badCopy } = bad;
  assert.equal(validate(bad).length, 4);
  assert.deepEqual(validate(badCopy, { sealed: true }), validate(bad));
  assert.deepEqual(validate(null, { sealed: true }), ['proposal: must be an object']);
  refuses(changed(p => { p.screens[0].track = 'system'; }), 'screens[0]', /unknown key "track"/);
  const { firstIdea: _, ...nested } = changed(p => { p.screens[0].author = 'a'; });
  assert.deepEqual(validate(nested, { sealed: true }), ['screens[0]: unknown key "author"']);
});

test('the letter order is the proposal\'s keys minus the six that stay in the source; a screen and an item keep every key', () => {
  assert.deepEqual([...STRIPPED].sort(), [...SOURCE_ONLY].sort());
  assert.deepEqual([...ORDER.letter].sort(), KEYS.proposal.filter(key => !SOURCE_ONLY.includes(key)).sort());
  assert.deepEqual([...ORDER.screen].sort(), [...KEYS.screen].sort());
  assert.deepEqual([...ORDER.role].sort(), [...KEYS.role].sort());
  assert.deepEqual([...ORDER.container].sort(), [...KEYS.container].sort());
  // And the order itself, as ruled.
  assert.deepEqual(ORDER.letter, ['name', 'bet', 'cost', 'absent', 'hardest', 'screens']);
  assert.deepEqual(ORDER.screen, ['id', 'title', 'container', 'over', 'note', 'items']);
  assert.deepEqual(ORDER.role, ['role', 'text', 'id', 'note', 'primary', 'options']);
  assert.deepEqual(ORDER.container, ['container', 'place', 'label', 'open', 'items']);
});

test('every error is reported at once, in the order of the proposal', () => {
  const p = changed(p => {
    delete p.bet;
    p.screens[0].items[0].role = 'card';
    p.screens[1].over = 'agenda';
  });
  assert.deepEqual(validate(p), [
    'proposal: "bet" is missing',
    'screens[0].items[0]: unknown role "card"',
    'screens[1]: "over" names "agenda", which is no screen in this proposal',
  ]);
});

// The grey kit. Its class names are a contract a project kit restyles; these tests pin what the brief asks of it.

// The classes of the page itself and of a screen's areas came with R194 to R197 of the board change.
const AREAS = PLACES.map(place => `ux-${place}`);
const CLASSES = ['ux-option', 'ux-map', 'ux-frame', 'ux-window', 'ux-screen', 'ux-dialog', 'ux-over', ...CONTAINERS.map(c => `ux-${c}`), ...AREAS, ...ROLES.map(r => `ux-${r}`), 'ux-note', 'ux-account'];
const kit = () => ({
  css: read('kit/grey/kit.css').replace(/\/\*[\s\S]*?\*\//g, ''),
  parts: read('kit/grey/parts.html'),
  contract: read('kit/KIT-CONTRACT.md'),
});

// The text inside the braces that open at `from` (an index at or before the `{`).
function block(text, from) {
  const open = text.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error('unbalanced braces');
}
const tokens = body => new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
const isHex = value => /^#[0-9a-f]{6}$/i.test(value);
const flat = text => text.replace(/\s+/g, ' ');
const count = (text, part) => text.split(part).length - 1;

test('the contract names every class, kit.css styles each, and parts.html shows each, labelled, adding none', () => {
  const { css, parts, contract } = kit();
  const all = [...CLASSES, 'ux-action.is-primary'];
  const conveys = [...contract.matchAll(/^- `([\w.-]+)`: \S/gm)].map(([, name]) => name);
  assert.deepEqual(conveys.sort(), [...all].sort(), 'KIT-CONTRACT.md gives each class one line on what it must convey');
  for (const name of CLASSES) assert.match(css, new RegExp(`\\.${name}(?![\\w-])`), `kit.css styles ${name}`);
  assert.match(css, /\.ux-action\.is-primary(?![\w-])/);
  const cssClasses = new Set([...css.matchAll(/\.([a-z][\w-]*)/gi)].map(([, name]) => name));
  assert.deepEqual([...cssClasses].filter(name => ![...CLASSES, 'is-primary'].includes(name)), [], 'kit.css adds no class');

  const used = [...parts.matchAll(/class="([^"]*)"/g)].map(([, value]) => value.split(/\s+/));
  assert.deepEqual([...new Set(used.flat())].sort(), [...CLASSES, 'is-primary'].sort(), 'parts.html shows every class and adds none');
  assert.ok(used.filter(names => names.includes('is-primary')).every(names => names.includes('ux-action')), 'is-primary only on an action');
  // An area's class is on a region, after ux-region, and no other part carries two classes.
  for (const names of used.filter(names => names.length > 1)) {
    assert.ok(names.join(' ') === 'ux-action is-primary' || (names.length === 2 && names[0] === 'ux-region' && AREAS.includes(names[1])), `class="${names.join(' ')}"`);
  }
  for (const area of AREAS) assert.equal(used.filter(names => names.includes(area)).length, 1, `parts.html shows ${area} once, on one screen`);
  const visible = parts.replace(/<[^>]*>/g, ' ');
  for (const name of all) assert.match(visible, new RegExp(`(^|[^\\w.-])${name.replace('.', '\\.')}(?![\\w.-])`), `parts.html labels ${name}`);
  assert.match(parts, /<[a-z][^>]*\sdata-ux="[a-z][a-z0-9-]*"[^>]*>/, 'a part in parts.html carries a stable id');
});

// The contract's markup table, one row per class: | `ux-heading` | `<h3>` | where it sits, what it holds |
const rows = contract =>
  [...contract.matchAll(/^\| `([\w.-]+)` \| `<([a-z][a-z0-9]*)\b[^`]*>` \| (.*) \|$/gm)].map(([, name, element, holds]) => ({ name, element, holds }));
// The parts that carry options, and the fewest each shows.
const OPTIONED = { 'ux-choice': 2, 'ux-list': 1, 'ux-nav': 1 };
// Every element of a page that carries a class: its tag, its classes and the rest of its attributes.
const classed = page =>
  [...page.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)].flatMap(([, tag, attrs]) => {
    const found = /\sclass="([^"]*)"/.exec(attrs);
    return found ? [{ tag, classes: found[1].split(/\s+/), attrs }] : [];
  });
// The elements carrying a contract class; `ux-action.is-primary` means both classes on one element.
const carrying = (page, name) => classed(page).filter(e => name.split('.').every(c => e.classes.includes(c)));

test('every class the contract names is in kit.css and parts.html, and parts.html follows the markup the contract states', () => {
  const { css, parts, contract } = kit();
  const named = new Set([...contract.matchAll(/\bux-[a-z]+(?:\.is-primary)?/g)].map(([name]) => name));
  for (const name of named) {
    assert.match(css, new RegExp(`\\.${name.replace('.', '\\.')}(?![\\w-])`), `kit.css styles ${name}`);
    assert.ok(carrying(parts, name).length > 0, `parts.html uses ${name}`);
  }

  const table = rows(contract);
  assert.deepEqual(table.map(r => r.name).sort(), [...CLASSES, 'ux-action.is-primary'].sort(), 'the contract gives each class one row');
  for (const { name, element, holds } of table) {
    for (const { tag } of carrying(parts, name)) assert.equal(tag, element, `parts.html draws ${name} on <${element}>`);
    assert.equal(/\boptions\b/.test(holds), name in OPTIONED, `the contract's row for ${name} speaks of options only if it has them`);
  }
  const optionLists = [...parts.matchAll(/<[a-z]+ class="(ux-[a-z]+)"[^>]*>[^<]*<ul>((?:\s*<li(?: aria-current="page")?>[^<]+<\/li>)+)\s*<\/ul>/g)];
  const account = parts.match(/<section class="ux-account">\n  <h2>[^<]+<\/h2>\n  <dl>[\s\S]*?<\/dl>\n<\/section>\n\n<\/body>/)?.[0];
  assert.ok(account, 'the account closes the specimen page, as it closes a board: a heading, then its terms');
  assert.equal(count(account, '<ul>'), 1, 'one of its terms holds a list');
  assert.equal((parts.match(/<ul\b/g) ?? []).length, optionLists.length + 1, 'every other list in parts.html is the options of a part');
  // The place she is at: one place of one nav, marked as the drawing script marks it.
  assert.deepEqual(parts.match(/<[a-z]+[^>]*\saria-current="[^"]*"[^>]*>/g), ['<li aria-current="page">']);
  assert.match(parts, /<nav class="ux-nav"[^>]*>[^<]*<ul>(?:\s*<li>[^<]+<\/li>)*\s*<li aria-current="page">/, 'on a place of a nav');
  assert.match(css, /\.ux-nav > ul > li\[aria-current\]/, 'and kit.css styles it there');
  for (const [, name, items] of optionLists) assert.ok(items.match(/<li>/g).length >= (OPTIONED[name] ?? Infinity), `${name} shows its options`);
  for (const name of Object.keys(OPTIONED)) {
    assert.equal(optionLists.filter(([, n]) => n === name).length, carrying(parts, name).length, `every ${name} in parts.html shows its options`);
  }
  const frames = carrying(parts, 'ux-frame');
  assert.ok(frames.every(e => /\sdata-screen="[a-z][a-z0-9-]*"/.test(e.attrs)), 'every frame names its screen in data-screen');
  assert.equal(parts.match(/<section class="ux-frame"[^>]*>\s*<header>/g).length, frames.length, 'a frame opens with its caption header');
  // Then its window, which holds the screen or the dialog and nothing else.
  assert.equal(parts.match(/<\/header>\n  <div class="ux-window">\n    <div class="ux-(?:screen|dialog)">\n[\s\S]*?\n    <\/div>\n  <\/div>\n<\/section>/g).length, frames.length, 'a frame closes with its window');
  assert.equal(carrying(parts, 'ux-window').length, frames.length);
  assert.equal(carrying(parts, 'ux-screen').length + carrying(parts, 'ux-dialog').length, frames.length);
  // The page's own parts, where the drawing script puts them: the title first, the map before the frames.
  assert.match(parts, /<body>\n\n<header class="ux-option">\n  <h1>[^<]+<\/h1>\n<\/header>\n/);
  const map = parts.match(/\n<section class="ux-map">\n  <ol>\n[\s\S]*?\n  <\/ol>\n<\/section>\n/)?.[0];
  assert.ok(map && parts.indexOf(map) < parts.indexOf('<section class="ux-frame"'), 'the map comes before the frames');
  assert.doesNotMatch(map, /data-ux|data-screen|class="(?!ux-map")/, 'the map carries no class but its own, and no id');
  assert.deepEqual([...map.matchAll(/<dt>([^<]*)<\/dt>/g)].map(([, word]) => word), [...PLACES, 'dialog', 'screen'], 'the map shows each area by the format\'s word, a dialog under its screen, and a screen that places none');
  assert.equal(count(map, '<b>'), 3);
  // The areas, on one screen: each a region that is a direct item of it.
  for (const area of AREAS) assert.match(parts, new RegExp(`\\n    <div class="ux-screen">\\n(?:      [^\\n]*\\n|        [^\\n]*\\n)*?      <section class="ux-region ${area}">\\n`), `${area} is a direct item of its screen`);
  assert.equal(parts.match(/<details class="ux-expansion"[^>]*>\s*<summary>[^<\s][^<]*<\/summary>/g).length, carrying(parts, 'ux-expansion').length, 'an expansion opens with its labelled summary');

  const preludes = [...css.matchAll(/([^{}]+)\{/g)].map(([, prelude]) => prelude.trim()).filter(prelude => !prelude.startsWith('@'));
  const byName = new Set(preludes.flatMap(prelude => [...prelude.matchAll(/(?:^|[\s>+~,(])([a-z][a-z0-9]*)(?![\w-])/g)].map(([, tag]) => tag)));
  assert.deepEqual([...byName].sort(), ['b', 'body', 'dd', 'dl', 'dt', 'h1', 'h2', 'header', 'li', 'ol', 'summary', 'ul'], 'kit.css styles by class, and by name only the elements the contract places');
  const styled = flat(contract.slice(contract.indexOf('### What the stylesheet styles by name')));
  for (const tag of byName) assert.ok(styled.includes(`\`${tag}\``), `the contract says ${tag} is styled by name`);
  // A list is styled where the contract puts one: the options of a part, the map, the account.
  const LISTED = [...Object.keys(OPTIONED), 'ux-map', 'ux-account', 'ux-navigation'];
  for (const prelude of preludes.filter(prelude => /(?:^|[\s>+~,(])(?:ul|ol|li|dl|dt|dd|b|h1)(?![\w-])/.test(prelude))) {
    const named = [...prelude.matchAll(/\.(ux-[a-z]+)/g)].map(([, name]) => name);
    assert.ok(named.length > 0 && named.every(name => LISTED.includes(name) || name === 'ux-option'), `${prelude}: a list is styled as options, in the map or in the account only`);
  }
  for (const prelude of preludes.filter(prelude => /(?:^|[\s>+~,(])(?:ol|dt|dd|dl|b)(?![\w-])/.test(prelude))) assert.match(prelude, /\.ux-(?:map|account)\b/, prelude);
  for (const selector of preludes.flatMap(prelude => prelude.split(/,(?![^(]*\))/)).map(selector => selector.trim())) {
    if (selector.includes('.ux-frame')) assert.ok(selector.startsWith('.ux-frame'), `${selector}: no selector depends on a frame's parent`);
  }
});

test('the document shell: the contract states it and parts.html follows it', () => {
  const { parts, contract } = kit();
  for (const line of ['<!doctype html>', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">', '<link rel="stylesheet" href="kit.css">']) {
    assert.ok(contract.includes(`\`${line}\``), `the contract states ${line}`);
    assert.ok(parts.includes(line), `parts.html has ${line}`);
  }
  assert.ok(parts.startsWith('<!doctype html>'), 'parts.html opens with its doctype');
});

// R197 of the board change: still one neutral kit, greys and one accent for the primary action, in both themes.
test('the grey kit: greys, one font stack, one accent kept for the primary action, light and dark sets, no motion, nothing loaded', () => {
  const { css, parts } = kit();
  const light = tokens(block(css, css.search(/:root\s*\{/)));
  const accent = light.get('--ux-primary');
  const grey = v => isHex(v) && v.slice(1, 3) === v.slice(3, 5) && v.slice(3, 5) === v.slice(5, 7);
  assert.ok(isHex(accent) && !grey(accent), 'the accent is a colour, written as #rrggbb');
  for (const [hex] of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) assert.ok(grey(hex) || hex === accent, `${hex} is a grey written as #rrggbb, or the one accent`);
  assert.equal(count(css, accent), 1, 'the accent is written once');
  assert.doesNotMatch(css, /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i, 'colours are written as hex');
  // Every colour a rule uses is a colour of the kit: a token whose every value is a grey, a grey hex, a keyword,
  // or, in the primary action alone, the accent.
  const values = new Map();
  for (const [, name, value] of css.matchAll(/(--ux-[\w-]+)\s*:\s*([^;]+);/g)) values.set(name, [...(values.get(name) ?? []), value.trim()]);
  const token = v => /^var\(--ux-[\w-]+\)$/.test(v) && (values.get(v.slice(4, -1)) ?? []).length > 0 && values.get(v.slice(4, -1)).every(grey);
  const kitColour = v => grey(v) || token(v) || ['transparent', 'inherit', 'currentColor'].includes(v);
  const notAColour = /^(0|-?\d*\.?\d+(px|rem|em|%)|none|solid|dashed|dotted|double|underline|inset)$/;
  const coloured = /^(color|background|background-color|border|border-(top|right|bottom|left)|border(-(top|right|bottom|left))?-color|outline|outline-color|box-shadow|text-decoration|text-decoration-color|fill|stroke|caret-color|accent-color|column-rule)$/;
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => [selector.trim(), body]);
  let seen = 0;
  for (const [selector, body] of rules) {
    for (const [, property, value] of body.matchAll(/(?:^|[;\s])([a-z][a-z-]*)\s*:\s*([^;{}]+);/g)) {
      if (!coloured.test(property)) continue;
      for (const part of value.trim().split(/[\s,]+/)) {
        seen++;
        const primary = selector === '.ux-action.is-primary' && ['var(--ux-primary)', 'var(--ux-on-primary)'].includes(part);
        assert.ok(kitColour(part) || notAColour.test(part) || primary, `${selector} { ${property}: ${value.trim()} } — ${part} is not a grey of the kit`);
      }
    }
  }
  assert.ok(seen > 60, `${seen} colours read`);
  // A picture drawn by the stylesheet (the window's dots, a media's cross) is drawn in the kit's greys too.
  for (const [, value] of css.matchAll(/background-image\s*:\s*([^;]+);/g)) {
    for (const [colour] of value.matchAll(/var\([^)]*\)|#[0-9a-f]+/gi)) assert.ok(token(colour), `background-image: ${colour}`);
  }

  assert.equal((css.match(/font-family\s*:/g) ?? []).length, 1, 'one font stack');
  for (const [, value] of css.matchAll(/[\s;{]font\s*:\s*([^;}]+)/g)) assert.equal(value.trim(), 'inherit');
  assert.doesNotMatch(parts, /<(code|pre|kbd|samp|tt)\b/, 'parts.html brings in no monospace face');

  const darkAt = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.ok(darkAt >= 0, 'a dark set under prefers-color-scheme');
  const dark = tokens(block(block(css, darkAt), 0));
  const kept = ['--ux-primary', '--ux-on-primary'];
  assert.deepEqual([...dark.keys()].sort(), [...light].filter(([name, value]) => isHex(value) && !kept.includes(name)).map(([name]) => name).sort(), 'the dark set redefines every grey but the primary');
  // One accent, the same in both sets, and its label reads on it: 4.5 to 1 at least.
  assert.equal((css.match(/--ux-primary\s*:/g) ?? []).length, 1, 'one accent, the same in both sets');
  const channel = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = hex => [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => sum + weight * channel(parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255), 0);
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  assert.ok(contrast(accent, light.get('--ux-on-primary')) >= 4.5, `the label on the accent: ${contrast(accent, light.get('--ux-on-primary')).toFixed(2)} to 1`);
  // What she reads is readable in both sets: the ink and the muted ink on the page, the surface and the fill.
  for (const [name, set] of [['light', light], ['dark', new Map([...light, ...dark])]]) {
    for (const ink of ['--ux-ink', '--ux-muted']) {
      for (const ground of ['--ux-page', '--ux-surface', '--ux-fill', '--ux-well']) {
        assert.ok(contrast(set.get(ink), set.get(ground)) >= 4.5, `${name}: ${ink} on ${ground} is ${contrast(set.get(ink), set.get(ground)).toFixed(2)} to 1`);
      }
    }
  }
  for (const [selector, body] of rules) {
    if (body.includes('var(--ux-primary)')) assert.equal(selector, '.ux-action.is-primary', 'the accent is kept for the primary action');
  }

  assert.doesNotMatch(css, /\b(transition|animation)[\w-]*\s*:|@keyframes|scroll-behavior/, 'no motion');
  const note = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selector]) => selector.trim() === '.ux-note');
  assert.match(note?.[2] ?? '', /(?:^|[\s;])margin:\s*0;/, 'a note keeps no browser margin, so a caption with a note sits like one without');
  assert.doesNotMatch(css, /@import|url\(/, 'kit.css loads nothing');
  assert.deepEqual([...parts.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag), ['<link rel="stylesheet" href="kit.css">'], 'parts.html links kit.css only');
  assert.doesNotMatch(parts, /<script|<style|\sstyle="|\ssrc=/, 'parts.html is drawn by kit.css alone');
});

// R196 and R197 of the board change: the kit lays a screen out as a page, at each width, and a screen with no area as one column.
test('the grey kit lays a screen that has a main out as a page: narrow, one column of areas; wide, the navigation at the side and what is beside next to the main part', () => {
  const { css, contract } = kit();
  for (const selector of ['.ux-screen:has(> .ux-main)', '.ux-window:has(> .ux-dialog)']) {
    assert.ok(contract.includes(`\`${selector}\``), `the contract states ${selector}`);
    assert.ok(css.includes(`${selector} {`), `kit.css lays out by ${selector}`);
  }
  const areasIn = text => [...block(text, text.indexOf('.ux-screen:has(> .ux-main) {')).matchAll(/"([^"]+)"/g)].map(([, row]) => row);
  const wideAt = css.search(/@media\s*\(min-width:\s*[\d.]+rem\)/);
  assert.ok(wideAt > 0 && count(css, '@media') === 2, 'two sets of rules by media: the dark colours, and the wide page');
  const [narrow, wide] = [css.slice(0, wideAt), block(css, wideAt)];
  assert.deepEqual(areasIn(narrow), ['bar', 'navigation', 'main', 'beside'], 'narrow: the bar, the navigation as a bar, the main part, and what is beside under it');
  assert.deepEqual(areasIn(wide), ['navigation bar bar', 'navigation main beside'], 'wide: the navigation as a column, the bar across the top of the rest, beside next to the main part');
  for (const place of PLACES) assert.match(narrow, new RegExp(`\\.ux-${place} \\{\\s+grid-area: ${place};`), `${place} is laid in its own area`);
  // An area the screen does not place takes no room: the side columns are as wide as what is in them.
  assert.match(block(wide, wide.indexOf('.ux-screen:has(> .ux-main) {')), /grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  // Wide, the places of the navigation run down it; anywhere else they run across.
  assert.match(wide, /\.ux-navigation \.ux-nav > ul \{\s+flex-direction: column;/);
  assert.doesNotMatch(narrow, /flex-direction: column/);
  // A screen with no area keeps one readable column, and the main part a readable width.
  assert.match(block(narrow, narrow.search(/\n\.ux-screen \{/)), /max-width: \d+rem;\s+margin: 0 auto;/);
  assert.match(wide, /\.ux-main > \* \{\s+max-width: \d+rem;/);
});

// R161 of the dry run: the specimen is copied unchanged into every project kit, shown to the founder and read by
// makers, and its room names and 12-hour times were taken for facts of the product.
test('the specimen holds neutral words that name each part, no product\'s nouns, and its times in 24-hour zero-padded form', () => {
  const { parts } = kit();
  const visible = parts.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  // Nothing of the room-booking example the rest of the kit uses, in what is read or in an id.
  const PRODUCT = /\b(?:rooms?|clinic|patients?|walk-ins?|book(?:ing|ed|s)?|desk|sala|jard[ií]n|gym|cleaned|occupied|waiting|floor plan|wall chart)\b/i;
  assert.doesNotMatch(visible, PRODUCT);
  for (const [, attribute, value] of parts.matchAll(/\s(data-ux|data-screen)="([^"]*)"/g)) assert.doesNotMatch(value.replace(/-/g, ' '), PRODUCT, `${attribute}="${value}"`);
  assert.doesNotMatch(visible, /\b[A-Z][a-z]+ [A-Z]\.(?: |,|$)/, 'no person is named');
  // The words name the part they stand in.
  for (const words of ['Row title', 'Status', 'Primary action', 'Field label', 'Heading', 'Link']) assert.ok(visible.includes(words), words);
  assert.match(parts, /<button class="ux-action is-primary" type="button">Primary action<\/button>/);
  assert.match(parts, /<p class="ux-status" data-ux="[a-z-]+">Status\b[^<]*<\/p>/);
  assert.match(visible, /The words name the part they stand in, and say nothing of any product/);
  // Times: each written HH:MM on the 24-hour clock, zero-padded; one before ten and one after noon show both.
  const times = visible.match(/\b\d{1,2}[:.h]\d{2}\b/g) ?? [];
  assert.ok(times.length >= 2, `${times.length} times`);
  for (const time of times) assert.match(time, /^(?:[01]\d|2[0-3]):[0-5]\d$/, time);
  assert.ok(times.some(time => time < '10:00') && times.some(time => time >= '13:00'), times.join(' '));
  assert.doesNotMatch(visible, /\b\d{1,2}(?::\d{2})? ?(?:a\.?m\.?|p\.?m\.?)\b/i, 'no 12-hour time');
});

test('no product name appears in the kit, the format or the fixtures', () => {
  const files = [
    'scripts/lib/walkthrough.mjs',
    'kit/KIT-CONTRACT.md',
    ...readdirSync(new URL('../kit/grey/', import.meta.url)).map(f => `kit/grey/${f}`),
    ...FIXTURES.map(name => `tests/fixtures/proposals/${name}.json`),
  ];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});
