export function httpHostname(url: string | undefined): null | string {
    if (!url) return null
    let parsed: URL

    try {
        parsed = new URL(url)
    } catch {
        return null
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? parsed.hostname
        : null
}
