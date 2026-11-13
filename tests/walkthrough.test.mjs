import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { ROLES, CONTAINERS, validate } from '../scripts/lib/walkthrough.mjs';

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

test('the vocabulary is ten roles and three containers', () => {
  assert.deepEqual(ROLES, ['heading', 'text', 'choice', 'input', 'action', 'list', 'status', 'media', 'link', 'nav']);
  assert.deepEqual(CONTAINERS, ['region', 'group', 'expansion']);
});

test('each fixture validates: two screens, the system track, and real words', () => {
  for (const name of FIXTURES) {
    const p = fixture(name);
    assert.deepEqual(validate(p), [], name);
    assert.equal(p.screens.length, 2, name);
    assert.equal(p.track, 'system', name);
  }
  assert.ok(FIXTURES.some(name => /[^\x00-\x7f]/.test(read(`tests/fixtures/proposals/${name}.json`))), 'one fixture holds non-ASCII text');
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
  refuses(changed(p => { p.screens[0].items.push({ container: 'expansion', open: 'yes', items: [line] }); }), 'screens[0].items[2]', /"open" must be true or false/);
  assert.deepEqual(validate(changed(p => { p.screens[0].items.push({ container: 'expansion', open: false, items: [line] }); })), []);
});

test('options are a list of at least one line of text', () => {
  for (const bad of ['15 min, 30 min', [], {}]) {
    refuses(changed(p => { p.screens[1].items[0].options = bad; }), 'screens[1].items[0]', /"options" must be a list of at least one line of text/);
  }
  refuses(changed(p => { p.screens[1].items[0].options = ['15 min', ' ']; }), 'screens[1].items[0].options[1]', /must be a line of text/);
  refuses(changed(p => { p.screens[1].items[0].options = [15]; }), 'screens[1].items[0].options[0]', /must be a line of text/);
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

const CLASSES = ['ux-frame', 'ux-screen', 'ux-dialog', ...CONTAINERS.map(c => `ux-${c}`), ...ROLES.map(r => `ux-${r}`), 'ux-note'];
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

test('the contract names every class, kit.css styles each, and parts.html shows each, labelled, adding none', () => {
  const { css, parts, contract } = kit();
  const all = [...CLASSES, 'ux-action.is-primary'];
  for (const name of all) assert.ok(contract.includes(`\`${name}\``), `KIT-CONTRACT.md names ${name}`);
  for (const name of CLASSES) assert.match(css, new RegExp(`\\.${name}(?![\\w-])`), `kit.css styles ${name}`);
  assert.match(css, /\.ux-action\.is-primary(?![\w-])/);
  const cssClasses = new Set([...css.matchAll(/\.([a-z][\w-]*)/gi)].map(([, name]) => name));
  assert.deepEqual([...cssClasses].filter(name => ![...CLASSES, 'is-primary'].includes(name)), [], 'kit.css adds no class');

  const used = [...parts.matchAll(/class="([^"]*)"/g)].map(([, value]) => value.split(/\s+/));
  assert.deepEqual([...new Set(used.flat())].sort(), [...CLASSES, 'is-primary'].sort(), 'parts.html shows every class and adds none');
  assert.ok(used.filter(names => names.includes('is-primary')).every(names => names.includes('ux-action')), 'is-primary only on an action');
  const visible = parts.replace(/<[^>]*>/g, ' ');
  for (const name of all) assert.match(visible, new RegExp(`(^|[^\\w.-])${name.replace('.', '\\.')}(?![\\w.-])`), `parts.html labels ${name}`);
  assert.match(parts, /<[a-z][^>]*\sdata-ux="[a-z][a-z0-9-]*"[^>]*>/, 'a part in parts.html carries a stable id');
});

test('the grey kit: greys, one font stack, one mid-grey kept for the primary action, light and dark sets, no motion, nothing loaded', () => {
  const { css, parts } = kit();
  for (const [hex] of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    assert.ok(isHex(hex) && hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7), `${hex} is a grey written as #rrggbb`);
  }
  assert.doesNotMatch(css, /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i, 'colours are written as hex');

  assert.equal((css.match(/font-family\s*:/g) ?? []).length, 1, 'one font stack');
  for (const [, value] of css.matchAll(/[\s;{]font\s*:\s*([^;}]+)/g)) assert.equal(value.trim(), 'inherit');
  assert.doesNotMatch(parts, /<(code|pre|kbd|samp|tt)\b/, 'parts.html brings in no monospace face');

  const light = tokens(block(css, css.search(/:root\s*\{/)));
  const darkAt = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.ok(darkAt >= 0, 'a dark set under prefers-color-scheme');
  const dark = tokens(block(block(css, darkAt), 0));
  const kept = ['--ux-primary', '--ux-on-primary'];
  assert.deepEqual([...dark.keys()].sort(), [...light].filter(([name, value]) => isHex(value) && !kept.includes(name)).map(([name]) => name).sort(), 'the dark set redefines every grey but the primary');
  const primary = parseInt(light.get('--ux-primary').slice(1, 3), 16);
  assert.ok(primary >= 0x55 && primary <= 0xaa, 'the primary action is a mid-grey');
  assert.equal((css.match(/--ux-primary\s*:/g) ?? []).length, 1, 'one mid-grey, the same in both sets');
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (body.includes('var(--ux-primary)')) assert.equal(selector.trim(), '.ux-action.is-primary', 'the mid-grey is kept for the primary action');
  }

  assert.doesNotMatch(css, /\b(transition|animation)[\w-]*\s*:|@keyframes|scroll-behavior/, 'no motion');
  assert.doesNotMatch(css, /@import|url\(/, 'kit.css loads nothing');
  assert.deepEqual([...parts.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag), ['<link rel="stylesheet" href="kit.css">'], 'parts.html links kit.css only');
  assert.doesNotMatch(parts, /<script|<style|\sstyle="|\ssrc=/, 'parts.html is drawn by kit.css alone');
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
