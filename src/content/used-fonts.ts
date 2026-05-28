import { getOverrideState } from './element-override'
import { GENERIC_KEYWORDS, parseFontFamilyChain, pickPickerName } from './font-chain'

const fontElementCache = new Map<string, WeakRef<Element>[]>()
const chainCache = new Map<Element, string[]>()

function computeChainForElement(node: Element): string[] {
    const state = getOverrideState(node)
    if (state) return state.originalChain
    const family = window.getComputedStyle(node).fontFamily
    if (!family) return []
    const parent = node.parentElement
    if (parent) {
        const parentFamily = window.getComputedStyle(parent).fontFamily
        if (parentFamily === family) {
            return chainForElement(parent)
        }
    }
    return parseFontFamilyChain(family)
}

function chainForElement(node: Element): string[] {
    const cached = chainCache.get(node)
    if (cached) return cached
    const result = computeChainForElement(node)
    chainCache.set(node, result)
    return result
}

function indexCache(name: string, node: Element): void {
    let list = fontElementCache.get(name)
    if (!list) {
        list = []
        fontElementCache.set(name, list)
    }
    list.push(new WeakRef(node))
}

export function collectUsedFonts(): string[] {
    chainCache.clear()
    fontElementCache.clear()
    const found = new Set<string>()
    if (!document.body) return []
    const nodes = document.body.querySelectorAll('*')
    const allNodes: Element[] = [document.body, ...Array.from(nodes)]
    for (const node of allNodes) {
        const chain = chainForElement(node)
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
            const cleaned = pickPickerName(chain[i])
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

export function getCachedFontElements(name: string): WeakRef<Element>[] | undefined {
    return fontElementCache.get(name)
}
