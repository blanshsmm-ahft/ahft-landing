const SECTIONS = ['#catalog', '#where', '#join', '#values'];

export function initTabBar(): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-nav]'));

    const update = (): void => {
        const mid = window.innerHeight * 0.5;
        let current = '';
        let bestTop = -Infinity;

        for (const selector of SECTIONS) {
            const el = document.querySelector(selector);
            if (!el) continue;
            const top = el.getBoundingClientRect().top;
            if (top <= mid && top > bestTop) {
                bestTop = top;
                current = selector;
            }
        }

        items.forEach(item => {
            const active = item.dataset.nav === current;
            item.classList.toggle('is-active', active);
            if (active) {
                item.setAttribute('aria-current', 'true');
            } else {
                item.removeAttribute('aria-current');
            }
        });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
}