#!/usr/bin/env node
/**
 * indexnow-ping.js — notify Bing/Yandex of changed URLs via IndexNow.
 *
 * Run manually after publishing real content changes (new/updated pages):
 *   node scripts/indexnow-ping.js                  → submits every URL in sitemap.xml
 *   node scripts/indexnow-ping.js <url> [url...]    → submits only the given URLs
 *
 * Key file (00eb9fcc34868b651a13235afc3672a7.txt) lives at the site root and
 * must stay in sync with INDEXNOW_KEY below — it's how IndexNow verifies
 * ownership of residentpravo.com.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const HOST = 'www.residentpravo.com';
const INDEXNOW_KEY = '00eb9fcc34868b651a13235afc3672a7';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const ROOT = path.join(__dirname, '..');

function urlsFromSitemap() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1]);
}

const urlList = process.argv.length > 2 ? process.argv.slice(2) : urlsFromSitemap();

if (!urlList.length) {
  console.error('No URLs to submit.');
  process.exit(1);
}

const payload = JSON.stringify({
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList,
});

const req = https.request(
  {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log(`IndexNow: ${res.statusCode} — submitted ${urlList.length} URL(s)`);
      if (body) console.log(body);
    });
  }
);

req.on('error', (err) => {
  console.error('IndexNow request failed:', err.message);
  process.exit(1);
});

req.write(payload);
req.end();
