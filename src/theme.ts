const STORAGE_KEY = 'ahft-theme';
const mql: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function getStored(): string | null {
    return localStorage.getItem(STORAGE_KEY);
}

function getInitialDark(): boolean {
    const stored = getStored();
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return mql.matches;
}

function onSystemThemeChange(e: MediaQueryListEvent): void {
    if (!getStored()) applyTheme(e.matches);
}

export function initTheme() {
    applyTheme(getInitialDark());

    if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onSystemThemeChange);
    } else if (typeof mql.addListener === 'function') {
        mql.addListener(() => onSystemThemeChange({ matches: mql.matches } as MediaQueryListEvent));
    }

    const toggles = document.querySelectorAll('#theme-logo, #theme-logo-desktop');
    toggles.forEach((logo) => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
            applyTheme(isDark);
        });
    });
}