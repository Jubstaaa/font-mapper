import { GENERIC_KEYWORDS } from '@/lib/font-family'

import { getOverrideState } from './element-override'
import { parseFontFamilyChain, pickPickerName } from './font-chain'

const fontElementCache = new Map<string, WeakRef<Element>[]>()

export function collectUsedFonts(): string[] {
    const chainCache = new Map<Element, string[]>()
    fontElementCache.clear()
    const found = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- lib.dom types this as non-null, but a document_start content script runs before it exists
    if (!document.body) return []
    const nodes = document.body.querySelectorAll('*')
    const allNodes: Element[] = [document.body, ...Array.from(nodes)]
    for (const node of allNodes) {
        const chain = chainForElement(node, chainCache)
        if (!chain.length) continue

        let namedAdded = false
        for (const entry of chain) {
            const cleaned = pickPickerName(entry)
            if (!cleaned) continue
            const k = cleaned.toLowerCase()
            if (GENERIC_KEYWORDS.has(k)) continue
            found.add(cleaned)
            indexCache(cleaned, node)
            namedAdded = true
            break
        }

        if (namedAdded) continue

        for (let i = chain.length - 1; i >= 0; i--) {
            const raw = chain[i]
            if (raw === undefined) continue
            const cleaned = pickPickerName(raw)
            if (!cleaned) continue
            const k = cleaned.toLowerCase()
            if (!GENERIC_KEYWORDS.has(k)) continue
            found.add(cleaned)
            indexCache(cleaned, node)
            break
        }
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b))
}

export function getCachedFontElements(
    name: string
): undefined | WeakRef<Element>[] {
    return fontElementCache.get(name)
}

function chainForElement(
    node: Element,
    chainCache: Map<Element, string[]>
): string[] {
    const cached = chainCache.get(node)
    if (cached) return cached
    const result = computeChainForElement(node, chainCache)
    chainCache.set(node, result)
    return result
}

function computeChainForElement(
    node: Element,
    chainCache: Map<Element, string[]>
): string[] {
    const state = getOverrideState(node)
    if (state) return state.originalChain
    const family = window.getComputedStyle(node).fontFamily
    if (!family) return []
    const parent = node.parentElement
    if (parent) {
        const parentFamily = window.getComputedStyle(parent).fontFamily
        if (parentFamily === family) {
            return chainForElement(parent, chainCache)
        }
    }
    return parseFontFamilyChain(family)
}

function indexCache(name: string, node: Element): void {
    let list = fontElementCache.get(name)
    if (!list) {
        list = []
        fontElementCache.set(name, list)
    }
    list.push(new WeakRef(node))
}
