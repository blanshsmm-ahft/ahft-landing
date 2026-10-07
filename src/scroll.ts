export function initCatalogScroll(): void {
    const els = document.querySelectorAll<HTMLElement>('#catalog .overflow-x-auto');
    if (!els.length) return;

    els.forEach(el => {
        el.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                const { scrollLeft, scrollWidth, clientWidth } = el;
                const atStart = scrollLeft <= 0 && e.deltaY < 0;
                const atEnd = scrollLeft + clientWidth >= scrollWidth - 1 && e.deltaY > 0;
                if (!atStart && !atEnd) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                }
            }
        }, { passive: false });
    });
}

export function initScrollHint(): void {
    const hints = document.querySelectorAll<HTMLElement>('.scroll-hint');
    if (!hints.length) return;

    if (!('IntersectionObserver' in window)) {
        hints.forEach((h) => h.classList.add('is-nudging'));
        return;
    }

    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const el = entry.target as HTMLElement;
                if (!el.classList.contains('is-nudging')) {
                    el.classList.add('is-nudging');
                }
            }
        },
        { threshold: 0.4 }
    );

    hints.forEach((h) => {
        h.addEventListener('animationend', () => h.classList.remove('is-nudging'));
        io.observe(h);
    });
}