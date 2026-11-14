// The acceptance checks, in the page. Plain browser JavaScript, one script with no import, export or
// require and no name of its own: a session evaluates this file's text through whatever driver its project
// uses (as a script, or as the body of a function), as often as it likes, and then calls
//
//   window.__uxAccept(checks) → [{ id, pass, actual, message }], one result per check, in order.
//
// A check is { id, type, target, …parameters }, with an optional `screen`: then its element is looked for
// inside the one element whose data-screen is that screen, and nowhere else. An element is named by its
// data-ux. A shadow root is not searched. A screen element's own data-ux is not inside that screen.
// Rendered means: not display: none or opacity: 0, on itself or on an element it is in; visibility:
// visible; painted, as the browser's checkVisibility() says (where it has none: not inside a closed
// <details> other than in its summary); and a box of some width and height.
// The types, and what each passes on:
//   visible      exactly one element has the id, and it is rendered
//   absent       no element has the id, or none that has it is rendered
//   text         what the one element shows, its runs of white space made one and trimmed, is `equals`, or
//                is matched by the regular expression `matches`: an input's or a textarea's value, a
//                select's chosen options joined by ", ", else the text whose own element is rendered
//                (its box aside), as written, whatever text-transform does
//                A placeholder is not text.
//                Two blocks with no white space between them read as joined.
//   order        the elements named in `targets` come in that order in the document
//   in-viewport  the one element is rendered, its whole box lies inside the first viewport (where it was
//                before any scrolling, and inside the page's scroll bars), and inside every element it is
//                in that clips what overflows it (other than the page's own), as each is scrolled now
//   min-size     the one element's box is at least `minWidth` by `minHeight` CSS pixels
//   contrast     the one element's text colour against the nearest background behind it that is not
//                transparent, translucent colours laid over what is behind them, down to the page's canvas
//                when nothing else is behind, has a WCAG ratio of at least `min`
//                It measures declared colours, composed, and nothing else.
//                It refuses to guess ("cannot be measured: …") over a background-image, an opacity below 1,
//                a filter, a backdrop-filter or a blend mode.
//   count        the number of rendered elements (their box aside) whose data-ux starts with `target` is
//                `equals`
// `actual` is what was measured (null when nothing could be), sizes and ratios to two decimals, never
// rounded up past what was measured; `message` says why a check failed, and is empty when it passed.
// It never throws, and it changes nothing on the page: a check that cannot be made (an element missing or
// twice, a type it does not know, a malformed check) is a failed result that says why, and the next check
// is made.
(function () {
  'use strict';

  // Why a check cannot be made: it fails, saying so.
  function Miss(message) {
    this.message = message;
  }

  var hasOwn = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  };
  var isText = function (value) {
    return typeof value === 'string' && value.trim() !== '';
  };
  var quoted = function (value) {
    return JSON.stringify(value);
  };
  // A measure to two decimals, never rounded up past what was measured.
  var two = function (n) {
    return Math.floor(n * 100) / 100;
  };
  var messageOf = function (e) {
    try {
      return e && typeof e.message === 'string' ? e.message : String(e);
    } catch (_) {
      return 'an error that cannot be read';
    }
  };

  // The elements under `root` whose `attribute` is `value`, compared as written.
  var withAttribute = function (root, attribute, value) {
    return Array.prototype.filter.call(root.querySelectorAll('[' + attribute + ']'), function (element) {
      return element.getAttribute(attribute) === value;
    });
  };

  // Where a check looks: the whole document, or the one element of its screen.
  function scopeOf(check) {
    if (!hasOwn(check, 'screen')) return { root: document, where: '' };
    if (!isText(check.screen)) throw new Miss('screen must be a non-empty string');
    var screens = withAttribute(document, 'data-screen', check.screen);
    var name = 'data-screen=' + quoted(check.screen);
    if (screens.length === 0) throw new Miss(name + ' not found');
    if (screens.length > 1) throw new Miss(name + ' found ' + screens.length + ' times; a screen must be on exactly one element');
    return { root: screens[0], where: ' in ' + name };
  }

  // The one element whose data-ux is `id` in the scope.
  function one(scope, id) {
    var found = withAttribute(scope.root, 'data-ux', id);
    var name = 'data-ux=' + quoted(id);
    if (found.length === 0) throw new Miss(name + ' not found' + scope.where);
    if (found.length > 1) throw new Miss(name + ' found ' + found.length + ' times' + scope.where + '; it must be on exactly one element');
    return found[0];
  }

  function targetOf(check) {
    if (!isText(check.target)) throw new Miss('target must be a non-empty string');
    return check.target;
  }

  // An element as a message names it: by its data-ux or data-screen, else by its tag and class.
  function named(element) {
    if (element.hasAttribute('data-ux')) return 'data-ux=' + quoted(element.getAttribute('data-ux'));
    if (element.hasAttribute('data-screen')) return 'data-screen=' + quoted(element.getAttribute('data-screen'));
    var className = element.getAttribute('class');
    return '<' + element.localName + (className ? ' class=' + quoted(className) : '') + '>';
  }

  var sizeOf = function (box) {
    return { width: two(box.width), height: two(box.height) };
  };
  var said = function (size) {
    return size.width + ' × ' + size.height;
  };

  // The closed <details> an element is inside, other than in its summary (the first summary in it, which a
  // closed one still shows), or null.
  function closedDetails(element) {
    for (var child = element, at = element.parentElement; at; child = at, at = at.parentElement) {
      if (at.localName === 'details' && !at.open && at.querySelector(':scope > summary') !== child) return at;
    }
    return null;
  }

  // Why the browser does not paint an element that has a display, or null: as checkVisibility() says when
  // it has it, else a closed <details>.
  function unpainted(element) {
    var closed = closedDetails(element);
    if (typeof element.checkVisibility !== 'function') return closed && 'inside the closed ' + named(closed);
    if (element.checkVisibility()) return null;
    if (closed) return 'inside the closed ' + named(closed);
    for (var at = element.parentElement; at; at = at.parentElement) {
      if (at.getAttribute('hidden') === 'until-found') return 'hidden="until-found" on ' + named(at);
      if (getComputedStyle(at).contentVisibility === 'hidden') return 'content-visibility: hidden on ' + named(at);
    }
    return 'the browser does not paint it';
  }

  // Why an element is not shown, its box aside, or null when it is: display and opacity are looked for on
  // it and on every element it is in, visibility on it alone, then whether the browser paints it.
  function unshown(element) {
    if (!element.isConnected) return 'it is not in the document';
    for (var at = element; at; at = at.parentElement) {
      var style = getComputedStyle(at);
      if (style.display === 'none') return 'display: none on ' + named(at);
      if (Number(style.opacity) === 0) return 'opacity: 0 on ' + named(at);
    }
    // Not walked up: visibility is inherited, and a child set visible inside a hidden parent is painted.
    var visibility = getComputedStyle(element).visibility;
    if (visibility !== 'visible') return 'visibility: ' + visibility;
    return unpainted(element);
  }

  // Why an element is not rendered, or null when it is: shown, and a box of some width and height.
  function unrendered(element) {
    var why = unshown(element);
    if (why !== null) return why;
    var box = element.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return 'its box is ' + said(sizeOf(box));
    return null;
  }

  // What an element shows as text: a text field's value, a select's chosen options, else the text whose
  // own element is shown. Throws a Miss for an input that shows no text.
  var NO_TEXT = ['checkbox', 'radio', 'file', 'hidden', 'range', 'color', 'image', 'password'];
  function shownText(element) {
    if (element.localName === 'input') {
      if (NO_TEXT.indexOf(element.type) !== -1) throw new Miss('an <input type="' + element.type + '"> shows no text');
      return element.value;
    }
    if (element.localName === 'textarea') return element.value;
    if (element.localName === 'select') {
      return Array.prototype.map.call(element.selectedOptions, function (option) {
        return option.text;
      }).join(', ');
    }
    var seen = new Map();
    var text = '';
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      var parent = node.parentElement;
      if (!seen.has(parent)) seen.set(parent, unshown(parent) === null);
      if (seen.get(parent)) text += node.data;
    }
    return text;
  }

  // The elements an element is in that clip what overflows them, other than the page's own (whose
  // overflow is the viewport's), each with the axes it clips.
  function clippers(element) {
    var found = [];
    for (var at = element.parentElement; at && at !== document.body && at !== document.documentElement; at = at.parentElement) {
      var style = getComputedStyle(at);
      var x = style.overflowX !== 'visible';
      var y = style.overflowY !== 'visible';
      if (x || y) found.push({ element: at, x: x, y: y });
    }
    return found;
  }

  // ---- colours

  var WHITE = { r: 255, g: 255, b: 255, a: 1 };
  // The canvas of a page that uses the dark scheme, as Chrome paints it.
  var DARK_CANVAS = { r: 18, g: 18, b: 18, a: 1 };
  var LEGACY = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/;

  // A computed colour as { r, g, b, a } in sRGB. rgb() and rgba() are read as written; any other (oklch,
  // lab, color()) is drawn on a canvas of one pixel that is never put on the page, and read back.
  function colourOf(text) {
    var legacy = LEGACY.exec(text);
    if (legacy) {
      return { r: Number(legacy[1]), g: Number(legacy[2]), b: Number(legacy[3]), a: legacy[4] === undefined ? 1 : Number(legacy[4]) };
    }
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    var context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#010203';
    context.fillStyle = text;
    if (context.fillStyle === '#010203' && !/^#010203$/i.test(text)) throw new Miss('the colour ' + quoted(text) + ' cannot be read');
    context.fillRect(0, 0, 1, 1);
    var pixel = context.getImageData(0, 0, 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 };
  }

  // `top` laid over an opaque `bottom`.
  var over = function (top, bottom) {
    var mix = function (key) {
      return top[key] * top.a + bottom[key] * (1 - top.a);
    };
    return { r: mix('r'), g: mix('g'), b: mix('b'), a: 1 };
  };

  // The page's canvas: dark when the root's colour scheme (its color-scheme, else the page's color-scheme
  // meta) uses dark, which it does when it names dark and either names no light or the theme is dark;
  // else white.
  function canvasColour() {
    var scheme = getComputedStyle(document.documentElement).colorScheme || 'normal';
    if (scheme === 'normal') {
      var meta = document.querySelector('meta[name="color-scheme"]');
      scheme = meta ? meta.getAttribute('content') || '' : '';
    }
    var words = scheme.trim().split(/\s+/);
    var dark = words.indexOf('dark') !== -1 && (words.indexOf('light') === -1 || matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? DARK_CANVAS : WHITE;
  }

  // What is behind an element's text: every background from the canvas up to its own, each laid over the
  // ones behind it. A transparent one changes nothing, and an opaque one hides all behind it, so this is the
  // nearest background that is not transparent, a translucent one laid over what is behind it.
  function behind(element) {
    var layers = [];
    for (var at = element; at; at = at.parentElement) layers.push(colourOf(getComputedStyle(at).backgroundColor));
    var colour = canvasColour();
    for (var i = layers.length - 1; i >= 0; i--) colour = over(layers[i], colour);
    return colour;
  }

  // An element as a refusal to measure names it: by its tag, and its data-ux when it has one.
  var tagged = function (element) {
    return '<' + element.localName + (element.hasAttribute('data-ux') ? ' data-ux=' + quoted(element.getAttribute('data-ux')) : '') + '>';
  };

  // Why an element's contrast cannot be measured from declared colours, or null: a background-image on it
  // or an element it is in, up to and with the nearest opaque background colour; an opacity below 1, a
  // filter, a backdrop-filter or a blend mode on it or on any element it is in.
  function unmeasurable(element) {
    var opaque = false;
    for (var at = element; at; at = at.parentElement) {
      var style = getComputedStyle(at);
      var refuse = function (property) {
        return 'cannot be measured: ' + property + ' on ' + tagged(at);
      };
      if (!opaque && style.backgroundImage !== 'none') return refuse('background-image');
      if (Number(style.opacity) < 1) return refuse('opacity');
      if (style.filter !== 'none') return refuse('filter');
      if ((style.backdropFilter || 'none') !== 'none') return refuse('backdrop-filter');
      if ((style.mixBlendMode || 'normal') !== 'normal') return refuse('mix-blend-mode');
      if (colourOf(style.backgroundColor).a >= 1) opaque = true;
    }
    return null;
  }

  // WCAG 2's relative luminance and contrast ratio.
  var linear = function (channel) {
    var c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  var luminance = function (colour) {
    return 0.2126 * linear(colour.r) + 0.7152 * linear(colour.g) + 0.0722 * linear(colour.b);
  };
  var ratioOf = function (x, y) {
    var a = luminance(x);
    var b = luminance(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  // ---- the checks: each gives { pass, actual, message }, or throws a Miss

  var passed = function (actual) {
    return { pass: true, actual: actual, message: '' };
  };
  var failed = function (actual, message) {
    return { pass: false, actual: actual, message: message };
  };

  var CHECKS = {
    visible: function (check, scope) {
      var element = one(scope, targetOf(check));
      var size = sizeOf(element.getBoundingClientRect());
      var why = unrendered(element);
      return why === null ? passed(size) : failed(size, 'not rendered: ' + why);
    },

    absent: function (check, scope) {
      var id = targetOf(check);
      var rendered = withAttribute(scope.root, 'data-ux', id).filter(function (element) {
        return unrendered(element) === null;
      }).length;
      if (rendered === 0) return passed(0);
      return failed(rendered, 'data-ux=' + quoted(id) + ' is rendered' + (rendered > 1 ? ', on ' + rendered + ' elements' : '') + scope.where);
    },

    text: function (check, scope) {
      var id = targetOf(check);
      if (hasOwn(check, 'equals') === hasOwn(check, 'matches')) throw new Miss('a text check takes exactly one of equals and matches');
      var pattern = null;
      if (hasOwn(check, 'equals')) {
        if (typeof check.equals !== 'string') throw new Miss('equals must be a string');
      } else {
        if (!isText(check.matches)) throw new Miss('matches must be a non-empty string');
        try {
          pattern = new RegExp(check.matches);
        } catch (e) {
          throw new Miss('matches is not a regular expression: ' + messageOf(e));
        }
      }
      var text = shownText(one(scope, id)).replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');
      if (pattern === null) return text === check.equals ? passed(text) : failed(text, 'the text is ' + quoted(text) + ', not ' + quoted(check.equals));
      return pattern.test(text) ? passed(text) : failed(text, 'the text ' + quoted(text) + ' does not match /' + check.matches + '/');
    },

    order: function (check, scope) {
      var targets = check.targets;
      if (!Array.isArray(targets) || targets.length < 2 || !targets.every(isText)) throw new Miss('targets must be a list of at least two ids');
      targets.forEach(function (id, i) {
        if (targets.indexOf(id) !== i) throw new Miss('targets names ' + quoted(id) + ' twice');
      });
      var elements = targets.map(function (id) {
        return one(scope, id);
      });
      var follows = function (a, b) {
        return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      };
      var inDocument = elements
        .slice()
        .sort(function (a, b) {
          return follows(a, b) ? -1 : 1;
        })
        .map(function (element) {
          return element.getAttribute('data-ux');
        });
      for (var i = 1; i < elements.length; i++) {
        if (!follows(elements[i - 1], elements[i])) return failed(inDocument, 'data-ux=' + quoted(targets[i]) + ' comes before data-ux=' + quoted(targets[i - 1]));
      }
      return passed(inDocument);
    },

    'in-viewport': function (check, scope) {
      var element = one(scope, targetOf(check));
      var why = unrendered(element);
      if (why !== null) return failed(null, 'not rendered: ' + why);
      // A fixed element stays where it is whatever the scroll; any other is put back where it was before
      // the page was scrolled.
      var fixed = false;
      for (var at = element; at && !fixed; at = at.parentElement) fixed = getComputedStyle(at).position === 'fixed';
      var box = element.getBoundingClientRect();
      var x = box.left + (fixed ? 0 : window.scrollX);
      var y = box.top + (fixed ? 0 : window.scrollY);
      var root = document.documentElement;
      var width = Math.min(window.innerWidth, root.clientWidth || window.innerWidth);
      var height = Math.min(window.innerHeight, root.clientHeight || window.innerHeight);
      var actual = { x: two(x), y: two(y), width: two(box.width), height: two(box.height) };
      var outside = [];
      if (x < 0) outside.push('its left edge is at ' + two(x));
      if (y < 0) outside.push('its top edge is at ' + two(y));
      if (x + box.width > width) outside.push('its right edge is at ' + two(x + box.width));
      if (y + box.height > height) outside.push('its bottom edge is at ' + two(y + box.height));
      var faults = outside.length === 0 ? [] : ['it is not inside the first viewport, ' + width + ' × ' + height + ': ' + outside.join(', ')];
      // Inside every element that clips it, as each is scrolled now: its padding box, scroll bars aside.
      clippers(element).forEach(function (clip) {
        var edge = clip.element.getBoundingClientRect();
        var left = edge.left + clip.element.clientLeft;
        var top = edge.top + clip.element.clientTop;
        var cut = (clip.x && (box.left < left || box.right > left + clip.element.clientWidth)) || (clip.y && (box.top < top || box.bottom > top + clip.element.clientHeight));
        if (cut) faults.push('it is clipped by ' + named(clip.element));
      });
      if (faults.length === 0) return passed(actual);
      return failed(actual, faults.join('; '));
    },

    'min-size': function (check, scope) {
      var id = targetOf(check);
      ['minWidth', 'minHeight'].forEach(function (key) {
        if (typeof check[key] !== 'number' || !isFinite(check[key]) || check[key] <= 0) throw new Miss(key + ' must be a number above 0');
      });
      var box = one(scope, id).getBoundingClientRect();
      var size = sizeOf(box);
      if (box.width >= check.minWidth && box.height >= check.minHeight) return passed(size);
      return failed(size, 'its box is ' + said(size) + ', less than ' + check.minWidth + ' × ' + check.minHeight);
    },

    contrast: function (check, scope) {
      var id = targetOf(check);
      if (typeof check.min !== 'number' || !(check.min >= 1 && check.min <= 21)) throw new Miss('min must be a number from 1 to 21');
      var element = one(scope, id);
      var refused = unmeasurable(element);
      if (refused !== null) return failed(null, refused);
      var background = behind(element);
      var ratio = ratioOf(over(colourOf(getComputedStyle(element).color), background), background);
      return ratio >= check.min ? passed(two(ratio)) : failed(two(ratio), 'the contrast is ' + two(ratio) + ', less than ' + check.min);
    },

    count: function (check, scope) {
      var prefix = targetOf(check);
      if (!Number.isSafeInteger(check.equals) || check.equals < 0) throw new Miss('equals must be a whole number from 0');
      var all = Array.prototype.filter.call(scope.root.querySelectorAll('[data-ux]'), function (element) {
        return element.getAttribute('data-ux').indexOf(prefix) === 0;
      });
      var n = all.filter(function (element) {
        return unshown(element) === null;
      }).length;
      if (n === check.equals) return passed(n);
      var unseen = all.length - n;
      var more = unseen === 0 ? '' : '; ' + unseen + (unseen === 1 ? ' more is there and not rendered' : ' more are there and not rendered');
      return failed(n, n + ' rendered elements have a data-ux starting with ' + quoted(prefix) + '; the check wants ' + check.equals + more);
    },
  };

  // One check, whatever it holds: a result, never a throw.
  function made(check) {
    var id = null;
    try {
      if (check === null || typeof check !== 'object' || Array.isArray(check)) return { id: null, pass: false, actual: null, message: 'the check is not an object' };
      if (!isText(check.id)) return { id: null, pass: false, actual: null, message: 'the check has no id' };
      id = check.id;
      var type = check.type;
      if (typeof type !== 'string' || !hasOwn(CHECKS, type)) return { id: id, pass: false, actual: null, message: 'unknown check type ' + (type === undefined ? 'undefined' : quoted(type)) };
      var found = CHECKS[type](check, scopeOf(check));
      return { id: id, pass: found.pass, actual: found.actual, message: found.message };
    } catch (e) {
      if (e instanceof Miss) return { id: id, pass: false, actual: null, message: e.message };
      return { id: id, pass: false, actual: null, message: 'the check could not be made: ' + messageOf(e) };
    }
  }

  window.__uxAccept = function (checks) {
    try {
      if (!Array.isArray(checks)) return [{ id: null, pass: false, actual: null, message: 'the checks must be a list' }];
      var results = [];
      for (var i = 0; i < checks.length; i++) results.push(made(checks[i]));
      return results;
    } catch (e) {
      return [{ id: null, pass: false, actual: null, message: 'the checks could not be read: ' + messageOf(e) }];
    }
  };
}());
