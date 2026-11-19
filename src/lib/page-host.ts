export function httpHostname(url: string | undefined): string | null {
    if (!url) return null
    let parsed: URL
    // URL.canParse needs Chrome 120; the manifest supports 103+.
    try {
        parsed = new URL(url)
    } catch {
        return null
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.hostname : null
}
