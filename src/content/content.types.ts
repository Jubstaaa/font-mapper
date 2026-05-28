export interface InlineSnapshot {
    value: string
    priority: string
}

export interface OverrideState {
    sourceKey: string
    targetSignature: string
    inlineFontFamily: InlineSnapshot
    inlineFontSize: InlineSnapshot
    inlineLineHeight: InlineSnapshot
    inlineLetterSpacing: InlineSnapshot
    inlineWordSpacing: InlineSnapshot
    inlineColor: InlineSnapshot
    originalComputedSizePx: number
    originalChain: string[]
}
