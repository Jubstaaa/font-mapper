export interface CachedLocalFont {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

export interface FontMapping {
    name: string
    id?: string
    scale?: number
    bold?: boolean
    italic?: boolean
    lineHeight?: number
    letterSpacing?: number
    wordSpacing?: number
    color?: string
}

export type FontMap = Record<string, FontMapping>
export type FontMapStore = Record<string, FontMap>

export interface ExportPayload {
    version: 1
    exportedAt: string
    mappings: FontMapStore
}
