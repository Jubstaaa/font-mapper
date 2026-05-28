import { applyToElement, clearAllOverrides, hasMappings, walkAll } from './element-override'

function runIdle(cb: () => void, timeout = 200): void {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(cb, { timeout })
    } else {
        setTimeout(cb, 0)
    }
}

let scheduledWalk = false

export function scheduleWalk(): void {
    if (scheduledWalk) return
    scheduledWalk = true
    runIdle(() => {
        scheduledWalk = false
        walkAll()
    })
}

const pendingNew = new Set<HTMLElement>()
let pendingFlushScheduled = false

function flushPending(): void {
    pendingFlushScheduled = false
    if (!hasMappings()) {
        pendingNew.clear()
        return
    }
    for (const el of pendingNew) {
        if (!el.isConnected) continue
        applyToElement(el)
        const descendants = el.querySelectorAll<HTMLElement>('*')
        for (const child of descendants) applyToElement(child)
    }
    pendingNew.clear()
}

function schedulePendingFlush(): void {
    if (pendingFlushScheduled) return
    pendingFlushScheduled = true
    runIdle(flushPending)
}

const domObserver = new MutationObserver(records => {
    if (!hasMappings()) return
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (node instanceof HTMLElement) {
                pendingNew.add(node)
            }
        }
    }
    if (pendingNew.size > 0) schedulePendingFlush()
})

export function startObservers(): void {
    const root = document.documentElement
    if (root) domObserver.observe(root, { childList: true, subtree: true })
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null

export function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        resizeTimer = null
        if (!hasMappings()) return
        clearAllOverrides()
        walkAll()
    }, 200)
}
