export function initMotion(): void {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const hideables = document.querySelectorAll<HTMLElement>('a[aria-label="AHFT — на главную"]');
    if (hideables.length && !prefersReduced) {
        let lastY = window.scrollY;
        let acc = 0;
        const setHidden = (hidden: boolean) => {
            hideables.forEach((el) => el.classList.toggle('is-hidden', hidden));
        };
        const onScroll = () => {
            const y = window.scrollY;
            const nearBottom = document.documentElement.scrollHeight - y - window.innerHeight < 160;
            if (y < 96 || nearBottom) {
                setHidden(false);
                acc = 0;
            } else {
                const delta = y - lastY;
                if (delta !== 0) {
                    acc += delta;
                    if (acc > 4) {
                        setHidden(true);
                        acc = 0;
                    } else if (acc < -4) {
                        setHidden(false);
                        acc = 0;
                    }
                }
            }
            lastY = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
}