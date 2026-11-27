export interface CachedLocalFont {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

export interface ExportPayload {
    exportedAt: string
    mappings: FontMapStore
    version: 1
}

export type FontMap = Record<string, FontMapping>
export interface FontMapping {
    bold?: boolean | undefined
    color?: string | undefined
    id?: string | undefined
    italic?: boolean | undefined
    letterSpacing?: number | undefined
    lineHeight?: number | undefined
    name: string
    scale?: number | undefined
    wordSpacing?: number | undefined
}

export type FontMapStore = Record<string, FontMap>
