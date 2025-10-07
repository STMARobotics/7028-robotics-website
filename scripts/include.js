(() => {
  const INCLUDE_ATTRIBUTE = 'data-include';

  // Inject Google Analytics gtag.js into the document head so it is present
  // on every page without editing each HTML file. This runs early because
  // this script is loaded with `defer` in pages' <head>.
  const insertGtag = () => {
    try {
      if (window.__gtagInserted) return;
      window.__gtagInserted = true;

      const gtagSrc = 'https://www.googletagmanager.com/gtag/js?id=G-9NY2X085NP';

      const ext = document.createElement('script');
      ext.async = true;
      ext.src = gtagSrc;
      document.head.appendChild(ext);

      const inline = document.createElement('script');
      inline.text = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-9NY2X085NP');";
      document.head.appendChild(inline);
    } catch (e) {
      // Don't break the rest of the include flow if head is missing or append fails
      console.error('Failed to insert gtag', e);
    }
  };

  // Insert the gtag as early as possible (this file is deferred so this will run
  // after parsing but before DOMContentLoaded). This is safe to call multiple
  // times across pages because of the __gtagInserted guard.
  insertGtag();

  // Inject Google Fonts link once so individual pages don't need to include it.
  const insertGoogleFonts = () => {
    try {
      if (window.__googleFontsInserted) return;
      window.__googleFontsInserted = true;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap';
      document.head.appendChild(link);
    } catch (e) {
      console.error('Failed to insert Google Fonts', e);
    }
  };

  insertGoogleFonts();

  const loadInclude = async (placeholder) => {
    const path = placeholder.getAttribute(INCLUDE_ATTRIBUTE);

    if (!path) {
      return;
    }

    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Failed to load include: ${path} (${response.status})`);
      }

      const markup = await response.text();
      const template = document.createElement('template');
      template.innerHTML = markup.trim();

      const fragment = template.content.cloneNode(true);
      placeholder.replaceWith(fragment);
    } catch (error) {
      console.error(error);
    }
  };

  const notifyLoaded = () => {
    window.__includesLoaded = true;
    document.dispatchEvent(new CustomEvent('includesLoaded'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const placeholders = document.querySelectorAll(`[${INCLUDE_ATTRIBUTE}]`);
      if (!placeholders.length) {
        notifyLoaded();
        return;
      }

      Promise.all(Array.from(placeholders, loadInclude)).finally(notifyLoaded);
    });
    return;
  }

  const placeholders = document.querySelectorAll(`[${INCLUDE_ATTRIBUTE}]`);
  if (!placeholders.length) {
    notifyLoaded();
    return;
  }

  Promise.all(Array.from(placeholders, loadInclude)).finally(notifyLoaded);
})();
