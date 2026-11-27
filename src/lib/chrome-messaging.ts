import type { FontMap } from './chrome-storage.types'

export const POPUP_PORT_NAME = 'font-mapper-popup'

export interface ApplyMappingsMessage {
    mappings: FontMap
    type: 'APPLY_MAPPINGS'
}

export interface ApplyMappingsResponse {
    ok: true
}

export interface ClearHighlightMessage {
    type: 'CLEAR_HIGHLIGHT'
}

export type ExtensionMessage =
    | ApplyMappingsMessage
    | ClearHighlightMessage
    | GetUsedFontsMessage
    | HighlightFontMessage

export interface GetUsedFontsMessage {
    type: 'GET_USED_FONTS'
}

export interface GetUsedFontsResponse {
    fonts: string[]
    hostname: string
}

export interface HighlightFontMessage {
    font: string
    type: 'HIGHLIGHT_FONT'
}

export type PortMessage = ClearHighlightMessage | HighlightFontMessage

export function sendToTab<TResponse>(
    tabId: number,
    message: ExtensionMessage
): Promise<TResponse | undefined> {
    return chrome.tabs
        .sendMessage<ExtensionMessage, TResponse>(tabId, message)
        .catch(() => undefined)
}
