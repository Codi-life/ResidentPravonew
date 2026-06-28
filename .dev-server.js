const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT    = __dirname;
const PORT    = 3000;
const config  = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const REWRITES = (config.rewrites || []).map(r => ({ source: r.source, destination: r.destination }));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain',
  '.xml':  'application/xml; charset=utf-8',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

function resolve(urlPath) {
  for (const rw of REWRITES) {
    if (urlPath === rw.source || urlPath === rw.source + '/') {
      return path.join(ROOT, rw.destination);
    }
  }
  let candidate = path.join(ROOT, urlPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  if (fs.existsSync(candidate + '.html')) return candidate + '.html';
  const idx = path.join(candidate, 'index.html');
  if (fs.existsSync(idx)) return idx;
  return null;
}

// ── Mock /api/contact для localhost (без реальной отправки email) ──
function handleContactApi(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch { data = {}; }

    // Honeypot
    if (data._gotcha) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // Валидация
    const errors = {};
    if (!String(data.name    || '').trim()) errors.name    = 'required';
    if (!String(data.phone   || '').trim()) errors.phone   = 'required';
    if (!String(data.service || '').trim()) errors.service = 'required';

    if (Object.keys(errors).length > 0) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Validation failed', fields: errors }));
      return;
    }

    // Логируем заявку в консоль (вместо отправки письма)
    console.log('\n📬 [DEV] Новая заявка:');
    console.log('  Имя:      ', data.name);
    console.log('  Телефон:  ', data.phone);
    console.log('  Email:    ', data.email   || '—');
    console.log('  Услуга:   ', data.service);
    console.log('  Комментарий:', data.comment || '—');
    console.log('  Язык:     ', data.lang    || '—');
    console.log('  Страница: ', data.page    || '—');
    console.log('  Время:    ', data.sent_at || new Date().toISOString());
    console.log('  ⚠️  DEV MODE: письмо НЕ отправлено. В продакшене придёт на residentpravo@gmail.com\n');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // API route
  if (urlPath === '/api/contact' && req.method === 'POST') {
    return handleContactApi(req, res);
  }

  // Static files
  const file = resolve(urlPath);

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  const ext  = path.extname(file).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log('Dev server running at http://localhost:' + PORT);
  console.log('  /api/contact → mock (логирует в консоль, не отправляет email)');
});
