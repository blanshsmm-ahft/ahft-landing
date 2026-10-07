const STEP = 79;
const COLS = 4;
const FRAMES = 222;

export function initCatalogSpin(): void {
    const el = document.querySelector<HTMLElement>('.catalog-spin');
    if (!el) return;

    let ticking = false;

    const render = (): void => {
        ticking = false;

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        const frame = Math.round(progress * (FRAMES - 1));

        const i = Math.min(frame, FRAMES - 1);
        const col = i % COLS;
        const row = (i - col) / COLS;
        el.style.backgroundPosition = `${(-col * STEP).toString()}px ${(-row * STEP).toString()}px`;
    };

    const request = (): void => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(render);
        }
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    request();
}