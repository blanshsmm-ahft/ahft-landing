export function initAromaCatalog(): void {
    const catalog = document.querySelector<HTMLElement>('#catalog');
    if (!catalog) return;

    initMobilePopup(catalog);
}

const MOBILE_POPUP = '(max-width: 767px)';

function initMobilePopup(catalog: HTMLElement): void {
    const overlay = catalog.querySelector<HTMLElement>('.aroma-overlay');
    if (!overlay) return;

    const mq = window.matchMedia(MOBILE_POPUP);
    const nameEl = overlay.querySelector<HTMLElement>('.aroma-popup__name');
    const descEl = overlay.querySelector<HTMLElement>('.aroma-popup__desc');
    const dropEl = overlay.querySelector<HTMLElement>('.aroma-popup__drop');
    const closeBtn = overlay.querySelector<HTMLButtonElement>('.aroma-popup__close');

    const open = (li: HTMLElement): void => {
        const name = li.dataset.aroma ?? '';
        if (!name) return;

        if (nameEl) nameEl.textContent = name;
        if (descEl) descEl.textContent = li.querySelector('span.text-\\[0\\.85rem\\]')?.textContent?.trim() ?? '';
        if (dropEl) dropEl.textContent = li.querySelector('span.text-\\[0\\.7rem\\]')?.textContent?.trim() ?? '';

        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
    };

    const close = (): void => {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    catalog.addEventListener('click', (e) => {
        if (!mq.matches) return;
        const li = (e.target as HTMLElement).closest<HTMLElement>('li[data-aroma]');
        if (!li || li.classList.contains('is-hidden')) return;
        e.preventDefault();
        open(li);
    });

    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}