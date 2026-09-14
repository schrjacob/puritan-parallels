(function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('work');

  const sectionsEl = document.getElementById('sections');
  const contentsListEl = document.getElementById('contents-list');
  const drawerListEl = document.getElementById('toc-drawer-list');

  if (!slug) {
    showNotFound('No work was specified.');
    return;
  }

  loadWorkData(slug, renderWork, function () {
    showNotFound('No work matches "' + slug + '".');
  });

  // ---- on-demand loading of this work's data file ----

  function loadWorkData(slug, onSuccess, onError) {
    const script = document.createElement('script');
    script.src = 'js/data/' + encodeURIComponent(slug) + '.js';
    script.onload = function () {
      // WORK_DATA is defined by the file we just loaded
      if (typeof WORK_DATA === 'undefined') { onError(); return; }
      onSuccess(WORK_DATA);
    };
    script.onerror = onError;
    document.head.appendChild(script);
  }

  function showNotFound(message) {
    document.getElementById('work-title').textContent = 'Work not found';
    sectionsEl.innerHTML = '<p>' + message + ' <a href="index.html">Back to the library.</a></p>';
    document.getElementById('sticky-bar').style.display = 'none';
    document.getElementById('contents').style.display = 'none';
    document.getElementById('toc-toggle').style.display = 'none';
  }

  // ---- render everything once the work's data has loaded ----

  function renderWork(work) {
    document.title = work.title + ' — Plain Style';
    document.getElementById('work-title').textContent = work.title;
    document.getElementById('work-subtitle').textContent = work.subtitle || '';
    document.getElementById('work-byline').textContent = work.author + ' · ' + work.date;
    document.getElementById('original-label').textContent = 'Original · ' + work.date;

    renderSections(work);
    setupLevelToggle();
    setupTocDrawer();
    setupActiveSectionHighlighting();
    jumpToHash();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderSections(work) {
    const sectionsHtml = [];
    const contentsHtml = [];

    work.sections.forEach(function (section) {
      const numLabel = section.number
        ? '<span class="num">' + section.number + '</span>'
        : '';
      contentsHtml.push(
        '<li><a href="#' + section.id + '" data-target="' + section.id + '">' +
          numLabel + section.title +
        '</a></li>'
      );

      const pairRows = section.paragraphs.map(function (p) {
        return (
          '<div class="pair-row">' +
            '<div class="original"><p>' + escapeHtml(p.original) + '</p></div>' +
            '<div class="modern"><p>' +
              '<span data-level="light">' + escapeHtml(p.light) + '</span>' +
              '<span data-level="heavy">' + escapeHtml(p.heavy) + '</span>' +
            '</p></div>' +
          '</div>'
        );
      }).join('');

      sectionsHtml.push(
        '<section class="section" id="' + section.id + '">' +
          '<div class="section__head">' +
            (section.number ? '<span class="section__number">' + section.number + '</span>' : '') +
            '<span class="section__title">' + section.title + '</span>' +
          '</div>' +
          '<div class="pair">' + pairRows + '</div>' +
        '</section>'
      );
    });

    if (work.signature) {
      sectionsHtml.push('<p class="signature">' + escapeHtml(work.signature) + '</p>');
    }

    sectionsHtml.push(
      '<p class="source-note">Original text: ' +
        '<a href="' + work.sourceUrl + '" target="_blank" rel="noopener">' + work.sourceNote + '</a>' +
        '. Modernized text is an editorial rendering for this site.</p>'
    );

    sectionsEl.innerHTML = sectionsHtml.join('');
    // The sidebar and the drawer both show the same contents list.
    contentsListEl.innerHTML = contentsHtml.join('');
    drawerListEl.innerHTML = contentsHtml.join('');
  }

  // ---- level toggle (light/heavy), with scroll position preserved ----

  const LEVEL_NOTES = {
    light: 'Light: close to the original\u2019s wording and sentence structure, with archaic terms updated.',
    heavy: 'Heavy: freely rephrased in plain, contemporary English.'
  };

  function getInitialLevel() {
    const fromUrl = params.get('level');
    if (fromUrl === 'light' || fromUrl === 'heavy') return fromUrl;
    const stored = window.localStorage ? localStorage.getItem('plainstyle-level') : null;
    if (stored === 'light' || stored === 'heavy') return stored;
    return 'light';
  }

  function applyLevel(level) {
    document.querySelectorAll('.level-toggle button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.level === level ? 'true' : 'false');
    });
    document.querySelectorAll('.modern [data-level]').forEach(function (el) {
      el.classList.toggle('is-visible', el.dataset.level === level);
    });
    document.getElementById('level-note').textContent = LEVEL_NOTES[level];

    try { localStorage.setItem('plainstyle-level', level); } catch (e) {}

    const url = new URL(window.location.href);
    url.searchParams.set('level', level);
    history.replaceState(null, '', url);
  }

  function getAnchorRow() {
    const bar = document.getElementById('sticky-bar');
    const barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
    const rows = document.querySelectorAll('.pair-row');
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getBoundingClientRect().bottom > barBottom) return rows[i];
    }
    return null;
  }

  function setupLevelToggle() {
    applyLevel(getInitialLevel());

    document.getElementById('level-toggle').addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-level]');
      if (!btn) return;

      const anchor = getAnchorRow();
      const before = anchor ? anchor.getBoundingClientRect().top : null;

      applyLevel(btn.dataset.level);

      if (anchor) {
        const after = anchor.getBoundingClientRect().top;
        if (after !== before) window.scrollBy(0, after - before);
      }
    });
  }

  // ---- hamburger / table-of-contents drawer ----

  function setupTocDrawer() {
    const toggle = document.getElementById('toc-toggle');
    const drawer = document.getElementById('toc-drawer');
    const backdrop = document.getElementById('toc-drawer-backdrop');
    const closeBtn = document.getElementById('toc-drawer-close');

    function open() {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? close() : open();
    });
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
    // Jumping to a section closes the drawer behind it.
    drawerListEl.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
  }

  // ---- deep link on load ----

  function jumpToHash() {
    if (!window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: 'start' });
      });
    }
  }

  // ---- active-section highlighting (both sidebar and drawer lists) ----

  function setupActiveSectionHighlighting() {
    const sectionEls = Array.from(document.querySelectorAll('.section'));
    if (!('IntersectionObserver' in window) || !sectionEls.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const links = document.querySelectorAll('a[data-target="' + entry.target.id + '"]');
        if (!links.length) return;
        document.querySelectorAll('.contents a').forEach(function (l) { l.classList.remove('is-active'); });
        links.forEach(function (l) { l.classList.add('is-active'); });
      });
    }, { rootMargin: '-15% 0px -70% 0px' });

    sectionEls.forEach(function (el) { observer.observe(el); });
  }
})();
