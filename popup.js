const STORAGE_KEY = 'fontMapperMappings'

const els = {
    domain: document.getElementById('domain'),
    loading: document.getElementById('loading'),
    empty: document.getElementById('empty'),
    restricted: document.getElementById('restricted'),
    list: document.getElementById('mappings'),
    count: document.getElementById('count'),
    reset: document.getElementById('reset'),
    main: document.querySelector('.main'),
}

const state = {
    tabId: null,
    hostname: '',
    usedFonts: [],
    localFonts: [],
    mappings: {},
}

const comboboxes = new Set()

function closeAllComboboxes(except) {
    for (const cb of comboboxes) {
        if (cb !== except) cb.close()
    }
}

function clearComboboxes() {
    for (const cb of comboboxes) cb.close()
    comboboxes.clear()
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

function escapeCssFontName(name) {
    return String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function createCombobox({ options, initialValue, onSelect }) {
    let isOpen = false
    let filtered = options.slice()
    let highlightIndex = -1
    let committedValue = options.includes(initialValue) ? initialValue : ''

    const root = document.createElement('div')
    root.className = 'combobox'

    const wrap = document.createElement('div')
    wrap.className = 'combobox-input-wrap'

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'combobox-input'
    input.placeholder = 'Search fonts…'
    input.spellcheck = false
    input.autocomplete = 'off'
    input.value = committedValue
    if (committedValue) input.style.fontFamily = `'${escapeCssFontName(committedValue)}', sans-serif`

    const caret = document.createElement('span')
    caret.className = 'combobox-caret'
    caret.setAttribute('aria-hidden', 'true')
    caret.textContent = '▾'

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'combobox-clear'
    clearBtn.innerHTML = '&times;'
    clearBtn.title = 'Clear mapping'
    clearBtn.tabIndex = -1
    if (!committedValue) clearBtn.classList.add('hidden')

    const list = document.createElement('ul')
    list.className = 'combobox-list hidden'

    function renderList() {
        list.innerHTML = ''
        if (!filtered.length) {
            const li = document.createElement('li')
            li.className = 'combobox-empty'
            li.textContent = 'No matching fonts'
            list.appendChild(li)
            return
        }
        for (let i = 0; i < filtered.length; i++) {
            const opt = filtered[i]
            const li = document.createElement('li')
            li.className = 'combobox-option'
            if (i === highlightIndex) li.classList.add('active')
            if (opt === committedValue) li.classList.add('selected')
            li.textContent = opt
            li.style.fontFamily = `'${escapeCssFontName(opt)}', sans-serif`
            li.dataset.index = String(i)
            list.appendChild(li)
        }
    }

    function positionList() {
        const rect = input.getBoundingClientRect()
        const maxH = 220
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        list.style.left = rect.left + 'px'
        list.style.width = rect.width + 'px'
        if (spaceBelow >= maxH || spaceBelow >= spaceAbove) {
            list.style.top = (rect.bottom + 2) + 'px'
            list.style.maxHeight = Math.min(maxH, spaceBelow - 8) + 'px'
        } else {
            list.style.top = (rect.top - Math.min(maxH, spaceAbove - 8) - 2) + 'px'
            list.style.maxHeight = Math.min(maxH, spaceAbove - 8) + 'px'
        }
    }

    function scrollActiveIntoView() {
        const el = list.querySelector('.combobox-option.active')
        if (el) el.scrollIntoView({ block: 'nearest' })
    }

    function open() {
        if (isOpen) return
        closeAllComboboxes(api)
        isOpen = true
        list.classList.remove('hidden')
        filtered = options.slice()
        highlightIndex = committedValue ? filtered.indexOf(committedValue) : -1
        renderList()
        positionList()
        if (highlightIndex >= 0) scrollActiveIntoView()
        input.select()
    }

    function close() {
        if (!isOpen) return
        isOpen = false
        list.classList.add('hidden')
        input.value = committedValue
        if (committedValue) {
            input.style.fontFamily = `'${escapeCssFontName(committedValue)}', sans-serif`
        } else {
            input.style.fontFamily = ''
        }
    }

    function commit(value) {
        if (!value) {
            committedValue = ''
            input.value = ''
            input.style.fontFamily = ''
            clearBtn.classList.add('hidden')
            onSelect(null)
        } else {
            committedValue = value
            input.value = value
            input.style.fontFamily = `'${escapeCssFontName(value)}', sans-serif`
            clearBtn.classList.remove('hidden')
            onSelect(value)
        }
        isOpen = false
        list.classList.add('hidden')
    }

    input.addEventListener('focus', open)
    input.addEventListener('mousedown', () => {
        if (!isOpen) open()
    })
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase()
        filtered = q ? options.filter(o => o.toLowerCase().includes(q)) : options.slice()
        highlightIndex = filtered.length ? 0 : -1
        if (!isOpen) {
            closeAllComboboxes(api)
            isOpen = true
            list.classList.remove('hidden')
            positionList()
        }
        renderList()
    })
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!isOpen) { open(); return }
            if (filtered.length) {
                highlightIndex = (highlightIndex + 1) % filtered.length
                renderList()
                scrollActiveIntoView()
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!isOpen) { open(); return }
            if (filtered.length) {
                highlightIndex = (highlightIndex - 1 + filtered.length) % filtered.length
                renderList()
                scrollActiveIntoView()
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (isOpen && highlightIndex >= 0) commit(filtered[highlightIndex])
        } else if (e.key === 'Escape') {
            e.preventDefault()
            close()
            input.blur()
        } else if (e.key === 'Tab') {
            close()
        }
    })

    list.addEventListener('mousedown', e => {
        e.preventDefault()
        const li = e.target.closest('.combobox-option')
        if (!li) return
        const idx = Number(li.dataset.index)
        commit(filtered[idx])
    })

    clearBtn.addEventListener('mousedown', e => {
        e.preventDefault()
        e.stopPropagation()
        commit(null)
    })

    wrap.appendChild(input)
    wrap.appendChild(clearBtn)
    wrap.appendChild(caret)
    root.appendChild(wrap)
    root.appendChild(list)

    const api = {
        root,
        close,
        getValue: () => committedValue,
    }
    comboboxes.add(api)
    return api
}

function render() {
    els.domain.textContent = state.hostname || '(unknown)'

    hide(els.loading)
    hide(els.empty)
    hide(els.restricted)

    clearComboboxes()
    els.list.innerHTML = ''

    if (!state.usedFonts.length) {
        show(els.empty)
        hide(els.list)
        updateCount()
        return
    }

    show(els.list)

    for (const font of state.usedFonts) {
        const li = document.createElement('li')
        li.className = 'row'
        if (state.mappings[font]) li.classList.add('mapped')

        const src = document.createElement('div')
        src.className = 'src'
        src.textContent = font
        src.title = font
        src.style.fontFamily = `'${escapeCssFontName(font)}', sans-serif`

        const arrow = document.createElement('div')
        arrow.className = 'arrow'
        arrow.textContent = '→'

        const cb = createCombobox({
            options: state.localFonts,
            initialValue: state.mappings[font] || '',
            onSelect: async value => {
                if (value === null) {
                    delete state.mappings[font]
                    li.classList.remove('mapped')
                } else {
                    state.mappings[font] = value
                    li.classList.add('mapped')
                }
                await saveMappings(state.hostname, state.mappings)
                if (state.tabId != null) {
                    await sendToTab(state.tabId, { type: 'APPLY_MAPPINGS', mappings: state.mappings })
                }
                updateCount()
            },
        })

        li.appendChild(src)
        li.appendChild(arrow)
        li.appendChild(cb.root)
        els.list.appendChild(li)
    }

    updateCount()
}

async function onReset() {
    state.mappings = {}
    await saveMappings(state.hostname, state.mappings)
    if (state.tabId != null) {
        await sendToTab(state.tabId, { type: 'APPLY_MAPPINGS', mappings: state.mappings })
    }
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

document.addEventListener('mousedown', e => {
    if (!e.target.closest('.combobox')) {
        closeAllComboboxes(null)
    }
})

els.main.addEventListener('scroll', () => closeAllComboboxes(null), { passive: true })
window.addEventListener('resize', () => closeAllComboboxes(null))

init()
