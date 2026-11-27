import type { ItemResource, PublishResponse } from 'chrome-webstore-upload'

export interface PublishEnv {
    accessToken: string
    extensionId: string
    publisherId: string
    zipPath: string
}

const ACCEPTED_PUBLISH_STATES = new Set([
    'PENDING_REVIEW',
    'PUBLISHED',
    'PUBLISHED_TO_TESTERS',
    'STAGED',
])

export function assertPublishAccepted(response: PublishResponse): void {
    if (!ACCEPTED_PUBLISH_STATES.has(response.state)) {
        throw new Error(
            `Chrome Web Store publish of ${response.name} ended in state ${response.state}`
        )
    }
}

export function assertUploadSucceeded(item: ItemResource): void {
    if (item.uploadState !== 'SUCCEEDED') {
        throw new Error(
            `Chrome Web Store upload of ${item.name} ended in state ${item.uploadState}`
        )
    }
}

export function readPublishEnv(
    env: Record<string, string | undefined>
): PublishEnv {
    const { ACCESS_TOKEN, EXTENSION_ID, PUBLISHER_ID, ZIP_PATH } = env
    if (!ACCESS_TOKEN || !EXTENSION_ID || !PUBLISHER_ID || !ZIP_PATH) {
        const missing = Object.entries({
            ACCESS_TOKEN,
            EXTENSION_ID,
            PUBLISHER_ID,
            ZIP_PATH,
        })
            .filter(([, value]) => !value)
            .map(([key]) => key)
        throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
    return {
        accessToken: ACCESS_TOKEN,
        extensionId: EXTENSION_ID,
        publisherId: PUBLISHER_ID,
        zipPath: ZIP_PATH,
    }
}
