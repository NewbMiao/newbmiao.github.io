(function() {
  'use strict';

  function defaultLocale() {
    return window.__SITE_LOCALE_DEFAULT || 'en';
  }

  function readLocale() {
    try {
      return localStorage.getItem('siteLocale') || defaultLocale();
    } catch (e) {
      return defaultLocale();
    }
  }

  function catalog() {
    return window.__SITE_LOCALES || { en: {}, zh: {} };
  }

  function dictFor(loc) {
    var c = catalog();
    if (loc === 'zh') return c.zh || {};
    return c.en || {};
  }

  function deferHiddenListMermaid() {
    var hidden = document.querySelectorAll(
      '.locale-list-excerpt.is-hidden pre.mermaid, .locale-list-title.is-hidden pre.mermaid'
    );
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].classList.remove('mermaid');
      hidden[i].setAttribute('data-mermaid-deferred', '1');
    }
  }

  function localeRowVisible(el, loc) {
    if (el.getAttribute('data-lang-pair')) return true;
    var lang = el.getAttribute('data-post-lang');
    if (!lang) return true;
    if (loc === 'en') return lang === 'en';
    return true;
  }

  function applyLocaleContentVisibility(loc) {
    var nodes = document.querySelectorAll(
      '.archive-article[data-post-lang], .recent-post-item[data-post-lang]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.classList.toggle('locale-content-hidden', !localeRowVisible(el, loc));
    }

    var articles = document.querySelectorAll('#main article.article-type-post[data-post-lang]');
    if (articles.length > 1) {
      for (var j = 0; j < articles.length; j++) {
        var art = articles[j];
        art.classList.toggle('locale-content-hidden', !localeRowVisible(art, loc));
      }
    }
  }

  function applyCategoryCounts(loc) {
    var counts = document.querySelectorAll('.category-list-count[data-locale-count-en]');
    for (var i = 0; i < counts.length; i++) {
      var el = counts[i];
      var n = parseInt(
        el.getAttribute(loc === 'zh' ? 'data-locale-count-zh' : 'data-locale-count-en'),
        10
      );
      if (isNaN(n)) n = 0;
      el.textContent = String(n);
    }
    var items = document.querySelectorAll('.category-list-item');
    for (i = 0; i < items.length; i++) {
      var li = items[i];
      var span = li.querySelector('.category-list-count');
      if (!span) continue;
      var n2 = parseInt(span.textContent, 10) || 0;
      li.classList.toggle('locale-category-hidden', n2 === 0);
    }
  }

  function applyListLocale(loc) {
    var titles = document.querySelectorAll('.locale-list-title');
    for (var i = 0; i < titles.length; i++) {
      var t = titles[i];
      t.classList.toggle('is-hidden', t.getAttribute('data-locale-title') !== loc);
    }

    var excerpts = document.querySelectorAll('.locale-list-excerpt');
    for (var i = 0; i < excerpts.length; i++) {
      var ex = excerpts[i];
      ex.classList.toggle('is-hidden', ex.getAttribute('data-locale-excerpt') !== loc);
    }

    var moreLinks = document.querySelectorAll('.locale-more-link');
    for (i = 0; i < moreLinks.length; i++) {
      var more = moreLinks[i];
      more.classList.toggle('is-hidden', more.getAttribute('data-locale-more') !== loc);
    }

    var recent = document.querySelectorAll('.recent-post-item[data-lang-pair]');
    for (i = 0; i < recent.length; i++) {
      var item = recent[i];
      var a = item.querySelector('a');
      if (!a) continue;
      var zh = item.getAttribute('data-title-zh');
      var en = item.getAttribute('data-title-en');
      if (loc === 'zh' && zh) a.textContent = zh;
      else if (en) a.textContent = en;
      else if (loc !== 'zh') a.textContent = item.getAttribute('data-title-en') || a.textContent;
      var href = item.getAttribute(loc === 'zh' ? 'data-href-zh' : 'data-href-en');
      if (href) a.setAttribute('href', href);
    }

    var linkItems = document.querySelectorAll('.locale-link-item');
    for (i = 0; i < linkItems.length; i++) {
      var li = linkItems[i];
      var enTitle = (li.getAttribute('data-title-en') || '').trim();
      var zhTitle = (li.getAttribute('data-title-zh') || '').trim();
      var title = loc === 'zh' ? zhTitle : enTitle;
      li.classList.toggle('locale-link-hidden', !title);
      var a = li.querySelector('.locale-link-name');
      if (a && title) a.textContent = title;
    }
  }

  function applyLocale(loc) {
    var dict = dictFor(loc);
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.hasAttribute('data-i18n-attr')) continue;
      var key = el.getAttribute('data-i18n');
      if (key && dict[key] != null) el.textContent = dict[key];
    }

    nodes = document.querySelectorAll('[data-i18n-placeholder]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      key = el.getAttribute('data-i18n-placeholder');
      if (key && dict[key] != null) el.setAttribute('placeholder', dict[key]);
    }

    nodes = document.querySelectorAll('[data-i18n-attr]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      key = el.getAttribute('data-i18n');
      var attr = el.getAttribute('data-i18n-attr');
      if (!key || !attr || dict[key] == null) continue;
      attr.split(/\s+/).forEach(function (name) {
        if (name) el.setAttribute(name, dict[key]);
      });
    }

    document.documentElement.lang = loc === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.setAttribute('data-site-locale', loc);

    var buttons = document.querySelectorAll('.site-lang-btn');
    for (i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var active = btn.getAttribute('data-locale') === loc;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    applyListLocale(loc);
    applyLocaleContentVisibility(loc);
    applyCategoryCounts(loc);

    if (typeof window.applyPagefindLangFilter === 'function') {
      window.applyPagefindLangFilter();
    }
  }

  function switchLocale(loc) {
    var postLoc = pageLocale();
    var onPost = postLoc != null;
    var alt = window.__postLangSwitch;
    var prev = readLocale();

    if (onPost && alt && alt.url && alt.targetLang === loc) {
      try {
        localStorage.setItem('siteLocale', loc);
      } catch (e) {}
      window.location.assign(alt.url);
      return;
    }

    // No paired translation: switch chrome only (menus, search), body stays same language.
    if (onPost && !alt) {
      if (loc === prev) return;
      try {
        localStorage.setItem('siteLocale', loc);
      } catch (e) {}
      applyLocale(loc);
      return;
    }

    if (onPost && postLoc === loc) return;
    if (!onPost && loc === prev) return;

    try {
      localStorage.setItem('siteLocale', loc);
    } catch (e) {}
    window.location.reload();
  }

  function pageLocale() {
    var articles = document.querySelectorAll('#main article.article-type-post[data-post-lang]');
    if (articles.length !== 1) return null;
    return articles[0].getAttribute('data-post-lang') || null;
  }

  function init() {
    var pageLoc = pageLocale();
    var alt = window.__postLangSwitch;
  var loc;
    if (pageLoc && alt) {
      loc = pageLoc;
      try {
        localStorage.setItem('siteLocale', pageLoc);
      } catch (e) {}
    } else {
      loc = readLocale();
    }
    applyLocale(loc);
    deferHiddenListMermaid();

    var bar = document.getElementById('site-lang-switch');
    if (!bar) return;
    var path = window.location.pathname || '/';
    if (!window.__postLangSwitch) {
      var btns = bar.querySelectorAll('.site-lang-btn');
      for (var b = 0; b < btns.length; b++) {
        btns[b].setAttribute('href', path);
      }
    }
    if (alt && alt.url && alt.targetLang) {
      var altLink = bar.querySelector('[data-locale="' + alt.targetLang + '"]');
      if (altLink) altLink.setAttribute('href', alt.url);
    }
    bar.addEventListener('click', function(ev) {
      var btn = ev.target.closest('[data-locale]');
      if (!btn) return;
      ev.preventDefault();
      switchLocale(btn.getAttribute('data-locale'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();