'use strict';

// A small, deterministic renderer for the Markdown subset used in content/.
// Supported: headings, paragraphs, nested lists, tables, fenced code,
// blockquotes, horizontal rules, inline code, bold, italics and links.
// All text is HTML-escaped; links are restricted to safe URL schemes.

const LIST_ITEM_RE = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/;
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const FENCE_RE = /^```([\w-]*)\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR_RE = /^\s*(-{3,}|\*{3,})\s*$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Only relative URLs, anchors and http(s)/mailto links are allowed.
function safeUrl(url) {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#|\.\.?\/)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+(\/[\w.-]*)*(#[\w-]*)?$/.test(trimmed)) return trimmed;
  return '#';
}

function renderInline(text) {
  return String(text)
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      let html = escapeHtml(part);
      html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => `<a href="${safeUrl(url)}">${label}</a>`);
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
      return html;
    })
    .join('');
}

function indentOf(line) {
  return line.match(/^\s*/)[0].replace(/\t/g, '    ').length;
}

function isBlank(line) {
  return /^\s*$/.test(line);
}

function isTableStart(lines, i) {
  return TABLE_ROW_RE.test(lines[i]) && i + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[i + 1]);
}

function isBlockStart(lines, i) {
  const line = lines[i];
  return FENCE_RE.test(line) || HEADING_RE.test(line) || HR_RE.test(line) || QUOTE_RE.test(line)
    || LIST_ITEM_RE.test(line) || isTableStart(lines, i);
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);
  return row.split('|').map((cell) => cell.trim());
}

function renderTable(header, rows) {
  const head = header.map((cell) => `<th>${renderInline(cell)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${header.map((_, i) => `<td>${renderInline(row[i] || '')}</td>`).join('')}</tr>`)
    .join('\n');
  return `<div class="w3-responsive"><table class="w3-table-all">\n<thead><tr>${head}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table></div>`;
}

function parseList(lines, start, baseIndent) {
  const ordered = /^\s*\d+\./.test(lines[start]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      let next = i + 1;
      while (next < lines.length && isBlank(lines[next])) next++;
      if (next < lines.length && LIST_ITEM_RE.test(lines[next]) && indentOf(lines[next]) >= baseIndent) {
        i = next;
        continue;
      }
      break;
    }
    const indent = indentOf(line);
    const match = line.match(LIST_ITEM_RE);
    if (match && indent === baseIndent) {
      items.push({ text: match[3], children: '' });
      i++;
    } else if (match && indent > baseIndent && items.length) {
      const [html, next] = parseList(lines, i, indent);
      items[items.length - 1].children += html;
      i = next;
    } else if (!match && indent > baseIndent && items.length) {
      items[items.length - 1].text += ` ${line.trim()}`;
      i++;
    } else {
      break;
    }
  }
  const tag = ordered ? 'ol' : 'ul';
  const body = items.map((item) => `<li>${renderInline(item.text)}${item.children}</li>`).join('\n');
  return [`<${tag}>\n${body}\n</${tag}>`, i];
}

function render(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++;
      const cls = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
      out.push(`<pre class="w3-code"><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level} id="${slugify(heading[2])}">${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    if (isTableStart(lines, i)) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && TABLE_ROW_RE.test(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(renderTable(header, rows));
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoted = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) quoted.push(lines[i++].match(QUOTE_RE)[1]);
      out.push(`<blockquote class="w3-panel w3-leftbar">\n${render(quoted.join('\n'))}\n</blockquote>`);
      continue;
    }

    if (LIST_ITEM_RE.test(line)) {
      const [html, next] = parseList(lines, i, indentOf(line));
      out.push(html);
      i = next;
      continue;
    }

    const paragraph = [line.trim()];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !isBlockStart(lines, i)) paragraph.push(lines[i++].trim());
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Plain text for search indexing: strips Markdown syntax but keeps the words.
function toPlainText(markdown) {
  return String(markdown)
    .replace(/\r\n?/g, '\n')
    .replace(/```[\w-]*\n?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*([-*]|\d+\.)\s+/gm, '')
    .replace(/[*`|>]/g, ' ')
    .replace(/^\s*:?-{3,}.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { render, renderInline, escapeHtml, slugify, safeUrl, toPlainText };
