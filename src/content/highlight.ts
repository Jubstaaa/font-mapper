import { getCachedFontElements } from './used-fonts'

const HIGHLIGHT_STYLE_ID = '__font_mapper_highlight_style__'
const HIGHLIGHT_CLASS = '__font_mapper_highlight__'

export function clearHighlight(): void {
    document.querySelectorAll('.' + HIGHLIGHT_CLASS).forEach(el => {
        el.classList.remove(HIGHLIGHT_CLASS)
    })
}

export function highlightFont(fontName: string): void {
    ensureHighlightStyle()
    clearHighlight()
    const list = getCachedFontElements(fontName)
    if (!list) return
    for (const ref of list) {
        const el = ref.deref()
        if (el?.isConnected) el.classList.add(HIGHLIGHT_CLASS)
    }
}

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- lib.dom types this as non-null, but a document_start content script runs before it exists
    ;(document.documentElement || document).appendChild(el)
}
