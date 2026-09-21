const { FilterXSS } = require('xss');

const plainFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});

const richFilter = new FilterXSS({
  whiteList: {
    p: ['class'], br: [], strong: [], b: [], em: [], i: [], u: [],
    ul: [], ol: [], li: [], blockquote: [], h1: [], h2: [], h3: [],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: [], thead: [], tbody: [], tr: [], th: [], td: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
});

function text(value) {
  if (typeof value !== 'string') return value;
  return plainFilter.process(value).trim();
}

function richText(value) {
  if (typeof value !== 'string') return value;
  return richFilter.process(value);
}

module.exports = { text, richText };
