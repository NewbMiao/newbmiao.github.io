(function () {
  'use strict';

  var loading = null;

  function hasMermaidNodes() {
    return !!document.querySelector('pre.mermaid, .mermaid:not([data-mermaid-deferred])');
  }

  function boot() {
    if (!window.mermaid || !window.__MERMAID_BOOT__) return;
    window.mermaid.initialize(window.__MERMAID_BOOT__.options || { startOnLoad: true });
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
        boot();
        resolve();
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