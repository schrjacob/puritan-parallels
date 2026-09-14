(function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('work');
  const work = WORKS[slug];

  const sectionsEl = document.getElementById('sections');
  const contentsListEl = document.getElementById('contents-list');

  if (!work) {
    document.getElementById('work-title').textContent = 'Work not found';
    sectionsEl.innerHTML = '<p>No work matches "' + (slug || '') +
      '". <a href="index.html">Back to the library.</a></p>';
    document.getElementById('level-toggle').style.display = 'none';
    return;
  }

  // ---- header ----
  document.title = work.title + ' — Plain Style';
  document.getElementById('work-title').textContent = work.title;
  document.getElementById('work-subtitle').textContent = work.subtitle || '';
  document.getElementById('work-byline').textContent =
    work.author + ' · ' + work.date;
  document.getElementById('original-label').textContent = 'Original · ' + work.date;

  // ---- level state ----
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

  let currentLevel = getInitialLevel();

  function applyLevel(level) {
    currentLevel = level;
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

  // Finds the paragraph row currently sitting just under the sticky bar,
  // so we can keep it pinned in place when the modern text changes height.
  function getAnchorRow() {
    const bar = document.getElementById('sticky-bar');
    const barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
    const rows = document.querySelectorAll('.pair-row');
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getBoundingClientRect().bottom > barBottom) return rows[i];
    }
    return null;
  }

  // ---- render sections ----
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
  contentsListEl.innerHTML = contentsHtml.join('');

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  applyLevel(currentLevel);

  // ---- deep link on load ----
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: 'start' });
      });
    }
  }

  // ---- active section highlighting ----
  const links = Array.from(contentsListEl.querySelectorAll('a'));
  const sectionEls = Array.from(document.querySelectorAll('.section'));

  if ('IntersectionObserver' in window && sectionEls.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const link = contentsListEl.querySelector('a[data-target="' + entry.target.id + '"]');
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px' });

    sectionEls.forEach(function (el) { observer.observe(el); });
  }
})();
