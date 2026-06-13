/* ResidentPravo — GA4 Event Tracking
   Measurement ID: G-HCRR0HFHLC
   Tracks: WhatsApp, Telegram, email, social, form submissions
*/
(function () {
  'use strict';

  function track(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  function getLabel(el) {
    return (el.textContent || '').trim().slice(0, 60) || el.getAttribute('aria-label') || '';
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── WhatsApp (data-wa CTA buttons) ── */
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('whatsapp_click', {
          event_category: 'contact',
          event_label: getLabel(el) || 'WhatsApp CTA',
          page_location: window.location.href
        });
      });
    });

    /* ── WhatsApp (direct wa.me links in footer / social) ── */
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
      if (!el.hasAttribute('data-wa')) {           // avoid double-counting
        el.addEventListener('click', function () {
          track('whatsapp_click', {
            event_category: 'contact',
            event_label: 'WhatsApp Social',
            page_location: window.location.href
          });
        });
      }
    });

    /* ── Telegram ── */
    document.querySelectorAll('a[href*="t.me"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('telegram_click', {
          event_category: 'contact',
          event_label: getLabel(el) || 'Telegram',
          page_location: window.location.href
        });
      });
    });

    /* ── Phone ── */
    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('phone_click', {
          event_category: 'contact',
          event_label: el.getAttribute('href').replace('tel:', ''),
          page_location: window.location.href
        });
      });
    });

    /* ── Email ── */
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('email_click', {
          event_category: 'contact',
          event_label: el.getAttribute('href').replace('mailto:', ''),
          page_location: window.location.href
        });
      });
    });

    /* ── Social (Instagram, Facebook, LinkedIn) ── */
    var socialPatterns = {
      instagram: 'instagram.com',
      facebook:  'facebook.com',
      linkedin:  'linkedin.com'
    };
    Object.keys(socialPatterns).forEach(function (network) {
      document.querySelectorAll('a[href*="' + socialPatterns[network] + '"]').forEach(function (el) {
        el.addEventListener('click', function () {
          track('social_click', {
            event_category: 'social',
            event_label: network,
            page_location: window.location.href
          });
        });
      });
    });

    /* ── Form submissions ── */
    document.querySelectorAll('form').forEach(function (form) {
      form.addEventListener('submit', function () {
        track('form_submit', {
          event_category: 'engagement',
          event_label: form.id || form.getAttribute('name') || 'form',
          page_location: window.location.href
        });
      });
    });

  });
})();
