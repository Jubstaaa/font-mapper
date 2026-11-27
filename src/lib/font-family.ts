export const GENERIC_KEYWORDS = new Set([
    '-apple-system',
    'blinkmacsystemfont',
    'cursive',
    'emoji',
    'fangsong',
    'fantasy',
    'math',
    'monospace',
    'sans-serif',
    'serif',
    'system-ui',
    'ui-monospace',
    'ui-rounded',
    'ui-sans-serif',
    'ui-serif',
])

export const CSS_WIDE_KEYWORDS = new Set([
    'inherit',
    'initial',
    'revert',
    'revert-layer',
    'unset',
])

const RESERVED_FAMILY_NAMES = new Set([...CSS_WIDE_KEYWORDS, 'default'])

export function quoteFamily(name: string): string {
    const lower = name.toLowerCase()
    if (
        /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name) &&
        !GENERIC_KEYWORDS.has(lower) &&
        !RESERVED_FAMILY_NAMES.has(lower)
    ) {
        return name
    }
    return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
