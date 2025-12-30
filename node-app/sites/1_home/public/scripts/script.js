const root = document.documentElement;
const key = 'pref-theme';
const btn = document.getElementById('themeToggle');

function applyTheme(mode) {
if (mode === 'system') {
    localStorage.setItem(key, 'system');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('tw-dark', prefersDark);
} else {
    localStorage.setItem(key, mode);
    const isDark = mode === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('tw-dark', isDark);
}
}

// init
const saved = localStorage.getItem(key);
if (saved === 'dark' || saved === 'light') {
applyTheme(saved);
} else {
applyTheme('system');
}

// watch system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
if (localStorage.getItem(key) === 'system') {
    applyTheme('system');
}
});

// click handling
if (btn) {
btn.onclick = (e) => {
    if (e.altKey) {
    applyTheme('system');
    } else {
    const isDark = root.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
    }
};
}

// year
document.getElementById('year').textContent = new Date().getFullYear();