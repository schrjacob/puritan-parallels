(function () {
  function current() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function label(theme) {
    return theme === 'dark' ? 'Light mode' : 'Dark mode';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.textContent = label(theme);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    apply(current());
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const next = current() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('plainstyle-theme', next); } catch (e) {}
        apply(next);
      });
    });
  });
})();
