import type { Region } from './types';

// Относительный путь — работает и на корне домена, и на GitHub Pages
// в подпапке (/repo/) при vite base './'.
const DATA_URL = 'regions.json';
const MOBILE_BREAKPOINT = 769;

export async function initMap(): Promise<void> {
    const svg = document.getElementById('ru-map');
    const tooltip = document.getElementById('map-tooltip');

    const mapWrap = document.getElementById('map-wrap');
    if (!svg || !mapWrap || !tooltip) return;

    // карточка региона удалена из вёрстки — работа карты не должна зависеть от неё
    const cardOkrug = document.getElementById('card-okrug');
    const cardName = document.getElementById('card-name');
    const cardCity = document.getElementById('card-city');
    const cardText = document.getElementById('card-text');
    const cardShops = document.getElementById('card-shops');
    const card = document.getElementById('region-card');
    const okrugSelect = document.querySelector<HTMLSelectElement>('#okrug-select');
    const regionSelect = document.querySelector<HTMLSelectElement>('#region-select');

    if (!okrugSelect || !regionSelect) return;

    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const regions: Region[] = await res.json();
        wireMap(svg, mapWrap, regions, tooltip, { cardOkrug, cardName, cardCity, cardText, cardShops, card }, okrugSelect, regionSelect);
    } catch {
        if (cardName) cardName.textContent = 'Не удалось загрузить карту';
        if (cardText) cardText.textContent = 'Проверьте соединение и обновите страницу — данные по регионам не загрузились.';
    }
}


interface RegionCardRefs {
    cardOkrug: HTMLElement | null;
    cardName: HTMLElement | null;
    cardCity: HTMLElement | null;
    cardText: HTMLElement | null;
    cardShops: HTMLElement | null;
    card: HTMLElement | null;
}

function wireMap(
    svg: HTMLElement,
    mapWrap: HTMLElement,
    regions: Region[],
    tooltip: HTMLElement,
    cardRefs: RegionCardRefs,
    okrugSelect: HTMLSelectElement,
    regionSelect: HTMLSelectElement,
): void {
    const { cardOkrug, cardName, cardCity, cardText, cardShops, card } = cardRefs;
    const byKey = new Map<string, Region>();
    regions.forEach(r => byKey.set(r.key, r));

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[id]'));

    // Выделение и содержимое тултипа — ПО ОКРУГУ, а не по региону:
    // подсвечиваются все регионы округа, тултип содержит все его города и
    // контакты (регионы внутри округа в подсветку не различаются).
    const pathsByOkrug = new Map<string, SVGPathElement[]>();
    for (const p of paths) {
        const okrug = byKey.get(p.id)?.okrug;
        if (!okrug) continue;
        const list = pathsByOkrug.get(okrug);
        if (list) list.push(p);
        else pathsByOkrug.set(okrug, [p]);
    }

    interface Contact {
        name: string;
        // Один продавец может иметь несколько площадок («Hookah Maket» — три
        // разных URL), поэтому URL'ы собираются в список, а не хранятся по одному.
        urls: string[];
        // Города ГРУППИРУЮТСЯ ПО ОКРУГУ. Контакт = ИМЯ + ССЫЛКА: один и тот же
        // продавец с разными площадками в разных регионах — это РАЗНЫЕ контакты,
        // поэтому каждый округ показывает только свою ссылку (Дистрибутор:
        // Сибирский — t.me/Sundukooov, Уральский — t.me/CamDark72; ДОКА/XB Store —
        // по ссылке на город; Nuahule Store: Иваново/Владимир — nua-store.ru,
        // Красноярск — nuahulestore24.orgs.biz). Контакты с ПУСТОЙ ссылкой
        // группируются по имени.
        citiesByOkrug: Map<string, string[]>;
    }

    // Контакт уникален по (имя + ссылка). Пустая ссылка группирует по имени.
    const contactsByKey = new Map<string, Contact>();
    const keyOf = (shop: { name: string; url?: string }) => `${shop.name}\u0000${shop.url ?? ''}`;
    for (const r of regions) {
        if (!r.sales) continue;
        for (const shop of r.shops ?? []) {
            const key = keyOf(shop);
            let contact = contactsByKey.get(key);
            if (!contact) {
                contact = { name: shop.name, urls: [], citiesByOkrug: new Map() };
                contactsByKey.set(key, contact);
            }
            if (shop.url && !contact.urls.includes(shop.url)) contact.urls.push(shop.url);
            const cities = contact.citiesByOkrug.get(r.okrug);
            if (!cities) {
                contact.citiesByOkrug.set(r.okrug, [...(r.cities ?? [])]);
            } else {
                for (const c of r.cities ?? []) {
                    if (!cities.includes(c)) cities.push(c);
                }
            }
        }
    }

    const okrugInfo = new Map<string, Contact[]>();
    for (const contact of contactsByKey.values()) {
        for (const okrug of contact.citiesByOkrug.keys()) {
            const list = okrugInfo.get(okrug);
            if (list) list.push(contact);
            else okrugInfo.set(okrug, [contact]);
        }
    }


    regionSelect.addEventListener('change', () => {
        selectRegion(regionSelect.value || null);
    });

    okrugSelect.addEventListener('change', () => {
        filterOkrugs();
    });

    let hoveredOkrug: string | null = null;
    let highlightedOkrug: string | null = null;
    let onTooltip = false;
    let approaching = false;
    let frozen = false;
    let lastGap = Infinity;
    let settleTimer: number | undefined;
    let hideTimer: number | undefined;
    let hoverTimer: number | undefined;

    const HOVER_DELAY = 140;
    const SETTLE_DELAY = 400;

    // Управляется ТОЛЬКО наведением: клика по карте нет.
    for (const p of paths) {
        p.classList.add('map-region');
        const okrug = byKey.get(p.id)?.okrug;
        if (!okrug) continue;

        p.addEventListener('mouseenter', e => {
            highlightOkrug(okrug, true);
            window.clearTimeout(hoverTimer);
            // Пока тултип заморожен, другой округ можно перехватить только
            // если курсор на нём ЗАДЕРЖАЛСЯ (SETTLE_DELAY), а не просто прошёл
            // мимо по пути к ссылке.
            const delay = frozen ? SETTLE_DELAY : HOVER_DELAY;
            hoverTimer = window.setTimeout(() => {
                hoveredOkrug = okrug;
                showTooltip(okrug, e);
                // Курсор замер — перестаём вести тултип за курсором, иначе он
                // «убегает» и ссылку невозможно навести (цель всё время уезжает).
                window.clearTimeout(settleTimer);
                settleTimer = window.setTimeout(() => {
                    if (!onTooltip) frozen = true;
                }, SETTLE_DELAY);
            }, delay);
        });
        // Тултип идёт за курсором, пока указатель не зашёл на сам тултип
        p.addEventListener('mousemove', e => {
            if (tooltip.hidden || onTooltip) return;
            approaching = movingToTooltip(e);
            if (!frozen) followCursor(e);
        });
        p.addEventListener('mouseleave', () => {
            // Подсветка снимается ВСЕГДА — это главный баг: при уходе с
            // замороженного региона выделение оставалось.
            highlightOkrug(okrug, false);
            window.clearTimeout(hoverTimer);
            if (hoveredOkrug === okrug) hoveredOkrug = null;
            // ТулTIP заморожен / курсор идёт к ссылке / курсор на тултипе —
            // не прячем, иначе ссылка недостижима.
            if (frozen || approaching || onTooltip) return;
            scheduleHideTooltip();
        });
    }

    function showTooltip(okrug: string, e: MouseEvent): void {
        window.clearTimeout(hideTimer);
        renderTooltip(okrug);
        tooltip.hidden = false;
        followCursor(e);
    }

    function scheduleHideTooltip(): void {
        frozen = false;
        window.clearTimeout(settleTimer);
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            if (hoveredOkrug || onTooltip) return;
            tooltip.hidden = true;
        }, 200);
    }

    // Тултип лежит ВНУТРИ #map-wrap: уход курсора с карты прячет его,
    // иначе замороженный тултип «залипает» после mouseleave региона.
    mapWrap.addEventListener('mouseleave', () => {
        if (onTooltip) return;
        lastGap = Infinity;
        approaching = false;
        scheduleHideTooltip();
    });

    // вся карточка интерактивна: курсор может свободно ходить по ней
    tooltip.addEventListener('mouseover', () => {
        onTooltip = true;
        approaching = false;
        frozen = true;
        window.clearTimeout(hideTimer);
        window.clearTimeout(hoverTimer);
    });
    tooltip.addEventListener('mouseout', () => {
        onTooltip = false;
        frozen = false;
        lastGap = Infinity;
        scheduleHideTooltip();
    });

    // Подсветка строго по округу. При уходе с одного округа снимается
    // предыдущий округ целиком — иначе на карте остаётся «призрак» выделения.
    function highlightOkrug(okrug: string, on: boolean): void {
        if (on) {
            if (highlightedOkrug && highlightedOkrug !== okrug) {
                highlightOkrug(highlightedOkrug, false);
            }
            highlightedOkrug = okrug;
        } else if (highlightedOkrug === okrug) {
            highlightedOkrug = null;
        }
        pathsByOkrug.get(okrug)?.forEach(p => p.classList.toggle('is-hover', on));
    }

    function tooltipLine(cls: string, text: string): HTMLElement {
        const el = document.createElement('span');
        el.className = cls;
        el.textContent = text;
        return el;
    }

    // Тултип про ОКРУГ, продавцы сгруппированы ПО ГОРОДУ: если в одном городе
    // несколько продавцов («Москва» — OSHISHA и Big Smoke), их имена выводятся
    // через запятую в одной строке, ниже — город (по просьбе «пиши продавцов
    // через запятую если представлены в одном городе»).
    function renderTooltip(okrug: string): void {
        tooltip.replaceChildren();

        tooltip.appendChild(tooltipLine('map-tooltip__okrug', `${okrug} федеральный округ`));

        const byCity = new Map<string, Contact[]>();
        const contactsInOkrug = okrugInfo.get(okrug) ?? [];
        const sellerNames = [...new Set(contactsInOkrug.map((c) => c.name))];
        for (const contact of contactsInOkrug) {
            for (const city of contact.citiesByOkrug.get(okrug) ?? []) {
                const list = byCity.get(city);
                if (list) list.push(contact);
                else byCity.set(city, [contact]);
            }
        }

        // Один продавец в нескольких городах — имя выводится ОДИН раз, ниже
        // города через запятую («Поставь Угли» → Новосибирск, Томск, …).
        // Если город общий для нескольких продавцов — продавцы через запятую
        // в одной строке, ниже город («Москва» → OSHISHA, Big Smoke).
        const singleByName = new Map<string, Array<{ city: string; url: string }>>();
        const shared = new Map<string, Contact[]>();
        for (const [city, list] of byCity) {
            if (list.length === 1) {
                const c = list[0];
                const url = c.urls[0] ?? '';
                const arr = singleByName.get(c.name);
                if (arr) arr.push({ city, url });
                else singleByName.set(c.name, [{ city, url }]);
            } else {
                shared.set(city, list);
            }
        }

        for (const name of sellerNames) {
            const contacts = contactsInOkrug.filter(c => c.name === name);
            const cityUrls = new Map<string, string[]>();
            for (const c of contacts) {
                const cities = c.citiesByOkrug.get(okrug) ?? [];
                for (const city of cities) {
                    const arr = cityUrls.get(city);
                    if (arr) {
                        for (const u of c.urls) if (u && !arr.includes(u)) arr.push(u);
                    } else {
                        cityUrls.set(city, [...c.urls.filter(Boolean)]);
                    }
                }
            }

            const citiesList = [...cityUrls.keys()].sort((a,b)=>a.localeCompare(b,'ru'));
            const distinctUrls = new Set<string>();
            for (const urls of cityUrls.values()) for (const u of urls) if (u) distinctUrls.add(u);

            tooltip.appendChild(tooltipLine('map-tooltip__shop', name));
            const urlSet = new Set<string>();
            for (const urls of cityUrls.values()) for (const u of urls) if (u) urlSet.add(u);
            if (urlSet.size === 1 && citiesList.length > 1) {
                const u = [...urlSet][0];
                const citiesText = citiesList.join(', ');
                const row = document.createElement('div');
                row.className = 'map-tooltip__sellers';
                row.appendChild(tooltipLink(u, citiesText, 'map-tooltip__link'));
                tooltip.appendChild(row);
                continue;
            } else {
                for (const city of citiesList) {
                    const urls = cityUrls.get(city) ?? [];
                    if (urls.length === 0) {
                        const row = document.createElement('div');
                        row.className = 'map-tooltip__sellers';
                        row.appendChild(tooltipLine('map-tooltip__city', city));
                        tooltip.appendChild(row);
                        continue;
                    }
                    for (const u of urls) {
                        const r=document.createElement('div');
                        r.className='map-tooltip__sellers';
                        r.appendChild(tooltipLink(u, city, 'map-tooltip__link'));
                        tooltip.appendChild(r);
                    }
                }
            }
        }
    }

    function tooltipLink(url: string, text: string, cls: string): HTMLAnchorElement {
        const a = document.createElement('a');
        a.className = cls;
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = text;
        return a;
    }

    // Площадка контакта в читаемом виде: `vk.com/hookahmarketsamara`.
    function updateColors(): void {
        const okrugActive = okrugSelect.value;
        paths.forEach(p => {
            const r = byKey.get(p.id);
            if (!r) return;
            const dim = Boolean(okrugActive) && r.okrug !== okrugActive;
            p.classList.toggle('is-dim', dim);
        });
    }

// Следование за курсором со смещением от указателя. У правого/нижнего края
// карты смещение переворачивается на другую сторону, чтобы тултип не вылезал
// за пределы #map-wrap.
// Курсор приближается к тултипу? Он следует за курсором с зазором `gap`,
    // поэтому «рядом» тултип почти всегда — важно направление: расстояние
    // УМЕНЬШАЕТСЯ. Иначе переход к ссылке через соседний регион переключал
    // содержимое и ссылка уезжала из-под курсора.
    function movingToTooltip(e: MouseEvent): boolean {
        if (tooltip.hidden) { lastGap = Infinity; return false; }
        const t = tooltip.getBoundingClientRect();
        const gapX = Math.max(t.left - e.clientX, 0, e.clientX - t.right);
        const gapY = Math.max(t.top - e.clientY, 0, e.clientY - t.bottom);
        const gap = Math.hypot(gapX, gapY);
        const was = approaching;
        approaching = gap < 90 && gap <= lastGap;
        lastGap = gap;
        return was && approaching;
    }

    function followCursor(e: MouseEvent): void {
    if (window.innerWidth < MOBILE_BREAKPOINT) return;
    const wrap = mapWrap.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    const gap = 14;
    const x = e.clientX - wrap.left;
    const y = e.clientY - wrap.top;
    let left = x + gap;
    let top = y + gap;
    if (left + tip.width > wrap.width) left = x - tip.width - gap;
    if (top + tip.height > wrap.height) top = y - tip.height - gap;
    // У краёв карты вариант «наружу» всё равно не влезает — прижимаем
    // тултип к границе, иначе он вылезает за #map-wrap.
    left = Math.min(Math.max(left, 0), Math.max(0, wrap.width - tip.width));
    top = Math.min(Math.max(top, 0), Math.max(0, wrap.height - tip.height));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.transform = 'none';
}

    function resetCard(): void {
        if (cardOkrug) cardOkrug.textContent = '';
        if (cardName) cardName.textContent = 'Выберите регион';
        if (cardCity) cardCity.textContent = '';
        if (cardText) cardText.textContent = '';
        if (cardShops) cardShops.innerHTML = '';
        card?.classList.add('hidden');
    }

    // Выбор региона из селекта (мобильный). Клика по карте нет, поэтому
    // выделение на карте не меняется — селект только фильтрует is-dim.
    function selectRegion(key: string | null): void {
        const r = key ? byKey.get(key) : undefined;
        // Подсветка живёт только на карте (is-hover от наведения), поэтому
        // смена региона в селекте её не трогает — только is-dim от фильтра.

        if (!key || !r) {
            resetCard();
            return;
        }

        card?.classList.remove('hidden');
        if (cardOkrug) cardOkrug.textContent = r.okrug;
        if (cardName) cardName.textContent = r.name;
        if (cardCity) cardCity.textContent = r.cities?.join(', ') ?? '';
        const shops = r.shops ?? [];
        const hasNoLink = shops.some(s => !s.url);
        if (cardText) {
            cardText.textContent = hasNoLink
                ? 'В регионе действуют официальные дистрибьюторы. Напишите нам — подскажем ближайшую точку продажи.'
                : 'В регионе действуют официальные дистрибьюторы. Напишите продавцу — подскажут ближайшую точку продаж.';
        }
        if (!cardShops) return;
        cardShops.innerHTML = '';
        for (const shop of shops) {
            if (!shop.url) {
                const span = document.createElement('span');
                span.className = 'block text-[0.9rem] font-medium text-ink';
                span.textContent = shop.name;
                cardShops.appendChild(span);
                const btn = document.createElement('a');
                btn.className = 'btn btn--shop';
                btn.href = '#values';
                btn.textContent = 'Напишите нам';
                cardShops.appendChild(btn);
                continue;
            }
            const el = document.createElement('a');
            el.className = 'btn btn--shop';
            el.href = shop.url;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
            el.textContent = shop.name;
            cardShops.appendChild(el);
        }
    }

    function filterOkrugs(): void {
        const okrugActive = okrugSelect.value;
        regionSelect.innerHTML = '<option value="">Выберите регион</option>';

        const options = regions
            .filter(r => r.sales)
            .filter(r => !okrugActive || r.okrug === okrugActive)
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
            .map(r => `<option value="${r.key}">${r.name}</option>`);
        regionSelect.insertAdjacentHTML('beforeend', options.join(''));

        // Мобильный селект «округ» сужает список регионов; выделение на карте
        // не трогаем — его рисует только наведение.
        updateColors();
    }

    const okrugs = [...new Set(regions.filter(r => r.sales).map(r => r.okrug))].sort((a, b) => a.localeCompare(b, 'ru'));
    okrugSelect.innerHTML = '<option value="">Все округа</option>';
    okrugs.forEach(o => {
        okrugSelect.insertAdjacentHTML('beforeend', `<option value="${o}">${o} федеральный округ</option>`);
    });

    filterOkrugs();
}