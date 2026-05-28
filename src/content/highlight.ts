import { getCachedFontElements } from './used-fonts'

const HIGHLIGHT_STYLE_ID = '__font_mapper_highlight_style__'
const HIGHLIGHT_CLASS = '__font_mapper_highlight__'

function ensureHighlightStyle(): void {
    if (document.getElementById(HIGHLIGHT_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = HIGHLIGHT_STYLE_ID
    el.textContent = `
        .${HIGHLIGHT_CLASS} {
            background-color: rgba(37, 99, 235, 0.12) !important;
            transition: background-color 80ms ease !important;
        }
    `
    ;(document.documentElement || document).appendChild(el)
}

export function highlightFont(fontName: string): void {
    ensureHighlightStyle()
    clearHighlight()
    const list = getCachedFontElements(fontName)
    if (!list) return
    for (const ref of list) {
        const el = ref.deref()
        if (el && el.isConnected) el.classList.add(HIGHLIGHT_CLASS)
    }
}

export function clearHighlight(): void {
    document.querySelectorAll('.' + HIGHLIGHT_CLASS).forEach(el => el.classList.remove(HIGHLIGHT_CLASS))
}
