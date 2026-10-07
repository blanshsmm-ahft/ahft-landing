const sections = ['#catalog', '#where', '#partner', '#contact'];
const tabItems = [...document.querySelectorAll('.tabbar__item, .tabbar__cta')];

const setActiveTab = () => {
    const mid = window.innerHeight * 0.5;
    let current = '';
    let bestTop = -Infinity;
    for (const sel of sections) {
        const el = document.querySelector(sel);
        if (el) {
            const top = el.getBoundingClientRect().top;
            if (top <= mid && top > bestTop) {
                bestTop = top;
                current = sel;
            }
        }
    }
    tabItems.forEach(item => {
        item.classList.toggle('is-active', item.dataset.nav ? item.dataset.nav === current : false);
    });
};

setActiveTab();
window.addEventListener('scroll', setActiveTab, { passive: true });

const form = document.querySelector('.contact-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
    form.reset();
});

const mapWrap = document.querySelector('.map-wrap');

fetch('assets/regions.json')
    .then(res => res.json())
    .then(regions => initMap(regions))
    .catch(() => console.error('Не удалось загрузить regions.json'));

function initMap(regions) {
    const byKey = {};
    regions.forEach(r => byKey[r.key] = r);

    const paths = [...document.querySelectorAll('#where svg path')];
    const tooltip = document.querySelector('.map-tooltip');
    const okrugSelect = document.getElementById('okrug-select');
    const regionSelect = document.getElementById('region-select');
    const cardOkrug = document.getElementById('card-okrug');
    const cardName = document.getElementById('card-name');
    const cardText = document.getElementById('card-text');
    const card = document.getElementById('region-card');
    let activeKey = null;

    regionSelect.addEventListener('change', () => {
        selectRegion(regionSelect.value || null, true);
    });

    okrugSelect.addEventListener('change', () => {
        filterOkrugs();
    });

    paths.forEach(p => {
        p.classList.add('map-region');
        p.addEventListener('mouseenter', (e) => {
            if (p.getAttribute('data-name')) {
                highlight(p, true);
                tooltip.textContent = p.getAttribute('data-name');
                tooltip.hidden = false;
                positionTooltip(e, p);
            }
        });
        p.addEventListener('mousemove', (e) => {
            if (!tooltip.hidden) positionTooltip(e, p);
        });
        p.addEventListener('mouseleave', () => {
            highlight(p, false);
            tooltip.hidden = true;
        });
        p.addEventListener('click', () => {
            selectRegion(p.id, false);
            tooltip.hidden = true;
        });
    });

    function highlight(p, on) {
        p.classList.toggle('is-hover', on);
    }

    function updateColors() {
        const okrugActive = okrugSelect.value;
        paths.forEach(p => {
            const r = byKey[p.id];
            if (!r) return;
            if (okrugActive && r.okrug !== okrugActive) {
                p.classList.add('is-dim');
                p.style.fill = '#f4f4f0';
            } else {
                p.style.fill = '#e9e9e4';
                p.classList.remove('is-dim');
            }
        });
    }

    function positionTooltip(e, p) {
        if (window.innerWidth < 769) return;
        const rect = mapWrap.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        tooltip.style.left = cx + 'px';
        tooltip.style.top = cy + 'px';
        tooltip.style.transform = 'translate(14px, 14px)';
    }

    function selectRegion(key, fromList) {
        if (activeKey) {
            const old = document.getElementById(activeKey);
            if (old) old.classList.remove('is-active', 'is-hover');
        }
        activeKey = key;
        if (!key) {
            cardOkrug.textContent = '';
            cardName.textContent = 'Выберите регион';
            cardText.textContent = 'Наведите курсор на карту или выберите регион в списке — покажем, где приобрести Blansh\u00A0и\u00A0Nuar. Напишите продавцу — подскажут ближайшую точку продаж.';
            return;
        }
        const r = byKey[key];
        const path = document.getElementById(key);
        if (path) {
            path.classList.add('is-active');
            path.parentNode.appendChild(path);
        }
        cardOkrug.textContent = r.okrug;
        cardName.textContent = r.name;
        cardText.innerHTML = 'В регионе действуют официальные дистрибьюторы. Уточните наличие Blansh\u00A0и\u00A0Nuar, написав продавцу, — подскажут ближайшую точку продаж.';

    }

    function filterOkrugs() {
        const okrugActive = okrugSelect.value;
        regionSelect.innerHTML = '<option value="">Выберите регион</option>';
        const opts = regions
            .filter(r => !okrugActive || r.okrug === okrugActive)
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
            .map(r => `<option value="${r.key}">${r.name}</option>`);
        regionSelect.innerHTML += opts.join('');
        if (activeKey && !regions.find(r => r.key === activeKey && (!okrugActive || r.okrug === okrugActive))) {
            selectRegion(null);
        }
        updateColors();
    }

    const okrugsList = [...new Set(regions.map(r => r.okrug))].sort((a, b) => a.localeCompare(b, 'ru'));
    okrugsList.forEach(o => {
        okrugSelect.innerHTML += `<option value="${o}">${o} федеральный округ</option>`;
    });

    filterOkrugs();
}
