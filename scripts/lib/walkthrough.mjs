// The walkthrough format: how a structure proposal is written at the Structure stage, so that one script
// draws every proposal in one kit and the founder compares structures, not paint.
// Arrangement is expressed only by containers — a screen or a dialog over one, and inside it a region, a
// group or an in-place expansion. Everything she sees or does is an item with one of a few roles, never a
// component name. A proposal differs from another in sequence, grouping, priority, what is present and
// which container holds it; there is no key for anything else, so an unknown key is refused.

export const ROLES = Object.freeze(['heading', 'text', 'choice', 'input', 'action', 'list', 'status', 'media', 'link', 'nav']);
export const CONTAINERS = Object.freeze(['region', 'group', 'expansion']);

const SCREEN_CONTAINERS = ['screen', 'dialog'];
const TEXT_FIELDS = ['name', 'bet', 'cost', 'hardest', 'firstIdea'];
// Who made a proposal, and how; allowed on the proposal only, and stripped by the blind merge.
const PROVENANCE = ['author', 'engine', 'track', 'model', 'source'];
const KEYS = {
  proposal: [...TEXT_FIELDS, 'absent', 'screens', ...PROVENANCE],
  screen: ['id', 'title', 'container', 'over', 'note', 'items'],
  role: ['role', 'text', 'id', 'note', 'primary', 'options'],
  container: ['container', 'label', 'open', 'items'],
};
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
const KEBAB_TEXT = 'kebab-case (lower-case words joined by single hyphens)';

// validate(proposal) → every error, in the order of the proposal; [] when it is valid.
// Each error starts with the path of the object at fault: `screens[1].items[0]: unknown role "card"`.
export function validate(proposal) {
  const errors = [];
  const fail = (path, message) => {
    errors.push(`${path}: ${message}`);
  };
  if (!isObject(proposal)) return ['proposal: must be an object'];

  const at = 'proposal';
  unknownKeys(proposal, KEYS.proposal, at, fail);
  for (const key of TEXT_FIELDS) need(proposal, key, isText, TEXT, at, fail);
  if (need(proposal, 'absent', isList, LINES, at, fail)) {
    proposal.absent.forEach((line, i) => isText(line) || fail(`absent[${i}]`, `must be ${TEXT}`));
  }
  if (need(proposal, 'screens', isList, 'a list of at least one screen', at, fail)) {
    // Every id is known before any screen is read, so a dialog may open over a screen written after it.
    const kinds = new Map();
    for (const screen of proposal.screens) {
      if (isObject(screen) && !kinds.has(screen.id)) kinds.set(screen.id, screen.container);
    }
    const seen = new Map();
    proposal.screens.forEach((screen, i) => checkScreen(screen, `screens[${i}]`, { kinds, seen, fail }));
  }
  return errors;
}

function checkScreen(screen, at, { kinds, seen, fail }) {
  if (!isObject(screen)) return fail(at, 'must be an object');
  unknownKeys(screen, KEYS.screen, at, fail);
  if (need(screen, 'id', isKebab, KEBAB_TEXT, at, fail)) {
    if (seen.has(screen.id)) fail(at, `id "${screen.id}" is already ${seen.get(screen.id)}`);
    else seen.set(screen.id, at);
  }
  need(screen, 'title', isText, TEXT, at, fail);
  if (need(screen, 'container', v => SCREEN_CONTAINERS.includes(v), '"screen" or "dialog"', at, fail)) {
    checkOver(screen, at, kinds, fail);
  }
  maybe(screen, 'note', isText, TEXT, at, fail);
  checkItems(screen, at, { ids: new Map(), fail });
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
  if (kinds.get(screen.over) !== 'screen') fail(at, `"over" names ${show(screen.over)}, which is a dialog, not a screen`);
}

// `ids` holds the item ids of one screen: an id names one part of that screen.
function checkItems(holder, at, context) {
  if (!need(holder, 'items', isList, 'a list of at least one item', at, context.fail)) return;
  holder.items.forEach((item, i) => checkItem(item, `${at}.items[${i}]`, context));
}

function checkItem(item, at, context) {
  const { fail } = context;
  if (!isObject(item)) return fail(at, 'must be an object');
  const hasRole = Object.hasOwn(item, 'role');
  if (hasRole === Object.hasOwn(item, 'container')) {
    return fail(at, hasRole ? 'has a "role" and a "container"; an item is one or the other' : 'needs a "role" or a "container"');
  }
  if (hasRole) checkRole(item, at, context);
  else checkContainer(item, at, context);
}

function checkRole(item, at, { ids, fail }) {
  unknownKeys(item, KEYS.role, at, fail);
  if (!ROLES.includes(item.role)) fail(at, `unknown role ${show(item.role)}`);
  need(item, 'text', isText, TEXT, at, fail);
  if (maybe(item, 'id', isKebab, KEBAB_TEXT, at, fail)) {
    if (ids.has(item.id)) fail(at, `id "${item.id}" is already ${ids.get(item.id)} on this screen`);
    else ids.set(item.id, at);
  }
  maybe(item, 'note', isText, TEXT, at, fail);
  if (Object.hasOwn(item, 'primary')) {
    if (item.role !== 'action') fail(at, `"primary" belongs to an action, not to a ${show(item.role)}`);
    else if (!isBoolean(item.primary)) fail(at, '"primary" must be true or false');
  }
  if (maybe(item, 'options', isList, LINES, at, fail)) {
    item.options.forEach((option, i) => isText(option) || fail(`${at}.options[${i}]`, `must be ${TEXT}`));
  }
}

function checkContainer(item, at, context) {
  const { fail } = context;
  unknownKeys(item, KEYS.container, at, fail);
  if (!CONTAINERS.includes(item.container)) fail(at, `unknown container ${show(item.container)}`);
  // An expansion shows its label before it opens, so it always has one; a region or a group may have none.
  (item.container === 'expansion' ? need : maybe)(item, 'label', isText, TEXT, at, fail);
  if (Object.hasOwn(item, 'open')) {
    if (item.container !== 'expansion') fail(at, `"open" belongs to an expansion, not to a ${show(item.container)}`);
    else if (!isBoolean(item.open)) fail(at, '"open" must be true or false');
  }
  checkItems(item, at, context);
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
