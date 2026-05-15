const STORAGE_KEY = 'fontMapperMappings'
const STYLE_ID = '__font_mapper_style__'

function escapeFontName(name) {
    return String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function buildCss(mappings) {
    const rules = []
    for (const [src, target] of Object.entries(mappings || {})) {
        if (!target) continue
        const s = escapeFontName(src)
        const t = escapeFontName(target)
        rules.push(
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: normal; font-weight: 100 1000; font-display: swap; }`,
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: italic; font-weight: 100 1000; font-display: swap; }`,
        )
    }
    return rules.join('\n')
}

function applyStyle(css) {
    const root = document.documentElement || document
    let el = document.getElementById(STYLE_ID)
    if (!el) {
        el = document.createElement('style')
        el.id = STYLE_ID
        root.appendChild(el)
    }
    el.textContent = css
}

async function loadMappingsForHost() {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const all = result[STORAGE_KEY] || {}
    return all[location.hostname] || {}
}

function collectUsedFonts() {
    const found = new Set()
    const nodes = document.querySelectorAll('body, body *')
    for (const node of nodes) {
        if (!(node instanceof Element)) continue
        const family = window.getComputedStyle(node).fontFamily
        if (!family) continue
        const first = family.split(',')[0].trim().replace(/^["']|["']$/g, '')
        if (first && !first.startsWith('-') && first.toLowerCase() !== 'inherit') {
            found.add(first)
        }
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b))
}

async function init() {
    try {
        const mappings = await loadMappingsForHost()
        applyStyle(buildCss(mappings))
    } catch (err) {
        void err
    }
}

init()

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return
    const all = changes[STORAGE_KEY].newValue || {}
    applyStyle(buildCss(all[location.hostname] || {}))
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'GET_USED_FONTS') {
        sendResponse({ fonts: collectUsedFonts(), hostname: location.hostname })
        return false
    }
    if (msg?.type === 'APPLY_MAPPINGS') {
        applyStyle(buildCss(msg.mappings || {}))
        sendResponse({ ok: true })
        return false
    }
    return false
})
