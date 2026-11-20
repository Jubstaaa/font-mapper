import type { ItemResource, PublishResponse } from 'chrome-webstore-upload'
import { describe, expect, it } from 'vitest'

import { assertPublishAccepted, assertUploadSucceeded, readPublishEnv } from './chrome-web-store'

const ITEM_NAME = 'publishers/publisher/items/extension'

function upload(uploadState: ItemResource['uploadState']): ItemResource {
    return { crxVersion: '1.2.3', itemId: 'extension', name: ITEM_NAME, uploadState }
}

function publish(state: string): PublishResponse {
    return { itemId: 'extension', name: ITEM_NAME, state }
}

describe('readPublishEnv', () => {
    const complete = {
        ACCESS_TOKEN: 'token',
        EXTENSION_ID: 'extension',
        PUBLISHER_ID: 'publisher',
        ZIP_PATH: 'extension.zip',
    }

    it('returns the publish settings when every variable is set', () => {
        expect(readPublishEnv(complete)).toEqual({
            accessToken: 'token',
            extensionId: 'extension',
            publisherId: 'publisher',
            zipPath: 'extension.zip',
        })
    })

    it('names every missing or empty variable', () => {
        expect(() => readPublishEnv({ ...complete, ACCESS_TOKEN: '', ZIP_PATH: undefined })).toThrow(
            'Missing environment variables: ACCESS_TOKEN, ZIP_PATH',
        )
    })
})

describe('assertUploadSucceeded', () => {
    it('accepts a succeeded upload', () => {
        expect(() => assertUploadSucceeded(upload('SUCCEEDED'))).not.toThrow()
    })

    it.each(['FAILED', 'IN_PROGRESS', 'NOT_FOUND', 'UPLOAD_STATE_UNSPECIFIED'] as const)(
        'rejects an upload in state %s',
        state => {
            expect(() => assertUploadSucceeded(upload(state))).toThrow(
                `Chrome Web Store upload of ${ITEM_NAME} ended in state ${state}`,
            )
        },
    )
})

describe('assertPublishAccepted', () => {
    it.each(['PENDING_REVIEW', 'PUBLISHED', 'PUBLISHED_TO_TESTERS', 'STAGED'])('accepts state %s', state => {
        expect(() => assertPublishAccepted(publish(state))).not.toThrow()
    })

    it.each(['REJECTED', 'CANCELLED', 'ITEM_STATE_UNSPECIFIED', 'SOMETHING_NEW'])('rejects state %s', state => {
        expect(() => assertPublishAccepted(publish(state))).toThrow(
            `Chrome Web Store publish of ${ITEM_NAME} ended in state ${state}`,
        )
    })
})
