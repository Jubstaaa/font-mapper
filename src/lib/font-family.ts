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

export function quoteFamily(name: string): string {
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name) && !GENERIC_KEYWORDS.has(name.toLowerCase())) {
        return name
    }
    return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
