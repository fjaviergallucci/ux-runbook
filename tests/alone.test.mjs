// alone: proves that a folder stands alone. Every address its pages and stylesheets load (href, src, srcset,
// url() and @import) must lead to a file inside the folder: one that leaves it, is remote or is not there is
// printed, and the command exits 1.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AloneError, alone, pointers, references } from '../scripts/alone.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'alone.mjs');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'alone-'));
after(() => rmSync(root, { recursive: true, force: true }));

// ---- what the tests are made of

let made = 0;
// A fresh folder of this run, holding the files given: each by its path from the folder, with its text.
const fresh = (files, name = `run ${++made}`) => {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  return dir;
};
const run = (cwd, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
const visible = name => !name.startsWith('.fuse_hidden');
const tree = (dir, inside = '') =>
  readdirSync(join(dir, inside), { withFileTypes: true }).filter(entry => visible(entry.name))
    .flatMap(entry => (entry.isDirectory() ? tree(dir, `${inside}${entry.name}/`) : [`${inside}${entry.name}`])).sort();
// A page with this in its head or body, and a stylesheet with these rules.
const page = body => `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Today</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
// A handoff folder in small: two pages of a prototype, the token file beside it, a font and a picture.
const FOLDER = Object.freeze({
  'tokens.css': '@import "fonts/faces.css";\n:root { --ground: #fff; }\nbody { background: url(img/paper.png); }\n',
  'fonts/faces.css': '@font-face { font-family: Desk; src: url("desk.woff2") format("woff2"); }\n',
  'fonts/desk.woff2': 'a font',
  'img/paper.png': 'a picture',
  'prototype/index.html': page('<link rel="stylesheet" href="../tokens.css">\n<a href="today-default-en.html">Today</a>'),
  'prototype/today-default-en.html': page('<link rel="stylesheet" href="../tokens.css">\n<img src="shots/today-default-en-390-light.png" alt="">\n<a href="index.html#top">Back</a>'),
  'prototype/shots/today-default-en-390-light.png': 'a picture',
});
// The folder with one more file, or one file changed.
const withFile = (file, text) => fresh({ ...FOLDER, [file]: text });
// The command's verdict on a folder, run from the folder above it with the folder named by its own name.
const judge = dir => run(dirname(dir), dir.slice(dirname(dir).length + 1));
// Exit 0, one line on standard output, nothing on standard error.
const stands = (dir, count) => {
  const r = judge(dir);
  assert.deepEqual([r.status, r.stderr], [0, ''], r.stdout);
  if (count) assert.match(r.stdout, count);
  return r.stdout;
};
// Exit 1, nothing on standard output, and on standard error one line for each reference that fails, then the count.
const fails = (dir, ...lines) => {
  const r = judge(dir);
  assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
  const said = r.stderr.trimEnd().split('\n');
  assert.deepEqual(said.slice(0, -1), lines);
  assert.match(said.at(-1), new RegExp(`^${lines.length} reference${lines.length === 1 ? '' : 's'} of .+ ${lines.length === 1 ? 'does' : 'do'} not lead to a file inside it$`));
  assert.doesNotMatch(r.stderr, /^Usage:/m, 'a reference that fails is not bad usage');
};
// The one line a page prints for one thing in its body.
const inPage = body => withFile('prototype/today-empty-en.html', page(body));
const PAGE = 'prototype/today-empty-en.html';

// ---- the command line

test('--help prints the usage and exits 0: the form, every kind of reference that is read, what is passed over, what is never printed, and the exit codes', () => {
  for (const flag of ['--help', '-h']) {
    const r = run(root, flag);
    assert.deepEqual([r.status, r.stderr], [0, '']);
    assert.match(r.stdout, /^Usage: node scripts\/alone\.mjs <folder> \[--package <package>\]\n/);
    for (const kind of ['href', 'xlink:href', 'src', 'srcset', 'imagesrcset', 'poster', 'the data of an object', 'url()', '@import', 'image-set()']) assert.ok(r.stdout.includes(kind), kind);
    assert.match(r.stdout, /every \.html and \.css file under the folder/);
    assert.match(r.stdout, /it leaves the folder/);
    assert.match(r.stdout, /it is remote/);
    assert.match(r.stdout, /the file is not there/);
    assert.match(r.stdout, /A fragment \(#x\), an address that is only a query \(\?x\), and a data:, mailto:, tel: or sms: address are\npassed over/);
    assert.match(r.stdout, /An address is printed without its query and its fragment, and without a sign-in written into it/);
    assert.match(r.stdout, /Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal .* · 2 bad usage\.\n$/s);
  }
});

test('bad usage exits 2 with the usage: no folder, two folders, a flag it does not know', () => {
  const dir = fresh(FOLDER);
  for (const [args, message] of [[[], /^alone takes one <folder>\n/], [[dir, dir], /^alone takes one <folder>\n/], [[dir, '--out', 'x'], /^unknown flag --out\n/], [['--strict', dir], /^unknown flag --strict\n/]]) {
    const before = tree(dir);
    const r = run(root, ...args);
    assert.deepEqual([r.status, r.stdout], [2, ''], r.stderr);
    assert.match(r.stderr, message);
    assert.match(r.stderr, /^Usage: node scripts\/alone\.mjs <folder> \[--package <package>\]$/m);
    assert.deepEqual(tree(dir), before);
  }
});

test('a refusal exits 1 without the usage: a folder that is not there, a file in its place, a folder with no page and no stylesheet', () => {
  const dir = fresh({ 'notes.md': 'See [the kit](../kit/tokens.css).\n', 'data/strings.json': '{}\n' });
  for (const [name, message] of [['nowhere', /^cannot read nowhere: not found\n$/], [join(dir.slice(root.length + 1), 'notes.md'), /^cannot read .*notes\.md: it is a file, not a folder\n$/],
    [dir.slice(root.length + 1), /^.* holds no \.html and no \.css file: there is nothing to read\. Is it the folder that was meant\?\n$/]]) {
    const r = run(root, name);
    assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
    assert.match(r.stderr, message);
    assert.doesNotMatch(r.stderr, /^Usage:/m);
  }
});

// ---- a folder that stands alone

test('a folder whose pages and stylesheets load only its own files stands alone: exit 0, and the count of what was read', () => {
  const dir = fresh(FOLDER);
  const before = tree(dir);
  const out = stands(dir);
  // Eight references in four files: the pages' two stylesheet links, their two links and a picture, and what the token file loads.
  assert.equal(out, `${dir.slice(root.length + 1)} stands alone: 8 references in 4 files, each to a file inside it\n`);
  assert.deepEqual(tree(dir), before, 'nothing is written');
  // As a module: the same count, and no fault.
  const found = alone(dir);
  assert.deepEqual([found.files, found.references, found.faults], [4, 8, []]);
});

test('a link between two pages of the folder is fine, from any depth, and a path with a space works written either way', () => {
  stands(fresh({
    'index.html': page('<a href="pages/free rooms.html">Free rooms</a>\n<a href="pages/free%20rooms.html">Again</a>\n<link rel="stylesheet" href="./kit/desk tokens.css">'),
    'pages/free rooms.html': page('<a href="../index.html">Back</a>\n<img src="../kit/shots/room%202.png" alt="">'),
    'kit/desk tokens.css': 'body { background: url("shots/room 2.png"); }\n',
    'kit/shots/room 2.png': 'a picture',
  }, 'a clinic with spaces'), /^a clinic with spaces stands alone: 6 references in 3 files/);
});

test('a fragment, a query alone, an empty address and a data:, mailto:, tel: or sms: address are passed over; a query and a fragment on a file of the folder are let be', () => {
  const dir = inPage(['<a href="#rooms">Rooms</a>', '<a href="">Here</a>', '<a href="mailto:desk@clinic.example">Write</a>', '<img src="data:image/png;base64,AAAA" alt="">',
    '<a href="index.html?room=2#top">Room 2</a>', '<img srcset="data:image/png;base64,AAAA 1x" alt="">', '<a href="tel:+34600000000">Call the desk</a>', '<a href="SMS:+34600000000">Text it</a>',
    '<a href="?lang=es">En español</a>', '<a href="?lang=es#rooms">Salas</a>'].join('\n'));
  // Passed over, they are not counted: the one counted is the link to the index.
  assert.equal(alone(dir).references, 8 + 1);
  stands(dir);
  stands(withFile('tokens.css', `${FOLDER['tokens.css']}a { background: url(data:image/svg+xml;utf8,<svg/>); mask: url(#clip); }\n`));
});

// ---- a reference that leaves the folder

test('a reference that climbs above the folder leaves it, in a page and in a stylesheet: the very link a copied page keeps', () => {
  // The page as Look wrote it, copied to the same depth: its link to the project's token file still resolves on disk.
  const project = fresh({ 'design/kit/tokens.css': ':root {}\n', 'design/today/07-handoff/prototype/today-default-en.html': page('<link rel="stylesheet" href="../../../kit/tokens.css">'), 'design/today/07-handoff/tokens.css': ':root {}\n' });
  const r = run(project, 'design/today/07-handoff');
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.equal(r.stderr, 'prototype/today-default-en.html: ../../../kit/tokens.css: it leaves the folder: ".." climbs above it\n1 reference of design/today/07-handoff does not lead to a file inside it\n');
  fails(inPage('<img src="../../logo.png" alt="">'), `${PAGE}: ../../logo.png: it leaves the folder: ".." climbs above it`);
  fails(withFile('tokens.css', ':root {}\nbody { background: url(../paper.png); }\n@import "../base.css";\n'), 'tokens.css: ../paper.png: it leaves the folder: ".." climbs above it', 'tokens.css: ../base.css: it leaves the folder: ".." climbs above it');
  // One level up from a page in a folder of the folder is still inside it; two are not.
  stands(inPage('<link rel="stylesheet" href="../tokens.css">'));
  fails(inPage('<link rel="stylesheet" href="../../tokens.css">'), `${PAGE}: ../../tokens.css: it leaves the folder: ".." climbs above it`);
  // Climbing out and coming back in by the folder's own name is leaving it all the same.
  const back = fresh(FOLDER, 'named');
  writeFileSync(join(back, PAGE), page('<link rel="stylesheet" href="../../named/tokens.css">'));
  fails(back, `${PAGE}: ../../named/tokens.css: it leaves the folder: ".." climbs above it`);
});

test('an absolute path and a file: address leave the folder, whatever they lead to', () => {
  const dir = fresh(FOLDER);
  const absolute = join(dir, 'tokens.css');
  writeFileSync(join(dir, PAGE), page(`<link rel="stylesheet" href="${absolute}">\n<img src="/img/paper.png" alt="">\n<a href="file://${absolute}">It</a>\n<img src="C:\\clinic\\logo.png" alt="">`));
  fails(dir, `${PAGE}: ${absolute}: it leaves the folder: an absolute path`, `${PAGE}: /img/paper.png: it leaves the folder: an absolute path`, `${PAGE}: file://${absolute}: it leaves the folder: a file: address`,
    `${PAGE}: C:\\clinic\\logo.png: it leaves the folder: an absolute path`);
});

test('a remote address is remote: http:, https:, and one that starts with two slashes', () => {
  fails(inPage('<script src="https://cdn.example/kit.js"></script>\n<link rel="stylesheet" href="//fonts.example/css?family=Desk">\n<img src="HTTP://clinic.example/logo.png" alt="">'),
    `${PAGE}: https://cdn.example/kit.js: it is remote`, `${PAGE}: //fonts.example/css (with a query): it is remote`, `${PAGE}: HTTP://clinic.example/logo.png: it is remote`);
  fails(withFile('tokens.css', '@import url("https://fonts.example/desk.css");\n:root {}\n'), 'tokens.css: https://fonts.example/desk.css: it is remote');
});

test('an address of another kind is not guessed at: it is printed', () => {
  fails(inPage('<a href="ftp://clinic.example/rooms.csv">Rooms</a>\n<a href="javascript:book()">Book</a>'), `${PAGE}: ftp://clinic.example/rooms.csv: an address of a kind this check does not know (ftp:)`,
    `${PAGE}: javascript:book(): an address of a kind this check does not know (javascript:)`);
});

test('a reference to a file that is not there is printed; a link to a folder of the folder is fine, and a folder is no file to load', () => {
  fails(inPage('<img src="shots/today-empty-en-390-light.png" alt="">\n<img src="shots/" alt="">\n<a href="today-default-es.html#rooms">Spanish</a>\n<a href="pictures/">No such folder</a>'),
    `${PAGE}: shots/today-empty-en-390-light.png: the file is not there`, `${PAGE}: shots/: the file is not there: it is a folder`, `${PAGE}: today-default-es.html: the file is not there`, `${PAGE}: pictures/: the file is not there`);
  // A link, an href, may lead to a folder inside the folder: the one it is in, one beside it, the folder itself.
  const linked = inPage('<a href="./">This folder</a>\n<a href="shots/">Pictures</a>\n<a href="../fonts">Fonts</a>\n<a href="..">The folder</a>\n<a href="../img/?sort=name">Sorted</a>');
  assert.equal(alone(linked).references, 8 + 5);
  stands(linked);
  // One that climbs out is still out, and a stylesheet does not load a folder.
  fails(inPage('<a href="../../">Above</a>'), `${PAGE}: ../../: it leaves the folder: ".." climbs above it`);
  fails(withFile('tokens.css', ':root {}\nbody { background: url(img/); }\n'), 'tokens.css: img/: the file is not there: it is a folder');
  fails(withFile('fonts/faces.css', '@font-face { font-family: Desk; src: url(desk.woff) format("woff"), url("desk.woff2") format("woff2"); }\n'), 'fonts/faces.css: desk.woff: the file is not there');
});

// ---- every way a reference is written

test('each attribute is read however it is quoted, and srcset candidate by candidate', () => {
  fails(inPage(["<img src='../../a.png' alt=''>", '<img src=../../b.png alt="">', '<IMG SRC = "../../c.png" alt="">', '<img alt="" srcset="shots/today-default-en-390-light.png 1x, ../../d.png 2x,../../e.png 3x">',
    '<source srcset="../../f.png">', '<a\n  href="../../g.html">G</a>'].join('\n')),
  ...['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png', 'g.html'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
  // A candidate may end at its comma; a value may have white space around it; a quoted value may hold a `>`; and the folder
  // above is ".." alone.
  fails(inPage('<img alt="" srcset="../../i.png, ../../j.png 2x">\n<a href="  ../../k.html  ">K</a>\n<a title="rooms > desks" href="../../l.html">L</a>\n<a href="../..">Up</a>'),
    ...['i.png', 'j.png', 'k.html', 'l.html'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`), `${PAGE}: ../..: it leaves the folder: ".." climbs above it`);
  fails(fresh({ 'index.html': page('<a href="..">Up</a>\n<a href=".">Here</a>') }), 'index.html: ..: it leaves the folder: ".." climbs above it');
  // An attribute with no value does not end the reading of its tag.
  fails(inPage('<img hidden alt src="../../m.png">'), `${PAGE}: ../../m.png: it leaves the folder: ".." climbs above it`);
  // A backslash is a slash to a browser, and an svg's xlink:href is an href.
  fails(inPage('<img src="..\\..\\h.png" alt="">\n<svg><use xlink:href="../../z.svg#mark"/></svg>'), `${PAGE}: ..\\..\\h.png: it leaves the folder: ".." climbs above it`, `${PAGE}: ../../z.svg: it leaves the folder: ".." climbs above it`);
  // An attribute of another name that ends the same way is not one of the three.
  stands(inPage('<button data-href="../../x.html" data-src="../../y.png" data-go="today-default-en.html">Book</button>'));
});

test('a stylesheet written in a page is read as one: a style element, a style attribute, an import', () => {
  fails(inPage('<style>\n@import url(../../base.css);\n@import \'../../type.css\';\nbody { background: url( "../../paper.png" ); }\n</style>\n<p style="background-image: url(../../stamp.png)">Free</p>'),
    ...['base.css', 'type.css', 'paper.png', 'stamp.png'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
});

test('what a comment holds is not loaded, and is not read; a base address is refused, since it moves every link of its page', () => {
  stands(inPage('<!-- <link rel="stylesheet" href="../../../kit/tokens.css"> -->\n<p>Free</p>'));
  stands(withFile('tokens.css', '/* was: @import "../base.css"; url(../paper.png) */\n:root {}\n'));
  fails(inPage('<base href="https://clinic.example/">\n<a href="index.html">Index</a>'), `${PAGE}: https://clinic.example/: a base address moves every link of the page: take it out`);
  fails(inPage('<base href="../">'), `${PAGE}: ../: a base address moves every link of the page: take it out`);
  // Whatever it says: one that names only a fragment is a base address all the same.
  fails(inPage('<base href="#top">'), `${PAGE}: : a base address moves every link of the page: take it out`);
});

test('an address written with character references is read as the browser reads it', () => {
  stands(fresh({ 'index.html': page('<a href="rooms&amp;desks.html">Rooms</a>\n<a href="rooms&#38;desks.html">Again</a>'), 'rooms&desks.html': page('<p>Free</p>') }));
  fails(fresh({ 'index.html': page('<a href="..&#47;kit&#x2F;tokens.css">Tokens</a>') }), 'index.html: ../kit/tokens.css: it leaves the folder: ".." climbs above it');
});

test('what does not leave the folder is not refused: an address inside another attribute\'s value, a style attribute written with character references, a comment in a style element, a tag in a script\'s text', () => {
  // The word src= inside a title is text, not an attribute.
  stands(inPage('<a title=\'the src="../../x.png" attribute, and href=../../y.html\' href="index.html">Index</a>'));
  assert.deepEqual(references('<a title=\'the src="../../x.png" attribute\' href="index.html">Index</a>', 'html'), ['index.html']);
  // A style attribute is decoded before it is read, as the browser decodes it.
  stands(inPage('<p style="background: url(&quot;shots/today-default-en-390-light.png&quot;)">Free</p>'));
  fails(inPage('<p style="background: url(&quot;../../paper.png&quot;)">Free</p>'), `${PAGE}: ../../paper.png: it leaves the folder: ".." climbs above it`);
  // A comment in a style element is passed over, as in a .css file; what follows it is read.
  stands(inPage('<style>\n/* was: url(../../old.png) and @import "../../old.css"; */\nbody { margin: 0; }\n</style>'));
  fails(inPage('<style>/* url(../../old.png) */ body { background: url(../../new.png); }</style>'), `${PAGE}: ../../new.png: it leaves the folder: ".." climbs above it`);
  // What a script holds is its text: a tag written in a string is no tag of the page. The script's own src is.
  stands(inPage('<script>const row = \'<a href="../../built-later.html">x</a>\'; const css = "url(../../later.png)";</script>'));
  fails(inPage('<script src="../../kit.js">const a = \'<img src="../../q.png">\';</script>'), `${PAGE}: ../../kit.js: it leaves the folder: ".." climbs above it`);
});

test('a poster, the data of an object, an imagesrcset and the strings of an image-set() are read too', () => {
  fails(inPage(['<video poster="../../still.png"></video>', '<object data="../../plan.svg"></object>', '<link rel="preload" as="image" imagesrcset="../../a.png 1x, ../../b.png 2x">', '<a data="../../not-read.html">An a has no data to load</a>',
    '<p style="background: image-set(&quot;../../c.png&quot; 1x, url(../../d.png) 2x)">Free</p>'].join('\n')),
  ...['still.png', 'plan.svg', 'a.png', 'b.png', 'c.png', 'd.png'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
  fails(withFile('tokens.css', 'body { background: -webkit-image-set("../x.png" 1x, "img/paper.png" 2x); background: image-set(\'../y.avif\' type("image/avif"), "img/paper.png" 1x); }\n'),
    'tokens.css: ../x.png: it leaves the folder: ".." climbs above it', 'tokens.css: ../y.avif: it leaves the folder: ".." climbs above it');
});

test('a query, a fragment and a sign-in written into an address are never printed: a reference is named by its path, and the query is said in words', () => {
  // A made-up value, standing where a key rides in the address of a font or a picture.
  const SECRET = 'NOT-A-REAL-VALUE-7f3a';
  const dir = fresh({
    'tokens.css': `@import url("https://fonts.example/css?family=Desk&key=${SECRET}");\n@font-face { font-family: Desk; src: url("fonts/desk.woff2?v=${SECRET}#${SECRET}"); }\nbody { background: url(../paper.png?sig=${SECRET}); }\n`,
    'index.html': page(`<img src="https://desk:${SECRET}@clinic.example/logo.png" alt="">\n<a href="/rooms?token=${SECRET}">Rooms</a>\n<a href="missing.html#${SECRET}">Missing</a>\n<base href="https://clinic.example/?k=${SECRET}">\n<a href="ftp://desk:${SECRET}@clinic.example/rooms.csv?k=${SECRET}">File</a>`),
  });
  const r = judge(dir);
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.ok(!r.stderr.includes(SECRET) && !r.stdout.includes(SECRET), 'the value is in neither stream');
  assert.deepEqual(r.stderr.trimEnd().split('\n').slice(0, -1), [
    'index.html: https://clinic.example/logo.png (a sign-in taken out): it is remote', 'index.html: /rooms (with a query): it leaves the folder: an absolute path', 'index.html: missing.html: the file is not there',
    'index.html: https://clinic.example/ (with a query): a base address moves every link of the page: take it out', 'index.html: ftp://clinic.example/rooms.csv (with a query, a sign-in taken out): an address of a kind this check does not know (ftp:)',
    'tokens.css: https://fonts.example/css (with a query): it is remote', 'tokens.css: fonts/desk.woff2 (with a query): the file is not there', 'tokens.css: ../paper.png (with a query): it leaves the folder: ".." climbs above it']);
  // As a module too: what alone() hands back is what is printed.
  assert.ok(!JSON.stringify(alone(dir)).includes(SECRET));
  // A question mark after the # is part of the fragment: there is no query to speak of.
  fails(inPage('<a href="gone.html#rooms?free">Rooms</a>'), `${PAGE}: gone.html: the file is not there`);
  // Two addresses of one file that differ only by what is not printed are one line.
  fails(inPage(`<img src="gone.png?v=1" alt="">\n<img src="gone.png?v=2" alt="">`), `${PAGE}: gone.png (with a query): the file is not there`);
});

// ---- which files are read, and what is printed

test('every .html and .css file under the folder is read, whatever its depth and the case of its ending; no other file is', () => {
  const dir = fresh({ ...FOLDER, 'deep/er/page.HTML': page('<img src="../../../out.png" alt="">'), 'deep/print.Css': 'a { background: url(/abs.png); }\n', 'notes.md': '<a href="../../kit/tokens.css">not a page</a>\n',
    'data.json': '{ "href": "https://clinic.example" }\n', 'script.js': 'const css = "url(../../x.png)";\n', '.fuse_hidden0001.html': page('<a href="../../leftover.html">x</a>') });
  fails(dir, 'deep/er/page.HTML: ../../../out.png: it leaves the folder: ".." climbs above it', 'deep/print.Css: /abs.png: it leaves the folder: an absolute path');
});

test('every reference that fails is printed, file by file in the order of their paths and in the order written; one written twice in a file is printed once', () => {
  const dir = fresh({ 'b.html': page('<img src="../z.png" alt="">\n<img src="missing.png" alt="">\n<img src="../z.png" alt="">'), 'a.css': 'a { background: url(https://x.example/a.png); }\n', 'c/d.html': page('<a href="/root.html">Root</a>'), 'c.css': 'a { background: url(//x.example/c.png); }\n' });
  // The order is that of the paths as written, so a file comes before the folder of the same name.
  fails(dir, 'a.css: https://x.example/a.png: it is remote', 'b.html: ../z.png: it leaves the folder: ".." climbs above it', 'b.html: missing.png: the file is not there', 'c.css: //x.example/c.png: it is remote',
    'c/d.html: /root.html: it leaves the folder: an absolute path');
  const found = alone(dir);
  assert.deepEqual([found.files, found.references], [4, 5]);
  assert.deepEqual(found.faults[0], { file: 'a.css', reference: 'https://x.example/a.png', why: 'it is remote' });
});

test('a link in the folder that leads out of it leaves the folder', t => {
  const dir = fresh({ ...FOLDER, 'outside/kit.css': ':root {}\n' });
  const inside = join(dir, 'prototype');
  try {
    symlinkSync(join(dir, 'outside', 'kit.css'), join(inside, 'kit.css'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  writeFileSync(join(inside, 'today-empty-en.html'), page('<link rel="stylesheet" href="kit.css">'));
  // Judged from the prototype folder alone, the link leads out of it; from the whole folder, it stays inside.
  const r = run(dir, 'prototype');
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.match(r.stderr, /^today-empty-en\.html: kit\.css: it leaves the folder: a link that leads out of it$/m);
});

// ---- as a module

test('references(text, kind) lists what a page or a stylesheet loads, in the order written, each once', () => {
  assert.deepEqual(references('<link href="a.css"><img src=\'b.png\' srcset="c.png 1x, d.png 2x"><a href="a.css">again</a><p style="background: url(e.png)">', 'html'), ['a.css', 'b.png', 'c.png', 'd.png', 'e.png']);
  assert.deepEqual(references('@import "a.css";\n@import url(b.css) screen;\na { background: url( \'c.png\' ) } b { src: url(d.woff2) format("woff2") }', 'css'), ['a.css', 'b.css', 'c.png', 'd.woff2']);
  assert.deepEqual(references('<p>href="x" in words is not an attribute of a tag, and url(y) in words is no stylesheet</p>', 'html'), []);
  assert.deepEqual(references('<video poster="a.png"></video><object data="b.svg"></object><link rel="preload" as="image" imagesrcset="c.png 1x, d.png 2x"><a data="e.html">not an object</a>', 'html'), ['a.png', 'b.svg', 'c.png', 'd.png']);
  assert.deepEqual(references('a { background: image-set("a.png" 1x, url(b.png) 2x, \'c.avif\' type("image/avif")); } b { background: -webkit-image-set( "d.png" 1x ) } c { content: "e.png" }', 'css'), ['a.png', 'b.png', 'c.avif', 'd.png']);
  assert.deepEqual(references('', 'css'), []);
  assert.throws(() => references('a', 'js'), e => e instanceof TypeError && e.message === 'kind must be html or css; it is "js"');
  assert.throws(() => references(7, 'css'), e => e instanceof TypeError && e.message === 'text must be a string; it is 7');
});

test('alone(folder) throws an AloneError for a folder it cannot read, and a TypeError for anything that is not a path', () => {
  assert.throws(() => alone(join(root, 'nowhere')), e => e instanceof AloneError && /^cannot read .*nowhere: not found$/.test(e.message));
  for (const bad of [undefined, '', 7, null]) assert.throws(() => alone(bad), TypeError);
});

// ---- nothing points back: --package (R180 of the dry run)

// The run's cold reader twice found what no address check sees: a stylesheet's comment naming `measures.md`, a
// coverage row naming a maker's `descriptions/data.json`, the writers' notes naming `DETAIL.md`. With --package,
// every text file of the folder is read for the name of a file or folder of the package that the folder does not hold.

// A package in small: its stages' outputs and folders, the handoff folder among them, and the builder's place.
const PACKAGE = Object.freeze({
  'state.json': '{}\n',
  'STATE.md': '# State\n',
  'DECISIONS.md': '# Decisions\n',
  '00-frame.md': '# Frame\n',
  '04-structure/CHOSEN.md': '# Chosen\n',
  '04-structure/descriptions/data.json': '{}\n',
  '05-detail/DETAIL.md': '# Detail\n',
  '05-detail/states.md': '# States\n',
  '05-detail/strings.json': '{}\n',
  '05-detail/prototype/today-default-en.html': 'a page',
  '06-look/LOOK.md': '# Look\n',
  '06-look/measures.md': '# Measures\n',
  '06-look/screens/today-default-en.html': 'a page',
  '06-look/screens/look.css': 'a { color: red }\n',
  '06-look/shots/today-default-en-390-light.png': 'a picture',
  // What a file browser leaves behind is no file of the package.
  '06-look/.DS_Store': 'left behind',
  '07-handoff-gate/judge.cold-implementer.md': '# A ledger\n',
  'work/handoff-judge.cold-implementer-brief.md': '# A brief\n',
  'work/notes': 'a maker\'s notes\n',
  'build/BUILD.md': '# Build\n',
  'build/STATES.md': '# States\n',
  'build/DEVIATIONS.md': '# Deviations\n',
});
// What the handoff folder holds beside its pages: its own files, some named as files of the package are.
const HANDED = Object.freeze({
  'HANDOFF.md': '# Handoff\n\nStart at `SPEC.md`. The pages are in `prototype/`, their pictures in `prototype/shots/`.\nWrite `../build/STATES.md`, `../build/BUILD.md` and `../build/DEVIATIONS.md` as you build: `build/` is yours.\n',
  'SPEC.md': '# Spec\n\n| State | Its page |\n|---|---|\n| default | `today-default-en.html` |\n',
  'DECISIONS.md': '# Decisions\n\n6. The cleaning time is ten minutes.\n',
  'COVERAGE.md': '# Coverage\n\n| Seat | What it read |\n|---|---|\n| judge.truth | the pages |\n',
  'strings.json': '{ "book": { "en": "Book" } }\n',
  'prototype/look.css': '/* The look of today. */\na { color: inherit; }\n',
});
// The package on disk, the handoff folder inside it holding FOLDER, HANDED and what the test adds or changes.
const packaged = (changes = {}, name = `package ${++made}`) => {
  const files = { ...FOLDER, ...HANDED, ...changes };
  const dir = fresh({ ...PACKAGE, ...Object.fromEntries(Object.entries(files).map(([file, text]) => [`07-handoff/${file}`, text])) }, name);
  return { pkg: dir, folder: join(dir, '07-handoff') };
};
// The verdict with --package, run from the package's folder with both named from it.
const judged = ({ pkg }, ...more) => run(pkg, '07-handoff', '--package', '.', ...more);
const points = (dir, ...lines) => {
  const r = judged(dir);
  assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
  const said = r.stderr.trimEnd().split('\n');
  assert.deepEqual(said.slice(0, -1), lines);
  assert.equal(said.at(-1), `${lines.length} place${lines.length === 1 ? '' : 's'} of 07-handoff name${lines.length === 1 ? 's' : ''} a file or folder of . that it does not hold`);
};
const TEXT_FILES = Object.keys({ ...FOLDER, ...HANDED }).length;

test('--package: a folder that names nothing of its package but what it holds stands alone, and says what was read', () => {
  const dir = packaged();
  const before = tree(dir.pkg);
  const r = judged(dir);
  assert.deepEqual([r.status, r.stderr], [0, ''], r.stdout);
  assert.equal(r.stdout, `07-handoff stands alone: 8 references in 5 files, each to a file inside it; and none of its ${TEXT_FILES} text files names a file or folder of . that it does not hold\n`);
  assert.deepEqual(tree(dir.pkg), before, 'nothing is written');
  // --package=value is the same, and so is the flag before the folder.
  assert.equal(run(dir.pkg, '--package=.', '07-handoff').stdout, r.stdout);
  // Without the flag the line is the one it always was, and no text is read for names.
  assert.equal(run(dir.pkg, '07-handoff').stdout, '07-handoff stands alone: 8 references in 5 files, each to a file inside it\n');
});

test('--package: what the run\'s cold reader found is found: a stylesheet\'s comment, a coverage row, the writers\' notes, a page\'s comment', () => {
  points(packaged({ 'prototype/look.css': '/* The look of today.\n   Its six changes are listed in measures.md under "Named extensions". */\na { color: inherit; }\n' }),
    'prototype/look.css:2: measures.md: it names 06-look/measures.md of the package, which the folder does not hold');
  points(packaged({ 'COVERAGE.md': `${HANDED['COVERAGE.md']}| describer | wrote descriptions/data.json, by the kit's contract |\n` }),
    'COVERAGE.md:6: data.json: it names 04-structure/descriptions/data.json of the package, which the folder does not hold',
    'COVERAGE.md:6: descriptions/: it names 04-structure/descriptions/ of the package, which the folder does not hold');
  points(packaged({ 'strings.json': '{\n  "_meta": { "notes": ["DETAIL.md still says 32 strings (deviation 28)", "states.md still reads \\"no item\\""] },\n  "book": { "en": "Book" }\n}\n' }),
    'strings.json:2: DETAIL.md: it names 05-detail/DETAIL.md of the package, which the folder does not hold',
    'strings.json:2: states.md: it names 05-detail/states.md of the package, which the folder does not hold');
  points(packaged({ 'prototype/today-default-en.html': `${FOLDER['prototype/today-default-en.html']}<!-- copied from 06-look/screens/ -->\n` }),
    'prototype/today-default-en.html:13: 06-look/: it names 06-look/ of the package, which the folder does not hold',
    'prototype/today-default-en.html:13: screens/: it names 06-look/screens/ of the package, which the folder does not hold');
  // Without the flag, none of them is seen: the address check reads no comment and no Markdown.
  const unseen = packaged({ 'prototype/look.css': '/* listed in measures.md */\n', 'COVERAGE.md': 'See descriptions/data.json.\n' });
  assert.deepEqual([run(unseen.pkg, '07-handoff').status, judged(unseen).status], [0, 1]);
});

test('--package: a stage\'s output, a ledger, a brief and a stage\'s folder are names of the package; each place is printed once, file by file and line by line', () => {
  points(packaged({
    'SPEC.md': `${HANDED['SPEC.md']}\nAs decided at Detail (05-detail/DETAIL.md), and in LOOK.md. LOOK.md says so twice.\nThe state is in ../state.json and STATE.md; the frame in \`00-frame.md\`.\n`,
    'PARTS.md': 'The ledger is 07-handoff-gate/judge.cold-implementer.md.\nThe brief: work/handoff-judge.cold-implementer-brief.md\n\nAnd again: LOOK.md.\n',
  }),
    'PARTS.md:1: 07-handoff-gate/: it names 07-handoff-gate/ of the package, which the folder does not hold',
    'PARTS.md:1: judge.cold-implementer.md: it names 07-handoff-gate/judge.cold-implementer.md of the package, which the folder does not hold',
    'PARTS.md:2: handoff-judge.cold-implementer-brief.md: it names work/handoff-judge.cold-implementer-brief.md of the package, which the folder does not hold',
    'PARTS.md:2: work/: it names work/ of the package, which the folder does not hold',
    'PARTS.md:4: LOOK.md: it names 06-look/LOOK.md of the package, which the folder does not hold',
    'SPEC.md:7: 05-detail/: it names 05-detail/ of the package, which the folder does not hold',
    'SPEC.md:7: DETAIL.md: it names 05-detail/DETAIL.md of the package, which the folder does not hold',
    'SPEC.md:7: LOOK.md: it names 06-look/LOOK.md of the package, which the folder does not hold',
    'SPEC.md:8: 00-frame.md: it names 00-frame.md of the package, which the folder does not hold',
    'SPEC.md:8: STATE.md: it names STATE.md of the package, which the folder does not hold',
    'SPEC.md:8: state.json: it names state.json of the package, which the folder does not hold');
});

test('--package: what is no name of the package is let be: a pointer in words, a name the folder holds, the builder\'s place, a longer name, an ordinary word', () => {
  const stands = text => {
    const dir = packaged({ 'PARTS.md': `# Parts\n\n${text}\n` });
    const r = judged(dir);
    assert.deepEqual([r.status, r.stderr], [0, ''], text);
  };
  // A pointer that names no file is out of this check's reach: the cold implementer still reads for it.
  stands('The cleaning time (answer 28), as listed. (Dependency 4) As decided at Detail. Option B.');
  // What the folder holds itself, wherever in it, though the package holds a file of that name elsewhere.
  stands('See `strings.json`, `DECISIONS.md`, `today-default-en.html`, `look.css` and the picture `today-default-en-390-light.png` in `prototype/shots/`.');
  // The builder's place, beside the folder.
  stands('Write `../build/STATES.md`, `build/BUILD.md` and `DEVIATIONS.md`, in `../build/`.');
  // A longer name is another name; so is one written in another case.
  stands('OUTLOOK.md, measures.md.bak, my-measures.md, x_measures.md, metadata.json, measures.mdx, a.measures.md, Measures.md, look.md, detail.MD');
  // A folder's name is a word like any other until it is written as a path.
  stands('The work is done once she reads the screens: the descriptions are short. 06-look is a stage, and so is 05-detail.');
  stands('homework/ and network/x are no folders of it; nor is upwork/.');
  // The folder's own name is no pointer back, and what a file browser left in the package is no file of it.
  stands('This folder is `07-handoff/`: start at 07-handoff/HANDOFF.md. A stray .DS_Store means nothing.');
  // A name of the project's, which the package does not hold.
  stands('The tokens come from `src/styles/tokens.css`, last changed in `a1b2c3d`. See README.md.');
});

test('--package: a name is found wherever it is written whole: in a path, in quotes, at the end of a sentence, behind a backslash', () => {
  points(packaged({ 'PARTS.md': 'In measures.md.\n"measures.md"\n(see ../06-look/measures.md)\n06-look\\measures.md\n`work/`\ntoday/work\n<measures.md>, measures.md; measures.md: measures.md!\n' }),
    'PARTS.md:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'PARTS.md:2: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'PARTS.md:3: 06-look/: it names 06-look/ of the package, which the folder does not hold',
    'PARTS.md:3: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'PARTS.md:4: 06-look/: it names 06-look/ of the package, which the folder does not hold',
    'PARTS.md:4: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'PARTS.md:5: work/: it names work/ of the package, which the folder does not hold',
    'PARTS.md:6: work/: it names work/ of the package, which the folder does not hold',
    'PARTS.md:7: measures.md: it names 06-look/measures.md of the package, which the folder does not hold');
  // A file with no ending is found as a folder is, in a path; and a name the package holds twice is said to be one of them.
  points(packaged({ 'PARTS.md': 'The notes are in work/notes. These notes are short.\nThe page was 05-detail/prototype/today-loading-en.html.\n' }, 'twice'),
    'PARTS.md:1: notes: it names work/notes of the package, which the folder does not hold',
    'PARTS.md:1: work/: it names work/ of the package, which the folder does not hold',
    'PARTS.md:2: 05-detail/: it names 05-detail/ of the package, which the folder does not hold');
});

test('--package: a name the package holds in two places is printed with the first and their number', () => {
  // The first in the order of the paths, as they are compared character by character: "06-look-old/" comes before "06-look/".
  const dir = fresh({ ...PACKAGE, '06-look-old/measures.md': '# Earlier\n', '08-acceptance/measures.md': '# Later\n', ...Object.fromEntries(Object.entries({ ...FOLDER, ...HANDED, 'PARTS.md': 'See measures.md.\n' }).map(([file, text]) => [`07-handoff/${file}`, text])) });
  const r = run(dir, '07-handoff', '--package', '.');
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.equal(r.stderr.split('\n')[0], 'PARTS.md:1: measures.md: it names 06-look-old/measures.md of the package (one of 3 of that name), which the folder does not hold');
});

test('--package: every text file is read, whatever its ending and its depth; a file that is no text is passed over', () => {
  const dir = packaged({
    'accept-inpage.js': '// see measures.md\n',
    'strings/es.po': 'msgid "measures.md"\n',
    // Printed in the order of the paths, character by character: "strings-notes.txt" comes before "strings/".
    'strings-notes.txt': 'measures.md\n',
    'prototype/shots/notes.txt': 'measures.md\n',
    // A picture: its bytes are no text, whatever they spell.
    'prototype/shots/today-default-en-1280-light.png': '\u0000PNG measures.md\u0000',
    'EMPTY.md': '',
  });
  points(dir,
    'accept-inpage.js:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'prototype/shots/notes.txt:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'strings-notes.txt:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'strings/es.po:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold');
  // CRLF line endings count lines the same way.
  points(packaged({ 'PARTS.md': 'One.\r\nTwo.\r\nSee measures.md.\r\n' }), 'PARTS.md:3: measures.md: it names 06-look/measures.md of the package, which the folder does not hold');
});

test('--package: an address that leaves the folder and a name that points back are both printed, the addresses first, each with its count', () => {
  const dir = packaged({ 'prototype/today-default-en.html': page('<link rel="stylesheet" href="../../06-look/screens/look.css">'), 'PARTS.md': 'See measures.md.\n' });
  const r = judged(dir);
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.deepEqual(r.stderr.trimEnd().split('\n'), [
    'prototype/today-default-en.html: ../../06-look/screens/look.css: it leaves the folder: ".." climbs above it',
    '1 reference of 07-handoff does not lead to a file inside it',
    'PARTS.md:1: measures.md: it names 06-look/measures.md of the package, which the folder does not hold',
    'prototype/today-default-en.html:8: 06-look/: it names 06-look/ of the package, which the folder does not hold',
    'prototype/today-default-en.html:8: screens/: it names 06-look/screens/ of the package, which the folder does not hold',
    '3 places of 07-handoff name a file or folder of . that it does not hold',
  ]);
});

test('--package: the package is a folder that can be read and is not the folder itself; the folder may be anywhere', () => {
  const dir = packaged();
  for (const [args, status, message] of [
    [['07-handoff', '--package'], 2, /^--package needs a value\n\nUsage: /],
    [['07-handoff', '--package', '07-handoff'], 2, /^--package is the folder itself: name the package it is in\n\nUsage: /],
    [['07-handoff', '--package', './07-handoff/'], 2, /^--package is the folder itself: name the package it is in\n\nUsage: /],
    [['07-handoff', '--package', 'nowhere'], 1, /^cannot read nowhere: not found\n$/],
    [['07-handoff', '--package', 'STATE.md'], 1, /^cannot read STATE\.md: it is a file, not a folder\n$/],
  ]) {
    const r = run(dir.pkg, ...args);
    assert.deepEqual([r.status, r.stdout], [status, ''], args.join(' '));
    assert.match(r.stderr, message, args.join(' '));
  }
  // A folder that is not in the package holds nothing of it: every name of the package is one it does not hold.
  const outside = fresh({ ...FOLDER, 'PARTS.md': 'See strings.json and build/BUILD.md.\n' });
  const r = run(root, outside.slice(root.length + 1), '--package', dir.pkg.slice(root.length + 1));
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.match(r.stderr, /^PARTS\.md:1: strings\.json: it names 05-detail\/strings\.json of the package \(one of 2 of that name\), which the folder does not hold\n1 place of /);
});

test('pointers(folder, package) lists each place, and throws as alone does', () => {
  const dir = packaged({ 'PARTS.md': 'See measures.md.\n\nAnd work/notes.\n' });
  assert.deepEqual(pointers(dir.folder, dir.pkg), {
    files: TEXT_FILES + 1,
    faults: [
      { file: 'PARTS.md', line: 1, name: 'measures.md', where: '06-look/measures.md', of: 1 },
      { file: 'PARTS.md', line: 3, name: 'notes', where: 'work/notes', of: 1 },
      { file: 'PARTS.md', line: 3, name: 'work/', where: 'work/', of: 1 },
    ],
  });
  assert.throws(() => pointers(dir.folder, join(root, 'nowhere')), e => e instanceof AloneError && /^cannot read .*nowhere: not found$/.test(e.message));
  assert.throws(() => pointers(join(root, 'nowhere'), dir.pkg), e => e instanceof AloneError && /^cannot read .*nowhere: not found$/.test(e.message));
  for (const bad of [undefined, '', 7, null]) {
    assert.throws(() => pointers(bad, dir.pkg), TypeError);
    assert.throws(() => pointers(dir.folder, bad), TypeError);
  }
});

test('--help says what --package reads, what a name is, and what is let be', () => {
  const help = run(root, '--help').stdout.replace(/\s+/g, ' ');
  for (const said of [
    'With --package it also proves that nothing in the folder points back into its package',
    'every file of the folder that is text (one that holds no NUL byte: Markdown, JSON, a stylesheet and a page with their comments, a script) is read, line by line',
    'for the name of any file or folder of the package that the folder does not hold',
    'A name of the package is the name of a file or a folder anywhere under it, but in the folder itself and in the package\'s build/ folder, which is the builder\'s place',
    'A name the folder holds too, anywhere in it, is no name of the package',
    'A name with a dot in it, as measures.md, is found wherever it is written whole, as it is written, capitals and all',
    'A name with no dot, as work or 06-look, could be a word: it is found only where it is written as a path, a slash before it or after it',
    'A pointer that names no file, as "answer 28" or "as decided at Detail", is not seen',
    '"<file>:<line>: <name>: it names <its path in the package> of the package, which the folder does not hold"',
  ]) assert.ok(help.includes(said), said);
});
