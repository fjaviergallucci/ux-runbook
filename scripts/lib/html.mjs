// HTML written from strings the kit did not write: a maker's proposal, a stage's decision data. One escape
// and one tagged template serve every script that writes a page (render, the decision page), so no two
// pages escape two ways.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// The one escape. A string reaches a page through it, in text and in attributes alike, so it is shown as
// text and never read as markup; nothing else in it is changed.
export const escape = value => String(value).replace(/[&<>"']/g, ch => ENTITIES[ch]);

// Markup a script wrote. html`…` keeps its own literal text, and the markup of an inner html`…`; every
// other value put into it is escaped, and a list puts each of its values in turn. A string reaches the page
// no other way.
export class Markup {
  constructor(text) {
    this.text = text;
  }
}

const put = value => {
  if (value instanceof Markup) return value.text;
  if (Array.isArray(value)) return value.map(put).join('');
  return escape(value);
};

export function html(strings, ...values) {
  return new Markup(strings.reduce((out, string, i) => out + put(values[i - 1]) + string));
}
