import chromeWebstoreUpload from 'chrome-webstore-upload'

import {
    assertPublishAccepted,
    assertUploadSucceeded,
    readPublishEnv,
} from './chrome-web-store'

const UPLOAD_WAIT_SECONDS = 120

const { accessToken, extensionId, publisherId, zipPath } = readPublishEnv(
    process.env
)

const store = chromeWebstoreUpload({
    clientId: 'unused-with-access-token',
    clientSecret: undefined,
    extensionId,
    publisherId,
    refreshToken: 'unused-with-access-token',
})
store.fetchToken = () => Promise.resolve(accessToken)

const upload = await store.uploadExisting(
    zipPath,
    accessToken,
    UPLOAD_WAIT_SECONDS
)
assertUploadSucceeded(upload)
console.log(`Uploaded ${upload.itemId} version ${upload.crxVersion}`)

const published = await store.publish('DEFAULT_PUBLISH', accessToken)
assertPublishAccepted(published)
console.log(
    `Submitted ${published.itemId} for publishing, state ${published.state}`
)
