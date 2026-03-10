'use client'

/**
 * Elimina atributos data-cursor-ref inyectados por extensiones (Chrome DevTools MCP, cursor-ide-browser)
 * antes de que React hidrate, evitando errores de hydration mismatch.
 */
export function HydrationFix() {
    return (
        <script
            id="hydration-fix-cursor-ref"
            dangerouslySetInnerHTML={{
                __html: `
(function() {
  var attr = 'data-cursor-ref';
  function removeAll() {
    try {
      document.querySelectorAll('[' + attr + ']').forEach(function(el) {
        el.removeAttribute(attr);
      });
    } catch (e) {}
  }
  removeAll();
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type === 'attributes' && m.attributeName === attr && m.target.removeAttribute) {
        m.target.removeAttribute(attr);
      }
    });
    removeAll();
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [attr],
      subtree: true
    });
  }
  var i = 0;
  var interval = setInterval(function() {
    removeAll();
    if (++i >= 20) clearInterval(interval);
  }, 10);
})();
                `.trim(),
            }}
        />
    )
}
