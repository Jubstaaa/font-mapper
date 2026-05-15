const STORAGE_KEY = 'fontMapperMappings'
const NONE_VALUE = '__none__'

const els = {
    domain: document.getElementById('domain'),
    loading: document.getElementById('loading'),
    empty: document.getElementById('empty'),
    restricted: document.getElementById('restricted'),
    list: document.getElementById('mappings'),
    count: document.getElementById('count'),
    reset: document.getElementById('reset'),
}

const state = {
    tabId: null,
    hostname: '',
    usedFonts: [],
    localFonts: [],
    mappings: {},
}

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab
}

function sendToTab(tabId, message) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, message, response => {
            void chrome.runtime.lastError
            resolve(response)
        })
    })
}

async function getUsedFonts(tabId) {
    const res = await sendToTab(tabId, { type: 'GET_USED_FONTS' })
    return res || { fonts: [], hostname: '' }
}

async function ensureContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
        })
    } catch (err) {
        void err
    }
}

function getLocalFonts() {
    return new Promise(resolve => {
        chrome.fontSettings.getFontList(fonts => {
            const seen = new Set()
            const list = []
            for (const f of fonts || []) {
                const name = f.displayName || f.fontId
                if (!name || seen.has(name)) continue
                seen.add(name)
                list.push(name)
            }
            list.sort((a, b) => a.localeCompare(b))
            resolve(list)
        })
    })
}

async function loadMappings(hostname) {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const all = result[STORAGE_KEY] || {}
    return all[hostname] || {}
}

async function saveMappings(hostname, mappings) {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const all = result[STORAGE_KEY] || {}
    if (Object.keys(mappings).length === 0) {
        delete all[hostname]
    } else {
        all[hostname] = mappings
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: all })
}

function show(el) {
    el.classList.remove('hidden')
}

function hide(el) {
    el.classList.add('hidden')
}

function updateCount() {
    const mapped = Object.keys(state.mappings).length
    const total = state.usedFonts.length
    els.count.textContent = `${total} font${total === 1 ? '' : 's'} · ${mapped} mapped`
    els.reset.disabled = mapped === 0
}

function render() {
    els.domain.textContent = state.hostname || '(unknown)'

    hide(els.loading)
    hide(els.empty)
    hide(els.restricted)

    if (!state.usedFonts.length) {
        show(els.empty)
        hide(els.list)
        updateCount()
        return
    }

    show(els.list)
    els.list.innerHTML = ''

    for (const font of state.usedFonts) {
        const li = document.createElement('li')
        li.className = 'row'

        const src = document.createElement('div')
        src.className = 'src'
        src.textContent = font
        src.title = font
        src.style.fontFamily = `'${font.replace(/'/g, "\\'")}', sans-serif`

        const arrow = document.createElement('div')
        arrow.className = 'arrow'
        arrow.textContent = '→'

        const select = document.createElement('select')
        select.className = 'select'
        select.dataset.source = font

        const noneOpt = document.createElement('option')
        noneOpt.value = NONE_VALUE
        noneOpt.textContent = '— No change —'
        select.appendChild(noneOpt)

        for (const lf of state.localFonts) {
            const opt = document.createElement('option')
            opt.value = lf
            opt.textContent = lf
            select.appendChild(opt)
        }

        const current = state.mappings[font]
        select.value = current && state.localFonts.includes(current) ? current : NONE_VALUE
        if (current) li.classList.add('mapped')

        select.addEventListener('change', onChange)

        li.appendChild(src)
        li.appendChild(arrow)
        li.appendChild(select)
        els.list.appendChild(li)
    }

    updateCount()
}

async function onChange(e) {
    const select = e.target
    const source = select.dataset.source
    const value = select.value
    const row = select.closest('.row')

    if (value === NONE_VALUE) {
        delete state.mappings[source]
        row?.classList.remove('mapped')
    } else {
        state.mappings[source] = value
        row?.classList.add('mapped')
    }

    await saveMappings(state.hostname, state.mappings)
    if (state.tabId != null) await sendToTab(state.tabId, { type: 'APPLY_MAPPINGS', mappings: state.mappings })
    updateCount()
}

async function onReset() {
    state.mappings = {}
    await saveMappings(state.hostname, state.mappings)
    if (state.tabId != null) await sendToTab(state.tabId, { type: 'APPLY_MAPPINGS', mappings: state.mappings })
    render()
}

async function init() {
    const tab = await getActiveTab()

    if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
        hide(els.loading)
        show(els.restricted)
        els.reset.disabled = true
        return
    }

    state.tabId = tab.id

    let result = await getUsedFonts(tab.id)
    if (!result.fonts || result.fonts.length === 0) {
        await ensureContentScript(tab.id)
        result = await getUsedFonts(tab.id)
    }

    const localFonts = await getLocalFonts()

    state.usedFonts = result.fonts || []
    state.hostname = result.hostname || new URL(tab.url).hostname
    state.localFonts = localFonts
    state.mappings = await loadMappings(state.hostname)

    render()
}

els.reset.addEventListener('click', onReset)
init()
