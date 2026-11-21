(function () {
  'use strict';

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  // toTop
  var scrollElem = qs('#totop');
  var upperLimit = 1000;

  if (scrollElem) {
    on(window, 'scroll', function () {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      scrollElem.classList.toggle('is-visible', scrollTop > upperLimit);
    });

    on(scrollElem, 'click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function pagefindSiteLocale() {
    try {
      var v = localStorage.getItem('siteLocale');
      if (v === 'en' || v === 'zh') return v;
    } catch (err) { /* ignore */ }
    return document.documentElement.getAttribute('data-site-locale') || 'en';
  }

  function applyPagefindLangFilter() {
    if (!window.__pagefindUi) return;
    var loc = pagefindSiteLocale() === 'zh' ? 'zh' : 'en';
    if (typeof window.__pagefindUi.triggerFilters === 'function') {
      window.__pagefindUi.triggerFilters({ lang: [loc] });
    }
    var input =
      qs('#search-form-wrap .pagefind-ui__search-input') ||
      qs('#search-form-wrap input');
    if (input && input.value) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  window.applyPagefindLangFilter = applyPagefindLangFilter;

  function loadPagefind() {
    if (window.__pagefindUi) return Promise.resolve();
    if (window.__pagefindLoadPromise) return window.__pagefindLoadPromise;

    var cfg = window.__PAGEFIND_BOOT__;
    if (!cfg) {
      console.warn('Pagefind config missing. Run: npm run preview');
      return Promise.reject(new Error('Pagefind config missing'));
    }

    window.__pagefindLoadPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[data-pagefind-ui]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cfg.css;
        link.crossOrigin = 'anonymous';
        link.setAttribute('data-pagefind-ui', '1');
        document.head.appendChild(link);
      }

      import(cfg.moduleUrl)
        .then(function (mod) {
          var PagefindUI = mod.PagefindUI;
          if (!PagefindUI) throw new Error('PagefindUI export missing');
          var loc = pagefindSiteLocale() === 'zh' ? 'zh' : 'en';
          var bundlePath = cfg.bundlePath || '/pagefind/';
          if (bundlePath.indexOf('://') < 0) {
            bundlePath = new URL(bundlePath, window.location.href).href;
          }
          if (bundlePath.charAt(bundlePath.length - 1) !== '/') {
            bundlePath += '/';
          }
          window.__pagefindUi = new PagefindUI({
            element: '#pagefind-search',
            bundlePath: bundlePath,
            showSubResults: false,
            showImages: false,
            resetStyles: true,
            showEmptyFilters: false,
            filters: {lang: [loc]},
            translations: cfg.translations[loc],
            processResult: function (result) {
              if (result && result.meta && result.meta.lang != null) {
                var meta = Object.assign({}, result.meta);
                delete meta.lang;
                result = Object.assign({}, result, { meta: meta });
              }
              return result;
            },
          });
          applyPagefindLangFilter();
          resolve();
        })
        .catch(reject);
    });

    return window.__pagefindLoadPromise;
  }

  var searchWrap = qs('#search-form-wrap');
  var isSearchAnim = false;
  var searchAnimDuration = 200;

  if (searchWrap) {
    var startSearchAnim = function () {
      isSearchAnim = true;
    };

    var resetPageScrollX = function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      window.scrollTo(0, y);
    };

    var stopSearchAnim = function (callback) {
      setTimeout(function () {
        isSearchAnim = false;
        if (callback) callback();
      }, searchAnimDuration);
    };

    var clearSearchQuery = function () {
      var input =
        searchWrap.querySelector('.pagefind-ui__search-input') ||
        searchWrap.querySelector('input');
      if (!input || !input.value) return;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    var closeSearch = function () {
      startSearchAnim();
      searchWrap.classList.remove('on');
      searchWrap.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('search-overlay-on');
      clearSearchQuery();
      stopSearchAnim(resetPageScrollX);
    };

    var focusSearchInput = function () {
      var input =
        searchWrap.querySelector('.pagefind-ui__search-input') ||
        searchWrap.querySelector('input');
      if (input) input.focus();
    };

    var openSearch = function () {
      startSearchAnim();
      searchWrap.classList.add('on');
      searchWrap.setAttribute('aria-hidden', 'false');
      document.body.classList.add('search-overlay-on');
      stopSearchAnim(focusSearchInput);
    };

    var navSearch = qs('#nav-search-btn');
    on(navSearch, 'click', function (e) {
      if (isSearchAnim) return;
      e.preventDefault();
      e.stopPropagation();

      if (searchWrap.classList.contains('on')) {
        closeSearch();
        return;
      }

      loadPagefind()
        .then(function () {
          applyPagefindLangFilter();
          openSearch();
        })
        .catch(function () {
          openSearch();
        });
    });

    on(searchWrap, 'click', function (e) {
      if (e.target === searchWrap) closeSearch();
    });

    on(searchWrap, 'mousedown', function (e) {
      if (e.target.closest('a, button')) e.stopPropagation();
    });

    var panel = searchWrap.querySelector('.pagefind-search-panel');
    on(panel, 'click', function (e) {
      e.stopPropagation();
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && searchWrap.classList.contains('on')) closeSearch();
    });
  }

  // Share (event delegation)
  on(document.body, 'click', function (e) {
    if (e.target.closest('.article-share-link')) return;
    if (e.target.closest('.article-share-box')) return;
    qsa('.article-share-box.on').forEach(function (box) {
      box.classList.remove('on');
    });
  });

  on(document.body, 'click', function (e) {
    var link = e.target.closest('.article-share-link');
    if (!link) return;
    e.stopPropagation();

    var url = link.getAttribute('data-url');
    var encodedUrl = encodeURIComponent(url);
    var id = 'article-share-box-' + link.getAttribute('data-id');
    var box = document.getElementById(id);
    var rect = link.getBoundingClientRect();

    if (box) {
      if (box.classList.contains('on')) {
        box.classList.remove('on');
        return;
      }
    } else {
      box = document.createElement('div');
      box.id = id;
      box.className = 'article-share-box';
      box.innerHTML = [
        '<input class="article-share-input" value="">',
        '<div class="article-share-links">',
        '<a href="#" class="article-share-twitter" target="_blank" rel="noopener" title="Twitter"></a>',
        '<a href="#" class="article-share-facebook" target="_blank" rel="noopener" title="Facebook"></a>',
        '<a href="#" class="article-share-pinterest" target="_blank" rel="noopener" title="Pinterest"></a>',
        '</div>',
      ].join('');
      box.querySelector('.article-share-input').value = url;
      box.querySelector('.article-share-twitter').href =
        'https://twitter.com/intent/tweet?url=' + encodedUrl;
      box.querySelector('.article-share-facebook').href =
        'https://www.facebook.com/sharer.php?u=' + encodedUrl;
      box.querySelector('.article-share-pinterest').href =
        'http://pinterest.com/pin/create/button/?url=' + encodedUrl;
      document.body.appendChild(box);
    }

    qsa('.article-share-box.on').forEach(function (el) {
      if (el !== box) {
        el.classList.remove('on');
        el.style.display = 'none';
      }
    });

    box.style.top = rect.top + window.scrollY + 25 + 'px';
    box.style.left = rect.left + window.scrollX + 'px';
    box.style.display = '';
    box.classList.add('on');
  });

  on(document.body, 'click', function (e) {
    var input = e.target.closest('.article-share-input');
    if (input) input.select();
  });

  qsa('.article-entry').forEach(function (entry) {
    qsa('img', entry).forEach(function (img) {
      var alt = img.getAttribute('alt');
      var next = img.nextElementSibling;
      if (alt && !(next && next.classList && next.classList.contains('caption'))) {
        var cap = document.createElement('span');
        cap.className = 'caption';
        cap.textContent = alt;
        img.insertAdjacentElement('afterend', cap);
      }
    });
  });

  // Mobile nav
  var container = qs('#container');
  var isMobileNavAnim = false;
  var mobileNavAnimDuration = 200;
  var mainNavToggle = qs('#main-nav-toggle');
  var wrap = qs('#wrap');

  var startMobileNavAnim = function () {
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function () {
    setTimeout(function () {
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  };

  on(mainNavToggle, 'click', function () {
    if (isMobileNavAnim || !container) return;
    startMobileNavAnim();
    container.classList.toggle('mobile-nav-on');
    stopMobileNavAnim();
  });

  on(wrap, 'click', function () {
    if (isMobileNavAnim || !container || !container.classList.contains('mobile-nav-on')) return;
    container.classList.remove('mobile-nav-on');
  });
})();