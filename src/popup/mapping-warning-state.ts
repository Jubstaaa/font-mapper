export type MappingWarningKind = 'missing' | 'orphan'

export function deriveMappingWarning(args: {
    mappedName: null | string
    sourceOnPage: boolean
    targetAvailable: boolean
}): null | { kind: MappingWarningKind; label: string; tooltip: string } {
    const { mappedName, sourceOnPage, targetAvailable } = args
    if (!sourceOnPage) {
        return {
            kind: 'orphan',
            label: 'Not used on this page',
            tooltip:
                "This site doesn't use this font, so the mapping is dormant here. It will still apply on sites that do use it.",
        }
    }
    if (mappedName && !targetAvailable) {
        return {
            kind: 'missing',
            label: 'Target font missing',
            tooltip: `"${mappedName}" isn't installed on this device, so this mapping isn't applied here. Install it locally or pick a different replacement.`,
        }
    }
    return null
}
