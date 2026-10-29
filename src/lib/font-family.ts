export const GENERIC_KEYWORDS = new Set([
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'math',
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'ui-rounded',
    'emoji',
    'fangsong',
    '-apple-system',
    'blinkmacsystemfont',
])

const CSS_WIDE_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer', 'default'])

export function quoteFamily(name: string): string {
    const lower = name.toLowerCase()
    if (
        /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name) &&
        !GENERIC_KEYWORDS.has(lower) &&
        !CSS_WIDE_KEYWORDS.has(lower)
    ) {
        return name
    }
    return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
