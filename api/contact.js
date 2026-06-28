'use strict';

// Vercel Serverless Function — /api/contact
// Env vars required (Vercel → Settings → Environment Variables):
//   GMAIL_USER         = residentpravo@gmail.com
//   GMAIL_APP_PASSWORD = <16-char Google App Password>

const nodemailer = require('nodemailer');

const RECIPIENT = 'residentpravo@gmail.com';
const SUBJECT   = '🔔 Новая заявка с ResidentPravo';

function esc(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '—';
}

function buildHtml(d) {
  const val = (v, fallback = '—') => v ? esc(v) : `<span style="color:#aaa">${fallback}</span>`;

  const row = (icon, label, content) => `
    <tr>
      <td style="padding:0 0 16px 0;vertical-align:top;width:24px;font-size:18px;line-height:1">${icon}</td>
      <td style="padding:0 0 16px 16px;vertical-align:top">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8898aa;margin-bottom:3px">${label}</div>
        <div style="font-size:15px;color:#1a1a2e;line-height:1.45">${content}</div>
      </td>
    </tr>`;

  const divider = `<tr><td colspan="2" style="padding:0 0 16px 0"><div style="border-top:1px solid #e8ecf0"></div></td></tr>`;

  const phoneLink = d.phone
    ? `<a href="tel:${esc(d.phone.replace(/\s/g,''))}" style="color:#1D4ED8;text-decoration:none">${esc(d.phone)}</a>`
    : `<span style="color:#aaa">—</span>`;

  const emailLink = d.email
    ? `<a href="mailto:${esc(d.email)}" style="color:#1D4ED8;text-decoration:none">${esc(d.email)}</a>`
    : `<span style="color:#aaa">—</span>`;

  const pageLink = d.page
    ? `<a href="${esc(d.page)}" style="color:#1D4ED8;text-decoration:none;word-break:break-all">${esc(d.page)}</a>`
    : `<span style="color:#aaa">—</span>`;

  const serviceBadge = d.service
    ? `<span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:6px;padding:3px 10px;font-size:13px;font-weight:600">${esc(d.service)}</span>`
    : `<span style="color:#aaa">—</span>`;

  const comment = d.comment
    ? `<div style="background:#f8fafc;border-left:3px solid #38BDF8;border-radius:0 6px 6px 0;padding:10px 14px;font-size:14px;color:#334155;line-height:1.55;white-space:pre-line">${esc(d.comment)}</div>`
    : `<span style="color:#aaa">—</span>`;

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

  <!-- Header -->
  <tr><td style="background:#0A2540;border-radius:12px 12px 0 0;padding:28px 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#38BDF8;margin-bottom:6px">ResidentPravo</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;line-height:1.2">Новая заявка с сайта</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.55);margin-top:4px">${esc(d.sent_at || new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Nicosia' }))}</div>
        </td>
        <td align="right" style="vertical-align:top">
          <div style="background:#1D4ED8;border-radius:8px;padding:10px 16px;display:inline-block;text-align:center">
            <div style="font-size:22px;line-height:1">📋</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:4px;white-space:nowrap">${esc(d.lang || 'RU')}</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:28px 32px 8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
    <table width="100%" cellpadding="0" cellspacing="0">

      ${row('👤', 'Имя клиента', val(d.name))}
      ${divider}
      ${row('📱', 'Телефон / WhatsApp', phoneLink)}
      ${divider}
      ${row('✉️', 'Email', emailLink)}
      ${divider}
      ${row('⚡', 'Интересующая услуга', serviceBadge)}
      ${divider}
      ${row('💬', 'Комментарий', comment)}
      ${divider}
      ${row('🌐', 'Страница отправки', pageLink)}
      ${divider}
      ${row('🔒', 'IP-адрес', `<span style="font-family:monospace;font-size:13px;color:#64748b">${esc(d.ip || '—')}</span>`)}

    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#F8FAFC;padding:20px 32px;border:1px solid #e2e8f0;border-top:none">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:12px">Быстрые действия:</div>
          <table cellpadding="0" cellspacing="0">
            <tr>
              ${d.phone ? `<td style="padding-right:10px"><a href="https://wa.me/${d.phone.replace(/[^0-9]/g,'')}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:7px">💬 WhatsApp</a></td>` : ''}
              ${d.email ? `<td><a href="mailto:${esc(d.email)}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:7px">✉️ Ответить</a></td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0A2540;border-radius:0 0 12px 12px;padding:16px 32px">
    <div style="font-size:12px;color:rgba(255,255,255,0.40);text-align:center">
      ResidentPravo · <a href="https://residentpravo.com" style="color:rgba(255,255,255,0.55);text-decoration:none">residentpravo.com</a> · Письмо сгенерировано автоматически
    </div>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request body' });
  }

  const { name, phone, email, service, comment, lang, page, sent_at, _gotcha } = data;

  // Honeypot
  if (_gotcha) return res.status(200).json({ ok: true });

  // Server-side validation
  const errors = {};
  if (!String(name    || '').trim()) errors.name    = 'required';
  if (!String(phone   || '').trim()) errors.phone   = 'required';
  if (!String(service || '').trim()) errors.service = 'required';

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ ok: false, error: 'Validation failed', fields: errors });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[contact] Missing GMAIL_USER or GMAIL_APP_PASSWORD');
    return res.status(500).json({ ok: false, error: 'Email service not configured' });
  }

  const ip = getClientIp(req);

  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from:    `"ResidentPravo Website" <${process.env.GMAIL_USER}>`,
      to:      RECIPIENT,
      subject: SUBJECT,
      html:    buildHtml({ name, phone, email, service, comment, lang, page, sent_at, ip }),
      replyTo: email || undefined,
    });
    console.log(`[contact] sent: ${name} / ${phone} / ${service} / ${ip}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] SMTP error:', err.message);
    return res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
};
