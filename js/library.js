(function () {
  const listEl = document.getElementById('work-list');
  const slugs = Object.keys(MANIFEST);

  if (slugs.length === 0) {
    listEl.innerHTML = '<p class="library__empty">No works added yet.</p>';
    return;
  }

  listEl.innerHTML = slugs.map(function (slug) {
    const work = MANIFEST[slug];
    return (
      '<a class="work-card" href="reader.html?work=' + encodeURIComponent(slug) + '">' +
        '<div>' +
          '<div class="work-card__title">' + work.title + '</div>' +
          '<div class="work-card__subtitle">' + work.subtitle + '</div>' +
          '<div class="work-card__meta">' + work.author + '</div>' +
        '</div>' +
        '<div class="work-card__date">' + work.date + '</div>' +
      '</a>'
    );
  }).join('');
})();
