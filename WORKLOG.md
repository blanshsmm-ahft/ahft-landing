# AHFT Landing — рабочая история и контекст

> Хранит состояние всей проделанной работы, развёртывания и открытые задачи.
> Технические правила вёрстки — `AGENTS.md`, дизайн-спек — `design.md`.
> Обновлять в конце каждого крупного изменения/сессии.

## Проект

- Путь: `/Users/dmitriygaynetdinov/Downloads/opencode_context/hookah-tobacco-landing`
- Стек: **Vite + Tailwind v4 + TypeScript** (Vanilla). Стили — токены в `src/style.css`
  (собирается через `main.ts`), разметка — `index.html` (один файл).
- Сборка: `npm run build` (= `tsc --noEmit && vite build`).
- Локальный preview: `lsof -ti:4173 | xargs kill -9; sleep 1; nohup npm run preview -- --host --port 4173 --strictPort > /tmp/ahft-preview4173.log 2>&1 &`
- Единый контейнер секций: `mx-auto max-w-[1100px] px-5`; секции `py-12 md:py-20`;
  Hero — единственное исключение (`flex items-start pt-28`).
- Система отступов — только шкала: `4=16, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80`.
- Vite инлайнит маленькие SVG в data-URI — селекторы по `src="/assets/..."` на dist
  не работают, проверять по классам. Playwright-скрипты в `/tmp/pw/...` (node_modules уже там).

## Структура исходников (src/)

| Файл | Назначение |
|---|---|
| `main.ts` | импорт стилей + инициализация модулей |
| `style.css` | токены теме, типографика, классы |
| `theme.ts` | тёмная/светлая тема (localStorage `ahft-theme`) |
| `aromas.ts` | список ароматов + попап-LI для каталога |
| `map.ts` | интерактивная карта (регионы из `public/regions.json`) |
| `contactForm.ts` | сабмит формы (#join) |
| `motion.ts` | prefers-reduced-motion / скрытия |
| `scroll.ts`, `tabBar.ts`, `typography.ts` | скролл-хелперы, моб. таб-плашка |

## Что сделано (дорожная карта работ)

### База и структура
- Собран каркас: hero, каталог (вкладки Blansh/Nuar, дропы, попап аромата),
  дистрибуция/карта регионов, партнёрам (форма), «Нам доверяют», «Команда AHFT»,
  контакты, футер.
- `src/map.ts`: карта по `regions.json`, десктоп-карта + мобильный список,
  карточка региона `sticky top-8 basis-80`. Фраза «Уточните наличие…» из cardText удалена.
- `contactForm.ts`: форма #join, поля name/contact/city.

### Анализ apple.com и применённые улучшения (типографика первого экрана)
- Изучены типографика, отступы, иерархия, компоновка, UI/UX приёмов apple.com;
  выдан список из 10 улучшений для лендинга.
- **Применено (пункты 1, 2, 3, 5):**
  - h1: `leading-[1.2] → leading-[1.1]` (sans, ~87.12px line-height на 1440 высчитано).
    От 1.05 отказались — рискованно для кириллических нижних выносных У/Д/Ц/Щ.
  - Все h2 (Дистрибуция/Сотрудничество/Нам доверяют/Команда): `leading-[1.3] → leading-[1.1]`
    (`tracking` сохранился).
  - h3 карточек: `font-bold → font-medium` (вес 500). Третий h3 с весом 700 —
    это `.aroma-popup__title` в попапе аромата, он намеренно оставлен bold.
  - Eyebrow-лейблы (капс-строка над h2) по секциям: «Дистрибуция», «Сотрудничество»,
    «Нам доверяют», «Команда AHFT» → `<p class="mb-4 text-[0.825rem] font-medium
    uppercase tracking-[0.5px] text-mute">`.
  - Каталог — product-плашка: `<section id="catalog" class="bg-surface py-12 md:py-20">`.
  - Пункт 4 (вторичные CTA текстом) НЕ применялся: в разметке нет ни одной пары кнопок —
    паттерн «один primary-CTA» соблюдён и так.
- Проверка (скрипт `/tmp/ahft-apple.mjs`, Playwright+Chrome): h1 line-height 87.12px,
  фон каталога белый в light, 4 eyebrow на месте, веса h3 500/500/700.

### Бейдж на кнопке героя — история и удаление
1. Был красный кружок «3» (`h-8 w-8 text-[1.1rem]`).
2. По просьбе стал капсула «NEW DROP» (`px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.5px]`).
3. Затем удалён полностью: `<span class="badge">` и правило `.badge` в `src/style.css`
   убраны; кнопка героя теперь `<a href="#catalog" class="btn mt-10">Каталог ароматов</a>`.
- **Остатки, проверенные и вычищенные:** `.hero-btn` (неиспользуемое) удалён,
  `design.md` обновлён.
- **TODO (согласовать у владельца):** корневой `style.css` (12.7KB, от 10 сент) —
  устаревший НЕимпортируемый дубль; до сих пор содержит `.badge`/`.hero-btn` и
  прочий легаси. Предлагается удалить файл целиком.

### Правки формы (#join) — финальное состояние
- Текст «Заполните форму — мы свяжемся…»: **без** `mb-4` (убрано).
- Форма: `class="contact-form flex mt-6 max-w-[600px] flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-20 md:gap-y-6"`.
  Итоговый зазор текст→форма = **24px** (mb-4 у текста удалён, форма получила `mt-6`).
- Подпись «* Отправляя данные даю согласие…»: **без** `mt-6` (правка откачена по просьбе),
  класс: `max-w-[600px] text-center text-[0.83rem] leading-[1.45] text-mute md:col-span-2`.

### Тема
- Тёмная по умолчанию → **светлая по умолчанию**:
  `src/theme.ts`, `getInitialDark()`: убрана зависимость от
  `prefers-color-scheme: dark`, без сохранённого выборa возвращается `false` (light).
  Сохранённый пользовательский `localStorage['ahft-theme']` по-прежнему уважается.
- Токены: light bg #f4f4f1 / ink #1a1a1a / mute #6b6b6b / surface #fff;
  dark bg #0f0f11 / ink #ededed / surface #1c1c1e. (design.md: bg light #fafafa — сверить,
  фактически фон #f4f4f1.)
- Тема: класс `dark` на `<html>` + localStorage; тогл — логотип(#theme-logo).

### Логотипы и подвал
- Каталог: `b_full-logo_inverse.svg`, `n_full-logo.svg` — белые со своей чёрной плашкой:
  light — без фильтра, dark — `invert(1)`.
- Подвальные `blansh_logo.svg`, `nuar_logo.svg` — чёрные: `invert(1)` только в dark.
- iOS status bar: логотип AHFT и тогл темы — отдельные fixed-элементы, `mix-blend-difference`;
  запрет на full-width fixed-шапку; `main { margin-top: 100px }`.

## Развёртывание (public)

### Netlify — 🔴 онлайн
- Сайт: `ahft-hookah-tobacco`, id `732e3359-ff34-4d51-a388-d510bed2138f`
- **Публичный URL: https://ahft-hookah-tobacco.netlify.app** (сейчас отвечает 200).
- Аккаунт: dmt.dobri@gmail.com, team «dmt-dobri’s team».
- CLI установлен глобально: `netlify-cli@27.5.2`, авторизован.
- Команда редеплоя: `netlify deploy --prod --dir dist --site 732e3359-ff34-4d51-a388-d510bed2138f`
- Нюанс: новые сайты Netlify включает **Edge Access** (защиту входа) по умолчанию —
  публичный URL отдаёт 401 с редиректом на `app.netlify.com/edge-access`. Лечится только
  в дашборде: Site configuration → Access Control → Edge Access → Public. Уже отключено.
- CLI-edge-access не управляется; API-эндпоинтов `access-policy`/`edge-access` на api.netlify.com
  нет (404).

### GitHub Pages — план (НЕ выполнен, ждёт пользователя)
Вопрос был «на GitHub можно развернуть публичную ссылку?» — **да, реально**:
- `github.com` + `api.github.com` доступны и быстрые; git push по HTTPS пройдёт.
- **Блокер окружения:** CDN релизов (`objects.githubusercontent.com`) недоступен →
  нельзя скачать бинарник `gh`; `brew install gh` завис (>10 мин). Поэтому **без gh-cli**,
  работаем чистым git + GitHub REST API.
- Что нужно от пользователя:
  1. GitHub-аккаунт (нейм) — у кого создавать репозиторий.
  2. Classic PAT: https://github.com/settings/tokens/new со scope `repo` (достаточно для
     плана «dist на ветку gh-pages»). Если хотят сборку на GitHub Actions — ещё scope `workflow`.
  3. Имя репозитория.
- Рекомендованный план: `main` = исходники, `gh-pages` = готовый `dist/`
  (без Actions — проще и быстрее):
  `git init` → `git add` → commit → `git remote add origin https://<TOKEN>@github.com/<OWNER>/<REPO>.git`
  → `git push -u origin main` → создать ветку `gh-pages` с содержимым `dist/`
  (orphan), push → API `POST /repos/{owner}/{repo}/pages` с `source: gh-pages`.
- Пока GitHub не нужен — уже есть Netlify-public. Можно делать сайт скачайним в двух местах.

## Открытые задачи
- [ ] **href контактов:** Телеграм и «Макс» в контактах всё ещё `href="#"` — нужны реальные
      ссылки (Telegram `https://t.me/...`, другие мессенджеры/телефон).
- [ ] **GitHub Pages:** ждём от пользователя аккаунт + PAT + имя репо (см. план выше).
- [ ] **Корневой `style.css`:** согласовать удаление устаревшего неимпортируемого дубля
      (содержит старый `.badge`, `.hero-btn`).
- [ ] **Проверка консистентности:** сверить фактический light-bg (#f4f4f1) с design.md (#fafafa).

## Команды-шпаргалка
- Сборка + превью: см. выше.
- Редeплой Netlify: `netlify deploy --prod --dir dist --site 732e3359-ff34-4d51-a388-d510bed2138f`
- Проверка сети: `curl -s -o /dev/null -w "%{http_code}" <url>` (Netlify 200, GitHub API 401 без токена).

## Хронология ключевых решений
- Компактный leading (1.1) вместо 1.05 — из-за кириллических выносных.
- Eyebrow-лейблы — усиливают иерархию Apple-стиля; копию можно менять.
- Каталог на поверхности — product-плашка (как у Apple для покупочных блоков).
- Один акцент — красный только hover/кнопки (изначально был badge «3»/«NEW DROP» — удалён).
- Форма и подпись в #join прижаты к стандартной шкале (24px, без лишних mt).