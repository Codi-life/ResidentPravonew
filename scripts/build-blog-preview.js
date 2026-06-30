#!/usr/bin/env node
/**
 * build-blog-preview.js
 *
 * Reads /ru/blog/index.html and /en/blog/index.html, extracts all published
 * articles (cards that have a real date — not "Скоро"/"Coming soon"), sorts
 * them newest-first, and injects the top 3 as bp-card HTML into index.html
 * and index-en.html between the marker comments:
 *
 *   <!-- BLOG:RU:START --> ... <!-- BLOG:RU:END -->
 *   <!-- BLOG:EN:START --> ... <!-- BLOG:EN:END -->
 *
 * Run:  node scripts/build-blog-preview.js
 * Vercel runs this automatically via the buildCommand in package.json.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ─── Date parsing ────────────────────────────────────────────────────────────

const RU_MONTHS = {
  'января':1,'февраля':2,'марта':3,'апреля':4,'мая':5,'июня':6,
  'июля':7,'августа':8,'сентября':9,'октября':10,'ноября':11,'декабря':12
};

const EN_MONTHS = {
  'january':1,'february':2,'march':3,'april':4,'may':5,'june':6,
  'july':7,'august':8,'september':9,'october':10,'november':11,'december':12
};

function parseDate(text, lang) {
  const t = text.trim();
  if (lang === 'ru') {
    // "25 июня 2026"
    const m = t.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
    if (!m) return null;
    const mo = RU_MONTHS[m[2].toLowerCase()];
    return mo ? new Date(+m[3], mo - 1, +m[1]) : null;
  }
  // EN: "June 24, 2026" or "25 June 2026"
  let m = t.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = EN_MONTHS[m[1].toLowerCase()];
    return mo ? new Date(+m[3], mo - 1, +m[2]) : null;
  }
  m = t.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mo = EN_MONTHS[m[2].toLowerCase()];
    return mo ? new Date(+m[3], mo - 1, +m[1]) : null;
  }
  return null;
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function attr(html, attrName) {
  const re = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const m  = html.match(re);
  // Ensure & is properly encoded for HTML attribute output
  return m ? m[1].replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;') : '';
}

// ─── Parse blog index ─────────────────────────────────────────────────────────

function parseBlogIndex(html, lang) {
  const articles = [];

  // Match every <article … </article> block (articles don't nest)
  const re = /<article\b[^>]*>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = re.exec(html)) !== null) {
    const block = match[0];

    // Must have a clickable overlay link (published articles only)
    const overlayMatch = block.match(/class="blog-card-overlay"[^>]*href="([^"]+)"/);
    if (!overlayMatch) continue;
    const href = overlayMatch[1];

    // Category
    const catMatch = block.match(/class="blog-card-cat"[^>]*>([\s\S]*?)<\/span>/);
    const category = catMatch ? stripTags(catMatch[1]) : '';

    // Date + reading time — first two <span>s inside .blog-card-meta
    let dateText = '', readingTime = '';
    const metaBlock = block.match(/class="blog-card-meta"[^>]*>([\s\S]*?)<\/div>/);
    if (metaBlock) {
      const spans = [...metaBlock[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)];
      if (spans[0]) dateText    = stripTags(spans[0][1]);
      if (spans[1]) readingTime = stripTags(spans[1][1]);
    }

    const parsedDate = parseDate(dateText, lang);
    if (!parsedDate) continue; // skip "Скоро" / "Coming soon"

    // Title
    const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : '';

    // Excerpt — use \b to avoid matching <picture>, <pre>, etc.
    const excerptMatch = block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    const excerpt = excerptMatch ? stripTags(excerptMatch[1]) : '';

    // Image — prefer WebP source + fallback jpg
    const webpSource = block.match(/<source[^>]*type="image\/webp"[^>]*>/);
    const imgTag     = block.match(/<img\b[^>]*class="blog-card-photo"[^>]*>/);

    let webpSrcset = '', jpgSrc = '', jpgSrcset = '', imgAlt = '', imgSizes = '(max-width:768px) 100vw, 400px';

    if (webpSource) webpSrcset = attr(webpSource[0], 'srcset');
    if (imgTag) {
      jpgSrc    = attr(imgTag[0], 'src');
      jpgSrcset = attr(imgTag[0], 'srcset');
      imgAlt    = attr(imgTag[0], 'alt');
      imgSizes  = attr(imgTag[0], 'sizes') || imgSizes;
    }

    articles.push({ href, category, dateText, readingTime, parsedDate, title, excerpt, webpSrcset, jpgSrc, jpgSrcset, imgAlt, imgSizes });
  }

  // Newest first, top 3
  articles.sort((a, b) => b.parsedDate - a.parsedDate);
  return articles.slice(0, 3);
}

// ─── Render bp-card HTML ──────────────────────────────────────────────────────

const CAL_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const CLOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

function renderCard(article, moreLabel) {
  const imgBlock = article.jpgSrc
    ? `
            <picture>
              <source type="image/webp" srcset="${article.webpSrcset}" sizes="${article.imgSizes}" />
              <img class="bp-card-photo" src="${article.jpgSrc}" srcset="${article.jpgSrcset}" sizes="${article.imgSizes}" alt="${article.imgAlt}" loading="lazy" decoding="async" />
            </picture>`
    : '';

  const readingTimeSpan = article.readingTime
    ? `<span>${CLOCK_SVG}${article.readingTime}</span>`
    : '';

  return `
        <article class="bp-card">
          <a class="bp-card-overlay" href="${article.href}" aria-hidden="true" tabindex="-1"></a>
          <div class="bp-card-img">
            ${imgBlock}
            <div class="bp-card-img-overlay"></div>
            <span class="bp-card-cat">${article.category}</span>
          </div>
          <div class="bp-card-body">
            <div class="bp-card-meta">
              <span>${CAL_SVG}${article.dateText}</span>
              ${readingTimeSpan}
            </div>
            <h3>${article.title}</h3>
            <p>${article.excerpt}</p>
            <a href="${article.href}" class="btn btn-outline">${moreLabel} →</a>
          </div>
        </article>`;
}

// ─── Inject into homepage ─────────────────────────────────────────────────────

function inject(indexPath, blogIndexPath, lang, readLabel, startMarker, endMarker) {
  const blogHtml  = fs.readFileSync(blogIndexPath, 'utf8');
  const articles  = parseBlogIndex(blogHtml, lang);

  if (articles.length === 0) {
    console.warn(`[${lang.toUpperCase()}] No published articles found — homepage unchanged.`);
    return;
  }

  const cardsHtml = articles.map(a => renderCard(a, readLabel)).join('\n');

  let indexHtml = fs.readFileSync(indexPath, 'utf8');

  const startEsc = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const endEsc   = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const markerRe = new RegExp(`(${startEsc})[\\s\\S]*?(${endEsc})`, 'g');

  const updated = indexHtml.replace(markerRe, `$1\n${cardsHtml}\n        $2`);

  if (updated === indexHtml) {
    const markersPresent = indexHtml.includes(startMarker) && indexHtml.includes(endMarker);
    if (!markersPresent) {
      console.warn(`[${lang.toUpperCase()}] Markers not found in ${path.basename(indexPath)} — add <!-- ${lang === 'ru' ? 'BLOG:RU' : 'BLOG:EN'}:START --> / END markers.`);
    } else {
      console.log(`[${lang.toUpperCase()}] Articles unchanged — ${path.basename(indexPath)} not rewritten.`);
    }
    return;
  }

  fs.writeFileSync(indexPath, updated, 'utf8');
  console.log(`[${lang.toUpperCase()}] Injected ${articles.length} article(s) → ${path.basename(indexPath)}`);
  articles.forEach(a => console.log(`       ${a.dateText}  ${a.title}`));
}

// ─── Run ──────────────────────────────────────────────────────────────────────

inject(
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'ru', 'blog', 'index.html'),
  'ru', 'Подробнее',
  '<!-- BLOG:RU:START -->',
  '<!-- BLOG:RU:END -->'
);

inject(
  path.join(ROOT, 'index-en.html'),
  path.join(ROOT, 'en', 'blog', 'index.html'),
  'en', 'Learn More',
  '<!-- BLOG:EN:START -->',
  '<!-- BLOG:EN:END -->'
);

console.log('\nBlog preview build complete.');
