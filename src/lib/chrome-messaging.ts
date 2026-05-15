import type { FontMap } from './chrome-storage'

export interface GetUsedFontsMessage {
    type: 'GET_USED_FONTS'
}

export interface GetUsedFontsResponse {
    fonts: string[]
    hostname: string
}

export interface ApplyMappingsMessage {
    type: 'APPLY_MAPPINGS'
    mappings: FontMap
}

export interface ApplyMappingsResponse {
    ok: true
}

export type ExtensionMessage = GetUsedFontsMessage | ApplyMappingsMessage

export function sendToTab<TResponse>(tabId: number, message: ExtensionMessage): Promise<TResponse | undefined> {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, message, (response: TResponse) => {
            void chrome.runtime.lastError
            resolve(response)
        })
    })
}
