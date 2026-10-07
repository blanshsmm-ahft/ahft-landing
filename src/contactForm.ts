export function initContactForm(): void {
    const form = document.querySelector<HTMLFormElement>('.contact-form');
    if (!form) return;

    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const fields = ['name', 'phone', 'email', 'company', 'geography']
        .map((name) => form.elements.namedItem(name))
        .filter((el): el is HTMLInputElement | HTMLTextAreaElement => !!el);

    // Телефон (по просьбе): в поле ТОЛЬКО цифры и «+». Авто-префикс «+7»
    // подставляется ТОЛЬКО при установке курсора (focus); в обычном состоянии
    // поле пустое и показывает плейсхолдер «Телефон». Сброс после отправки —
    // пустое значение (value-атрибута в HTML больше НЕТ).
    const phone = form.elements.namedItem('phone');
    const sanitizePhone = (): void => {
        if (!(phone instanceof HTMLInputElement)) return;
        const leadPlus = phone.value.startsWith('+');
        const digits = phone.value.replace(/\D/g, '').slice(0, 15);
        const next = (leadPlus ? '+' : '') + digits;
        if (next !== phone.value) phone.value = next;
    };
    if (phone instanceof HTMLInputElement) {
        // Слушатель sanitize РЕГИСТРИРУЕТСЯ ДО updateButton-слушателей,
        // чтобы гейт видел уже очищенное значение.
        phone.addEventListener('input', sanitizePhone);
        phone.addEventListener('focus', () => {
            if (phone.value === '') {
                phone.value = '+7';
                phone.setSelectionRange(phone.value.length, phone.value.length);
            }
        });
        phone.addEventListener('blur', () => {
            // Не введено ничего кроме кода/плюса → вернуть обычное состояние
            // (пусто, виден плейсхолдер «Телефон»).
            if (phone.value === '' || phone.value === '+' || phone.value === '+7') {
                phone.value = '';
            }
            updateButton();
        });
    }

    // Кнопка активна только когда заполнены ВСЕ 5 полей (по просьбе:
    // «если поле не заполнено, кнопка отправить не активна» — решение
    // пользователя: гейтом служат все поля, не только required).
    // Для телефона «+7» само по себе = НЕ заплено (нужен код и номер),
    // иначе авто-префикс обнулял бы гейт этого поля.
    const isFilled = (field: HTMLInputElement | HTMLTextAreaElement): boolean => {
        if (field.name === 'phone') return field.value.replace(/\D/g, '').length > 1;
        return field.value.trim().length > 0;
    };
    const updateButton = (): void => {
        if (!button) return;
        button.disabled = fields.some((field) => !isFilled(field));
    };

    fields.forEach((field) => {
        field.addEventListener('input', updateButton);
        field.addEventListener('change', updateButton);
    });
    updateButton();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (button) button.disabled = true;

        // FormSubmit.co: обычный POST на action формы + заголовок
        // Accept: application/json → ответ JSON, без редиректа на их страницу.
        // Статусные сообщения («Спасибо!…» / «Не удалось…») УДАЛЕНЫ по просьбе.
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(String(res.status));
            form.reset();
        } catch (err) {
            console.error('Form submit failed', err);
        } finally {
            updateButton();
        }
    });
}
