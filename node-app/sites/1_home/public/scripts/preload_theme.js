(function() {
    const key = 'pref-theme';
    const stored = localStorage.getItem(key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = stored ? (stored === 'dark') : prefersDark;
    const root = document.documentElement;
    root.classList.toggle('dark', useDark);
    root.classList.toggle('tw-dark', useDark);
})();