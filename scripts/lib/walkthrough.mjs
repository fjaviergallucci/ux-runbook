// The walkthrough format: how a structure proposal is written at the Structure stage, so that one script
// draws every proposal in one kit and the founder compares structures, not paint.
// Arrangement is expressed only by containers — a screen or a dialog over one, and inside it a region, a
// group or an in-place expansion — and by the one word a region may say of itself: which of four areas of
// the page it is (`place`). Everything she sees or does is an item with one of a few roles, never a
// component name. A proposal differs from another in sequence, grouping, priority, what is present, which
// container holds it and which area that is; there is no key for size, colour or exact position, and how
// an area is drawn at each width is the kit's, so an unknown key is refused.
// A proposal holds a few screens (MAX_SCREENS, dialogs counted): a structure that needs more is more than
// one design.

export const ROLES = Object.freeze(['heading', 'text', 'choice', 'input', 'action', 'list', 'status', 'media', 'link', 'nav']);
export const CONTAINERS = Object.freeze(['region', 'group', 'expansion']);
// The areas of a page a region may say it is, in `place`: the places she moves between, present from
// screen to screen; a strip across the top, with what is always at hand; what the screen is for; and what
// sits next to the main part and supports it.
export const PLACES = Object.freeze(['navigation', 'bar', 'main', 'beside']);
// The most entries `screens` holds, dialogs counted.
export const MAX_SCREENS = 5;

const SCREEN_CONTAINERS = ['screen', 'dialog'];
const TEXT_FIELDS = ['name', 'bet', 'cost', 'hardest', 'firstIdea'];
// Who made a proposal, and how; allowed on the proposal only, and stripped by the blind merge.
const PROVENANCE = ['author', 'engine', 'track', 'model', 'source'];
// Every key the format knows, at each level, in the format's own order.
export const KEYS = Object.freeze({
  proposal: Object.freeze(['name', 'bet', 'cost', 'absent', 'hardest', 'firstIdea', 'screens', ...PROVENANCE]),
  screen: Object.freeze(['id', 'title', 'container', 'over', 'note', 'items']),
  role: Object.freeze(['role', 'text', 'id', 'note', 'primary', 'options']),
  container: Object.freeze(['container', 'place', 'label', 'open', 'items']),
});
// What only the source file carries: the maker's own record of what it set aside, and who made it. A
// letter copy (the sealed form, written by lib/merge.mjs) carries none of it.
export const SOURCE_ONLY = Object.freeze(['firstIdea', ...PROVENANCE]);
// The order a letter copy is written in, never its maker's, so no maker's habit of order reaches a judge; a
// key that is absent stays absent. It is the format's own order, less what stays in the source, so a key
// added to the format reaches the letters too.
export const ORDER = Object.freeze({
  letter: Object.freeze(KEYS.proposal.filter(key => !SOURCE_ONLY.includes(key))),
  screen: KEYS.screen,
  role: KEYS.role,
  container: KEYS.container,
});
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = v => typeof v === 'string' && v.trim() !== '';
const isKebab = v => typeof v === 'string' && KEBAB.test(v);
const isList = v => Array.isArray(v) && v.length > 0;
const isBoolean = v => typeof v === 'boolean';
const show = v => {
  const s = JSON.stringify(v) ?? String(v);
  return s.length > 40 ? `${s.slice(0, 37)}...` : s;
};

const TEXT = 'a line of text';
const LINES = 'a list of at least one line of text';
// The roles that carry options, each needing them: a choice is between two things at least.
const OPTIONS = new Map([
  ['choice', { least: 2, what: 'a list of at least two lines of text' }],
  ['list', { least: 1, what: LINES }],
  ['nav', { least: 1, what: LINES }],
]);
const KEBAB_TEXT = 'kebab-case (lower-case words joined by single hyphens)';
const PLACES_TEXT = `${PLACES.slice(0, -1).map(place => `"${place}"`).join(', ')} or "${PLACES.at(-1)}"`;

// validate(proposal, { sealed }) → every error, in the order of the proposal; [] when it is valid.
// Each error starts with the path of the object at fault: `screens[1].items[0]: unknown role "card"`.
// Two forms. The source form (the default) is what a maker writes: firstIdea is required, and who made it
// may be said. The sealed form ({ sealed: true }) is a letter copy: firstIdea and the five keys of who made
// it must be absent, each one present an error naming it; everything else is checked the same.
export function validate(proposal, { sealed = false } = {}) {
  const errors = [];
  const fail = (path, message) => {
    errors.push(`${path}: ${message}`);
  };
  if (!isObject(proposal)) return ['proposal: must be an object'];

  const at = 'proposal';
  // One pass over the keys, so these errors keep the order of the proposal too.
  for (const key of Object.keys(proposal)) {
    if (sealed && SOURCE_ONLY.includes(key)) fail(at, `"${key}" stays in the source file; a letter copy does not carry it`);
    else if (!KEYS.proposal.includes(key)) fail(at, `unknown key ${show(key)}`);
  }
  for (const key of TEXT_FIELDS) {
    if (!(sealed && key === 'firstIdea')) need(proposal, key, isText, TEXT, at, fail);
  }
  if (need(proposal, 'absent', isList, LINES, at, fail)) {
    proposal.absent.forEach((line, i) => isText(line) || fail(`absent[${i}]`, `must be ${TEXT}`));
  }
  if (need(proposal, 'screens', isList, 'a list of at least one screen', at, fail)) {
    if (proposal.screens.length > MAX_SCREENS) {
      fail(at, `"screens" holds ${proposal.screens.length} entries; a proposal holds ${MAX_SCREENS} at most, dialogs counted: a structure that needs more is more than one design`);
    }
    // Every id is known before any screen is read, so a dialog may open over a screen written after it.
    const kinds = new Map();
    for (const screen of proposal.screens) {
      if (isObject(screen) && !kinds.has(screen.id)) kinds.set(screen.id, screen.container);
    }
    const seen = new Map();
    const titles = new Map();
    proposal.screens.forEach((screen, i) => checkScreen(screen, `screens[${i}]`, { kinds, seen, titles, fail }));
  }
  return errors;
}

function checkScreen(screen, at, { kinds, seen, titles, fail }) {
  if (!isObject(screen)) return fail(at, 'must be an object');
  unknownKeys(screen, KEYS.screen, at, fail);
  if (need(screen, 'id', isKebab, KEBAB_TEXT, at, fail)) {
    if (seen.has(screen.id)) fail(at, `id "${screen.id}" is already ${seen.get(screen.id)}`);
    else seen.set(screen.id, at);
  }
  if (need(screen, 'title', isText, TEXT, at, fail)) {
    // The board names the screen a dialog opens over by its title, so no two entries share one; spaces a
    // page collapses tell no two titles apart.
    const title = screen.title.trim().replace(/\s+/g, ' ');
    if (titles.has(title)) fail(at, `title ${show(screen.title)} is already the title of ${titles.get(title)}`);
    else titles.set(title, at);
  }
  if (need(screen, 'container', v => SCREEN_CONTAINERS.includes(v), '"screen" or "dialog"', at, fail)) {
    checkOver(screen, at, kinds, fail);
  }
  maybe(screen, 'note', isText, TEXT, at, fail);
  const dialog = screen.container === 'dialog';
  const areas = dialog ? { placing: false } : areasOf(screen);
  if (areas.placing && areas.sound && !areas.main) fail(at, 'a screen that places a region has a "main"; this one has none');
  // `ids`, `primary` and `places` belong to this one screen or dialog: its item ids, its primary action,
  // and where each area it places was first written.
  checkItems(screen, at, { ids: new Map(), primary: null, places: new Map(), dialog, placing: areas.placing, fail }, true);
}

// What a screen's direct items say of its areas, before any of them is read: whether it places a region
// at all (then every direct item is a placed region), whether every `place` written on them is a sound
// one (a faulty one is refused where it is written, and may have been meant as the main), and whether
// one of them is the main.
function areasOf(screen) {
  const direct = Array.isArray(screen.items) ? screen.items.filter(isObject) : [];
  const claims = direct.filter(item => Object.hasOwn(item, 'place'));
  const placed = claims.filter(item => item.container === 'region' && !Object.hasOwn(item, 'role') && PLACES.includes(item.place));
  return { placing: placed.length > 0, sound: placed.length === claims.length, main: placed.some(item => item.place === 'main') };
}

// A dialog opens over a screen of this proposal, named in `over`; a screen opens over nothing.
function checkOver(screen, at, kinds, fail) {
  const has = Object.hasOwn(screen, 'over');
  if (screen.container === 'screen') {
    if (has) fail(at, 'only a dialog opens over a screen; remove "over"');
    return;
  }
  if (!has) return fail(at, 'a dialog names the screen it opens over in "over"');
  if (!kinds.has(screen.over)) return fail(at, `"over" names ${show(screen.over)}, which is no screen in this proposal`);
  // A target whose own container is refused is reported there, once; only a real dialog is named here.
  if (kinds.get(screen.over) === 'dialog') fail(at, `"over" names ${show(screen.over)}, which is a dialog, not a screen`);
}

// `direct` is true for the items of a screen or a dialog itself, and false inside any container.
function checkItems(holder, at, context, direct = false) {
  if (!need(holder, 'items', isList, 'a list of at least one item', at, context.fail)) return;
  holder.items.forEach((item, i) => checkItem(item, `${at}.items[${i}]`, context, direct));
}

function checkItem(item, at, context, direct) {
  const { fail } = context;
  if (!isObject(item)) return fail(at, 'must be an object');
  const hasRole = Object.hasOwn(item, 'role');
  if (hasRole === Object.hasOwn(item, 'container')) {
    return fail(at, hasRole ? 'has a "role" and a "container"; an item is one or the other' : 'needs a "role" or a "container"');
  }
  // Nothing floats outside the areas of a screen that has them. An item that carries a `place` is read
  // for it below, and said once.
  if (direct && context.placing && !Object.hasOwn(item, 'place')) {
    const what = item.container === 'region' ? '"region" has no "place"' : `${show(hasRole ? item.role : item.container)} is outside the areas`;
    fail(at, `on a screen that places a region, every direct item is a placed region; this ${what}`);
  }
  if (hasRole) checkRole(item, at, context);
  else checkContainer(item, at, context, direct);
}

function checkRole(item, at, context) {
  const { ids, fail } = context;
  unknownKeys(item, KEYS.role, at, fail);
  const known = ROLES.includes(item.role);
  if (!known) fail(at, `unknown role ${show(item.role)}`);
  need(item, 'text', isText, TEXT, at, fail);
  if (maybe(item, 'id', isKebab, KEBAB_TEXT, at, fail)) {
    if (ids.has(item.id)) fail(at, `id "${item.id}" is already ${ids.get(item.id)} on this screen`);
    else ids.set(item.id, at);
  }
  maybe(item, 'note', isText, TEXT, at, fail);
  // An unknown role is one fault: the keys that depend on the role are not read again against it.
  if (!known) return;
  if (Object.hasOwn(item, 'primary')) {
    if (item.role !== 'action') fail(at, `"primary" belongs to an action, not to a ${show(item.role)}`);
    else if (!isBoolean(item.primary)) fail(at, '"primary" must be true or false');
    else if (item.primary && context.primary) fail(at, `a second primary action on this screen; the first is ${context.primary}`);
    else if (item.primary) context.primary = at;
  }
  const options = OPTIONS.get(item.role);
  if (!options) {
    if (Object.hasOwn(item, 'options')) fail(at, `"options" belong to a choice, a list or a nav, not to a ${show(item.role)}`);
  } else if (need(item, 'options', v => Array.isArray(v) && v.length >= options.least, options.what, at, fail)) {
    item.options.forEach((option, i) => isText(option) || fail(`${at}.options[${i}]`, `must be ${TEXT}`));
  }
}

function checkContainer(item, at, context, direct) {
  const { fail } = context;
  unknownKeys(item, KEYS.container, at, fail);
  const known = CONTAINERS.includes(item.container);
  if (!known) fail(at, `unknown container ${show(item.container)}`);
  // As with "open" below, an unknown container is one fault: "place" is not read again against it.
  if (known && Object.hasOwn(item, 'place')) checkPlace(item, at, context, direct);
  // An expansion shows its label before it opens, so it always has one; a region or a group may have none.
  (item.container === 'expansion' ? need : maybe)(item, 'label', isText, TEXT, at, fail);
  // As with a role, an unknown container is one fault: "open" is not read again against it.
  if (known && Object.hasOwn(item, 'open')) {
    if (item.container !== 'expansion') fail(at, `"open" belongs to an expansion, not to a ${show(item.container)}`);
    else if (!isBoolean(item.open)) fail(at, '"open" must be true or false');
  }
  checkItems(item, at, context);
}

// Which area of the page a region is: one of four words, on a region that is a direct item of a screen,
// each area once on a screen at most. One fault is said, the first that holds.
function checkPlace(item, at, context, direct) {
  const { fail, places } = context;
  if (item.container !== 'region') return fail(at, `"place" belongs to a region, not to a ${show(item.container)}`);
  if (context.dialog) return fail(at, '"place" belongs to a region of a screen; a dialog has no areas');
  if (!direct) return fail(at, '"place" belongs to a region that is a direct item of its screen; this one is inside another container');
  if (!PLACES.includes(item.place)) return fail(at, `"place" must be ${PLACES_TEXT}; it is ${show(item.place)}`);
  if (places.has(item.place)) fail(at, `a second ${show(item.place)} on this screen; the first is ${places.get(item.place)}`);
  else places.set(item.place, at);
}

function unknownKeys(object, allowed, at, fail) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) fail(at, `unknown key ${show(key)}`);
  }
}

// A required key: true when it is present and `ok`.
function need(object, key, ok, what, at, fail) {
  if (!Object.hasOwn(object, key)) fail(at, `"${key}" is missing`);
  else if (!ok(object[key])) fail(at, `"${key}" must be ${what}; it is ${show(object[key])}`);
  else return true;
  return false;
}

// An optional key: true when it is present and `ok`.
function maybe(object, key, ok, what, at, fail) {
  return Object.hasOwn(object, key) && need(object, key, ok, what, at, fail);
}
