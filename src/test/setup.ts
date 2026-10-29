import '@webext-core/fake-browser/auto'
import { fakeBrowser } from '@webext-core/fake-browser'
import { beforeEach } from 'vitest'

beforeEach(() => {
    fakeBrowser.reset()
})
