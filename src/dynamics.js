'use strict';

// Builds the "Human <-> Claude" loop visualization on the home page from
// content/home/dynamics.md. The SVG is generated deterministically at seed
// time, so engineers only edit Markdown and never touch SVG coordinates.

const { escapeHtml } = require('./markdown');
const { splitSections } = require('./content');

const STEP_RE = /^\d+\.\s+\*\*(Human|Claude)\*\*\s+[—–-]+\s+([^:]+):\s+(.+)$/;

function plain(text) {
  return String(text).replace(/`/g, '').replace(/\*\*/g, '').trim();
}

function parseDynamics(body) {
  const sections = splitSections(body);
  const loop = sections.Loop;
  if (!loop) throw new Error('dynamics.md: missing "## Loop" section');
  const steps = loop.split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line, index) => {
      const match = line.match(STEP_RE);
      if (!match) throw new Error(`dynamics.md: step ${index + 1} must look like "1. **Human** — Title: detail"`);
      return { actor: match[1], title: match[2].trim(), detail: plain(match[3]) };
    });
  if (steps.length < 2 || steps.length % 2 !== 0) {
    throw new Error(`dynamics.md: the loop needs an even number of steps (got ${steps.length})`);
  }
  return {
    steps,
    humans: sections['Humans steer'] || '',
    agents: sections['Agents do the work'] || '',
  };
}

function wrap(text, maxChars) {
  const lines = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && `${current} ${word}`.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Wide: a rectangle loop, first half left-to-right on top, second half
// right-to-left below. Tall: a single column with a return arrow on the side.
function layoutNodes(count, layout) {
  if (layout === 'wide') {
    const cols = count / 2;
    const w = 240; const h = 96; const gapX = 60; const gapY = 70; const margin = 30;
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const top = i < cols;
      const col = top ? i : count - 1 - i;
      nodes.push({ x: margin + col * (w + gapX), y: top ? margin : margin + h + gapY, w, h });
    }
    return { nodes, width: margin * 2 + cols * w + (cols - 1) * gapX, height: margin * 2 + h * 2 + gapY };
  }
  const w = 260; const h = 84; const gapY = 44; const margin = 24; const side = 56;
  const nodes = [];
  for (let i = 0; i < count; i++) nodes.push({ x: margin, y: margin + i * (h + gapY), w, h });
  return { nodes, width: margin + w + side + margin, height: margin * 2 + count * h + (count - 1) * gapY };
}

function arrowPath(a, b, layout, isReturn, width) {
  if (layout === 'tall' && isReturn) {
    const x = width - 24;
    const y1 = a.y + a.h / 2; const y2 = b.y + b.h / 2;
    return `M${a.x + a.w},${y1} H${x} V${y2} H${b.x + b.w + 6}`;
  }
  if (a.y === b.y) {
    const y = a.y + a.h / 2;
    return b.x > a.x ? `M${a.x + a.w},${y} H${b.x - 6}` : `M${a.x},${y} H${b.x + b.w + 6}`;
  }
  const x = a.x + a.w / 2;
  return b.y > a.y ? `M${x},${a.y + a.h} V${b.y - 6}` : `M${x},${a.y} V${b.y + b.h + 6}`;
}

function renderSvg(steps, layout) {
  const { nodes, width, height } = layoutNodes(steps.length, layout);
  const markerId = `dyn-arrow-${layout}`;
  const arrows = steps.map((_, i) => {
    const next = (i + 1) % steps.length;
    const d = arrowPath(nodes[i], nodes[next], layout, next === 0, width);
    return `<path class="dyn-arrow" d="${d}" marker-end="url(#${markerId})"/>`;
  });
  const maxChars = layout === 'wide' ? 22 : 26;
  const groups = steps.map((step, i) => {
    const n = nodes[i];
    const cx = n.x + n.w / 2;
    const actorClass = step.actor === 'Human' ? 'dyn-human' : 'dyn-agent';
    const lines = wrap(step.title, maxChars).slice(0, 2);
    const firstY = n.y + (lines.length === 1 ? 62 : 54);
    const tspans = lines.map((line, j) => `<tspan x="${cx}" y="${firstY + j * 22}">${escapeHtml(line)}</tspan>`).join('');
    const label = `Step ${i + 1}, ${step.actor}: ${step.title}. ${step.detail}`;
    return [
      `<g class="dyn-node ${actorClass}" tabindex="0" role="button" aria-label="${escapeHtml(label)}"`,
      ` data-step="${i + 1}" data-actor="${escapeHtml(step.actor)}" data-title="${escapeHtml(step.title)}" data-detail="${escapeHtml(step.detail)}">`,
      `<title>${escapeHtml(`${step.actor}: ${step.title} — ${step.detail}`)}</title>`,
      `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"/>`,
      `<text class="dyn-actor" x="${cx}" y="${n.y + 26}">${i + 1} · ${escapeHtml(step.actor.toUpperCase())}</text>`,
      `<text class="dyn-title" x="${cx}" y="${firstY}">${tspans}</text>`,
      '</g>',
    ].join('');
  });
  return [
    `<svg class="dynamics dynamics-${layout}" viewBox="0 0 ${width} ${height}" role="group" aria-label="The loop between the human engineer and Claude" xmlns="http://www.w3.org/2000/svg">`,
    `<defs><marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="dyn-arrow-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>`,
    ...arrows,
    ...groups,
    '</svg>',
  ].join('\n');
}

module.exports = { parseDynamics, renderSvg, wrap };
