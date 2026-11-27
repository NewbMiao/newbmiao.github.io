(function () {
  'use strict';

  var loading = null;

  function hasMermaidNodes() {
    return !!document.querySelector('pre.mermaid, .mermaid:not([data-mermaid-deferred])');
  }

  function boot() {
    if (!window.mermaid || !window.__MERMAID_BOOT__) return Promise.resolve();

    var options = Object.assign({}, window.__MERMAID_BOOT__.options || {});
    options.startOnLoad = false;
    window.mermaid.initialize(options);

    return window.mermaid.run({
      querySelector: '.mermaid:not([data-mermaid-deferred])'
    });
  }

  window.ensureMermaid = function () {
    if (!window.__MERMAID_BOOT__ || !hasMermaidNodes()) {
      return Promise.resolve();
    }
    if (window.mermaid) {
      boot();
      return Promise.resolve();
    }
    if (loading) return loading;

    loading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = window.__MERMAID_BOOT__.src;
      script.onload = function () {
        Promise.resolve(boot()).then(resolve, reject);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
    return loading;
  };

  function onReady() {
    window.ensureMermaid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();