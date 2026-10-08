export function initMotion(): void {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const hideables = document.querySelectorAll<HTMLElement>('a[aria-label="AHFT — на главную"]');
    if (hideables.length && !prefersReduced) {
        const HIDE_AFTER = 25;
        const setHidden = (hidden: boolean) => {
            hideables.forEach((el) => el.classList.toggle('is-hidden', hidden));
        };
        const onScroll = () => {
            // Показываем только в самом начале страницы. При скролле вниз
            // прячем после 20–30px; при скролле вверх НЕ показываем,
            // пока не вернёмся на самый top.
            setHidden(window.scrollY >= HIDE_AFTER);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
}
