/**
 * sync-nav.js — единый источник правды для навигации.
 * Запускать: node scripts/sync-nav.js
 * Встроен в npm run build (vercel.json buildCommand → "npm run build").
 *
 * Эталонный порядок:
 *   RU: Услуги → Почему мы → Процесс → Кейсы → Блог → FAQ
 *   EN: Services → Why Us → Process → Cases → Blog → FAQ
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Canonical priority by link text (lower = earlier in menu)
const ORDER = {
  'Услуги': 0,   'Services': 0,
  'Почему мы': 1, 'Why Us': 1,
  'О нас': 1,     // legacy alias → rename to Почему мы
  'Процесс': 2,  'Process': 2,
  'Кейсы': 3,    'Cases': 3,
  'Блог': 4,     'Blog': 4,
  'FAQ': 5,
};

// Text renames (applied before sorting)
const RENAME = { 'О нас': 'Почему мы' };

// ── helpers ──────────────────────────────────────────────────────────────────

function sortLinks(links) {
  return [...links].sort((a, b) => {
    const ai = ORDER[a.text] ?? 99;
    const bi = ORDER[b.text] ?? 99;
    return ai - bi;
  });
}

/**
 * Reorder <a href="...">text</a> inside a block of HTML.
 * Only touches simple nav anchors (no class, not btn, not lang switch).
 * Returns { html, changed } where changed is true if any reordering happened.
 */
function fixNavBlock(blockHtml) {
  const NAV_A = /<a href="([^"]+)">([\s\S]*?)<\/a>/g;

  // Collect only plain nav anchors (no class attribute, not the WA button)
  const entries = [];
  let m;
  while ((m = NAV_A.exec(blockHtml)) !== null) {
    const full = m[0];
    // skip anchors with class= attribute (lang links, WA btn etc.)
    if (full.includes(' class=')) continue;
    // skip anchors with data- attributes
    if (full.includes(' data-')) continue;
    const text = (RENAME[m[2].trim()] || m[2].trim());
    if (ORDER[text] === undefined) continue; // unknown link — leave alone
    entries.push({ full: m[0], href: m[1], text, index: m.index });
  }

  if (entries.length < 2) return { html: blockHtml, changed: false };

  const sorted = sortLinks(entries);

  // Check if already in order
  const already = entries.every((e, i) => e.text === sorted[i].text);
  if (already && !entries.some(e => RENAME[e.text])) {
    return { html: blockHtml, changed: false };
  }

  // Replace in original positions: put sorted[i].text + sorted[i].href at entries[i].index
  let result = blockHtml;
  // We do replacements from last to first to preserve indices
  const pairs = entries.map((orig, i) => ({ orig, replacement: sorted[i] }));
  pairs.reverse();
  for (const { orig, replacement } of pairs) {
    const newAnchor = `<a href="${replacement.href}">${replacement.text}</a>`;
    result = result.slice(0, orig.index) + newAnchor + result.slice(orig.index + orig.full.length);
  }

  return { html: result, changed: true };
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Desktop nav: <nav class="menu"…>…</nav> (allow extra attributes like aria-label)
  html = html.replace(/(<nav class="menu"[^>]*>)([\s\S]*?)(<\/nav>)/, (match, open, inner, close) => {
    const { html: fixed, changed: c } = fixNavBlock(inner);
    if (c) changed = true;
    return open + fixed + close;
  });

  // 2. Mobile menu: <div class="mobile-menu"…>…</div>
  html = html.replace(/(<div class="mobile-menu"[^>]*>)([\s\S]*?)(<\/div>)/, (match, open, inner, close) => {
    const { html: fixed, changed: c } = fixNavBlock(inner);
    if (c) changed = true;
    return open + fixed + close;
  });

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  }

  return changed;
}

// ── main ──────────────────────────────────────────────────────────────────────

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = findHtmlFiles(ROOT);
let fixedCount = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  try {
    const fixed = processFile(file);
    if (fixed) {
      console.log('  [fixed] ' + rel);
      fixedCount++;
    }
  } catch (e) {
    console.error('  [error] ' + rel + ': ' + e.message);
  }
}

console.log(`\nsync-nav: ${fixedCount} file(s) updated, ${files.length - fixedCount} already correct.`);
