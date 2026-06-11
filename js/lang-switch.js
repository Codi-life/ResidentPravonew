/**
 * ResidentPravo — Smart Language Switcher
 * Updates .lang-switch and .mobile-menu-lang links so the user always lands
 * on the same page in the other language, never on the homepage.
 *
 * URL structure
 *   RU homepage   /
 *   EN homepage   /en/
 *   RU pages      /ru/{slug}
 *   EN pages      /en/{slug}         ← service/content pages
 *   EN legal      /{slug}            ← privacy-policy, terms-of-use live at root
 *   RU legal      /ru/{slug}
 */
(function () {
  // Pages where the EN version lives at root level (no /en/ prefix).
  // Add any new root-level EN pages here.
  var ROOT_EN_PAGES = ['privacy-policy', 'terms-of-use'];

  // Normalize pathname: strip trailing slashes, strip .html extension (local dev)
  var path = location.pathname
    .replace(/\/+$/, '')          // remove trailing slashes
    .replace(/\.html$/, '')       // strip .html (local dev server adds it)
    || '/';

  function getRuUrl() {
    if (path === '/' || path === '/en') return '/';
    if (path.startsWith('/en/')) return '/ru/' + path.slice(4);
    if (path.startsWith('/ru/')) return path;   // already RU
    // Root-level path is an EN page → /ru/{slug}
    return '/ru' + path;
  }

  function getEnUrl() {
    if (path === '/') return '/en/';
    if (path === '/en') return '/en/';
    if (path.startsWith('/en/')) return path;   // already EN
    if (path.startsWith('/ru/')) {
      var slug = path.slice(4);
      // Legal pages live at root, all others under /en/
      return ROOT_EN_PAGES.indexOf(slug) !== -1 ? '/' + slug : '/en/' + slug;
    }
    // Root-level path is already EN (e.g. /privacy-policy)
    return path;
  }

  var ruUrl = getRuUrl();
  var enUrl = getEnUrl();

  // Apply to every RU/EN link in both header and mobile menu
  var links = document.querySelectorAll(
    '.lang-switch a, .mobile-menu-lang a'
  );
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var lang = a.getAttribute('hreflang');
    if (lang === 'ru') a.href = ruUrl;
    if (lang === 'en') a.href = enUrl;
  }
})();
