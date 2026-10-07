const PREPOSITIONS = /\b([аяеоуюиыэьъ]в|[аяеоуюиыэьъ]на|[аяеоуюиыэьъ]с|[аяеоуюиыэьъ]к|[аяеоуюиыэьъ]о|[аяеоуюиыэьъ]у|[аяеоуюиыэьъ]из|[аяеоуюиыэьъ]по|[аяеоуюиыэьъ]до|[аяеоуюиыэьъ]от|[аяеоуюиыэьъ]за|[аяеоуюиыэьъ]под|[аяеоуюиыэьъ]над|[аяеоуюиыэьъ]без|[аяеоуюиыэьъ]для|[аяеоуюиыэьъ]при|[аяеоуюиыэьъ]про|[аяеоуюиыэьъ]через|[аяеоуюиыэьъ]между|[аяеоуюиыэьъ]около|[аяеоуюиыэьъ]после|[аяеоуюиыэьъ]перед|[аяеоуюиыэьъ]вокруг|(?<![а-яА-ЯёЁ])в |(?<![а-яА-ЯёЁ])на |(?<![а-яА-ЯёЁ])с |(?<![а-яА-ЯёЁ])к |(?<![а-яА-ЯёЁ])о |(?<![а-яА-ЯёЁ])у |(?<![а-яА-ЯёЁ])из |(?<![а-яА-ЯёЁ])по |(?<![а-яА-ЯёЁ])до |(?<![а-яА-ЯёЁ])от |(?<![а-яА-ЯёЁ])за |(?<![а-яА-ЯёЁ])под |(?<![а-яА-ЯёЁ])над |(?<![а-яА-ЯёЁ])без |(?<![а-яА-ЯёЁ])для |(?<![а-яА-ЯёЁ])при |(?<![а-яА-ЯёЁ])про |(?<![а-яА-ЯёЁ])через |(?<![а-яА-ЯёЁ])между |(?<![а-яА-ЯёЁ])около |(?<![а-яА-ЯёЁ])после |(?<![а-яА-ЯёЁ])перед |(?<![а-яА-ЯёЁ])вокруг )/gi;

const NBSP = '\u00A0';

function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        if (PREPOSITIONS.test(text)) {
            node.textContent = text.replace(PREPOSITIONS, (match) => match.replace(' ', NBSP));
        }
        return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'CODE' || el.tagName === 'PRE') return;
    if (el.contentEditable === 'true') return;
    for (const child of Array.from(el.childNodes)) processNode(child);
}

export function fixHangingPrepositions(): void {
    if (CSS.supports && CSS.supports('text-wrap', 'pretty')) return;
    processNode(document.body);
}